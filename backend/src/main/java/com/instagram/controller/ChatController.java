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
import java.util.List;
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
            logger.info("Group message pushed to {}", dest);
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
            logger.info("Group message pushed to {}", dest);
        } else if (request.getReceiverId() != null) {
            User receiver = userService.findById(request.getReceiverId());
            messagingTemplate.convertAndSendToUser(receiver.getUsername(), "/queue/messages", response);
            logger.info("DM pushed to user {}", receiver.getUsername());
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
        logger.info("Fetching group messages for groupId={}", groupId);
        return ResponseEntity.ok(chatService.getGroupMessages(groupId));
    }

    @GetMapping("/api/chat/conversations")
    public ResponseEntity<List<?>> getConversations(@AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = userService.findByUsername(userDetails.getUsername());
        List<User> partners = chatService.getConversations(currentUser.getId());
        return ResponseEntity.ok(partners.stream().map(u -> java.util.Map.of(
                "id", u.getId(),
                "username", u.getUsername(),
                "fullName", u.getFullName() != null ? u.getFullName() : "",
                "avatarUrl", u.getAvatarUrl() != null ? u.getAvatarUrl() : ""
        )).collect(Collectors.toList()));
    }
}
