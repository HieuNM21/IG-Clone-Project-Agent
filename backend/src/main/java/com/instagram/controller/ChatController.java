package com.instagram.controller;

import com.instagram.dto.ChatMessageRequest;
import com.instagram.dto.ChatMessageResponse;
import com.instagram.model.User;
import com.instagram.service.ChatService;
import com.instagram.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.*;
import java.util.stream.Collectors;

@RestController
public class ChatController {

    private static final Logger logger = LoggerFactory.getLogger(ChatController.class);

    @Autowired
    private ChatService chatService;

    @Autowired
    private UserService userService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat.send")
    public void sendMessage(@Payload ChatMessageRequest request, Principal principal) {
        logger.info("WS message from {}: isGroup={}, groupId={}, receiverId={}",
                principal.getName(), request.isGroup(), request.getGroupId(), request.getReceiverId());
        User sender = userService.findByUsername(principal.getName());
        ChatMessageResponse response = chatService.saveMessage(request, sender);

        if (request.isGroup()) {
            String dest = "/topic/group." + request.getGroupId();
            messagingTemplate.convertAndSend(dest, response);
        } else {
            User receiver = userService.findById(request.getReceiverId());
            messagingTemplate.convertAndSendToUser(receiver.getUsername(), "/queue/messages", response);
            messagingTemplate.convertAndSendToUser(sender.getUsername(), "/queue/messages", response);
        }
    }

    @PostMapping("/api/chat/send")
    public ResponseEntity<ChatMessageResponse> sendMessageRest(
            @RequestBody ChatMessageRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        logger.info("REST chat from {}: isGroup={}, groupId={}, receiverId={}",
                userDetails.getUsername(), request.isGroup(), request.getGroupId(), request.getReceiverId());

        User sender = userService.findByUsername(userDetails.getUsername());
        ChatMessageResponse response = chatService.saveMessage(request, sender);

        if (request.isGroup()) {
            String dest = "/topic/group." + request.getGroupId();
            messagingTemplate.convertAndSend(dest, response);
        } else if (request.getReceiverId() != null) {
            User receiver = userService.findById(request.getReceiverId());
            messagingTemplate.convertAndSendToUser(receiver.getUsername(), "/queue/messages", response);
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/chat/messages/{userId}")
    public ResponseEntity<List<ChatMessageResponse>> getDirectMessages(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = userService.findByUsername(userDetails.getUsername());
        return ResponseEntity.ok(chatService.getDirectMessages(currentUser.getId(), userId));
    }

    @GetMapping("/api/chat/group/{groupId}")
    public ResponseEntity<List<ChatMessageResponse>> getGroupMessages(@PathVariable String groupId) {
        return ResponseEntity.ok(chatService.getGroupMessages(groupId));
    }

    // Conversations list with last message info
    @GetMapping("/api/chat/conversations")
    public ResponseEntity<List<Map<String, Object>>> getConversations(
            @AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = userService.findByUsername(userDetails.getUsername());
        List<User> partners = chatService.getConversations(currentUser.getId());

        List<Map<String, Object>> result = partners.stream().map(u -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", u.getId());
            map.put("username", u.getUsername());
            map.put("fullName", u.getFullName() != null ? u.getFullName() : "");
            map.put("avatarUrl", u.getAvatarUrl() != null ? u.getAvatarUrl() : "");

            ChatMessageResponse lastMsg = chatService.getLastDirectMessage(currentUser.getId(), u.getId());
            if (lastMsg != null) {
                map.put("lastMessage", lastMsg.getContent());
                map.put("lastMessageTime", lastMsg.getCreatedAt());
                map.put("lastMessageIsRead", lastMsg.isRead());
                map.put("lastMessageSenderId", lastMsg.getSenderId());
            } else {
                map.put("lastMessage", "");
                map.put("lastMessageTime", null);
                map.put("lastMessageIsRead", true);
                map.put("lastMessageSenderId", null);
            }
            return map;
        }).collect(Collectors.toList());

        // Sort by lastMessageTime desc
        result.sort((a, b) -> {
            Object ta = a.get("lastMessageTime");
            Object tb = b.get("lastMessageTime");
            if (ta == null && tb == null) return 0;
            if (ta == null) return 1;
            if (tb == null) return -1;
            return tb.toString().compareTo(ta.toString());
        });

        return ResponseEntity.ok(result);
    }

    // Mark messages as read
    @PostMapping("/api/chat/mark-read/direct/{senderId}")
    public ResponseEntity<Void> markDirectAsRead(
            @PathVariable Long senderId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = userService.findByUsername(userDetails.getUsername());
        chatService.markDirectAsRead(senderId, currentUser.getId());

        // Notify sender that their messages were read
        User sender = userService.findById(senderId);
        messagingTemplate.convertAndSendToUser(sender.getUsername(), "/queue/read-receipt",
                Map.of("readBy", currentUser.getId(), "readByUsername", currentUser.getUsername()));

        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/chat/mark-read/group/{groupId}")
    public ResponseEntity<Void> markGroupAsRead(
            @PathVariable String groupId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = userService.findByUsername(userDetails.getUsername());
        chatService.markGroupAsRead(groupId, currentUser.getId());
        return ResponseEntity.noContent().build();
    }

    // Add reaction
    @PostMapping("/api/chat/messages/{messageId}/reaction")
    public ResponseEntity<ChatMessageResponse> addReaction(
            @PathVariable Long messageId,
            @RequestBody Map<String, String> body) {
        String reaction = body.get("reaction");
        ChatMessageResponse updated = chatService.addReaction(messageId, reaction);

        // Broadcast reaction update via WebSocket
        if (updated.isGroup()) {
            messagingTemplate.convertAndSend("/topic/group." + updated.getGroupId() + ".reactions", updated);
        } else {
            // Notify both parties
            if (updated.getReceiverId() != null) {
                User receiver = userService.findById(updated.getReceiverId());
                messagingTemplate.convertAndSendToUser(receiver.getUsername(), "/queue/reactions", updated);
            }
            User sender = userService.findById(updated.getSenderId());
            messagingTemplate.convertAndSendToUser(sender.getUsername(), "/queue/reactions", updated);
        }

        return ResponseEntity.ok(updated);
    }

    // Delete conversation
    @DeleteMapping("/api/chat/conversations/direct/{userId}")
    public ResponseEntity<Void> deleteDirectConversation(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = userService.findByUsername(userDetails.getUsername());
        chatService.deleteDirectConversation(currentUser.getId(), userId);
        logger.info("Conversation between {} and user {} deleted", currentUser.getUsername(), userId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/api/chat/conversations/group/{groupId}")
    public ResponseEntity<Void> deleteGroupConversation(
            @PathVariable String groupId,
            @AuthenticationPrincipal UserDetails userDetails) {
        chatService.deleteGroupConversation(groupId);
        logger.info("Group {} messages deleted by {}", groupId, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }
}
