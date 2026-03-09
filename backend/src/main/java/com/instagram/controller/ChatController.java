package com.instagram.controller;

import com.instagram.dto.ChatMessageRequest;
import com.instagram.dto.ChatMessageResponse;
import com.instagram.model.User;
import com.instagram.service.ChatService;
import com.instagram.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.stream.Collectors;

@RestController
public class ChatController {

    @Autowired
    private ChatService chatService;

    @Autowired
    private UserService userService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // WebSocket message handler for sending messages
    @MessageMapping("/chat.send")
    public void sendMessage(@Payload ChatMessageRequest request, Principal principal) {
        User sender = userService.findByUsername(principal.getName());
        ChatMessageResponse response = chatService.saveMessage(request, sender);

        if (request.isGroup()) {
            // Send to group topic
            messagingTemplate.convertAndSend("/topic/group." + request.getGroupId(), response);
        } else {
            // Send to individual users
            User receiver = userService.findById(request.getReceiverId());
            messagingTemplate.convertAndSendToUser(receiver.getUsername(), "/queue/messages", response);
            messagingTemplate.convertAndSendToUser(sender.getUsername(), "/queue/messages", response);
        }
    }

    // REST endpoint: Get direct message history
    @GetMapping("/api/chat/messages/{userId}")
    public ResponseEntity<List<ChatMessageResponse>> getDirectMessages(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = userService.findByUsername(userDetails.getUsername());
        return ResponseEntity.ok(chatService.getDirectMessages(currentUser.getId(), userId));
    }

    // REST endpoint: Get group message history
    @GetMapping("/api/chat/group/{groupId}")
    public ResponseEntity<List<ChatMessageResponse>> getGroupMessages(@PathVariable String groupId) {
        return ResponseEntity.ok(chatService.getGroupMessages(groupId));
    }

    // REST endpoint: Get conversation list
    @GetMapping("/api/chat/conversations")
    public ResponseEntity<List<?>> getConversations(@AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = userService.findByUsername(userDetails.getUsername());
        List<User> partners = chatService.getConversations(currentUser.getId());
        return ResponseEntity.ok(partners.stream().map(u -> {
            return java.util.Map.of(
                "id", u.getId(),
                "username", u.getUsername(),
                "fullName", u.getFullName() != null ? u.getFullName() : "",
                "avatarUrl", u.getAvatarUrl() != null ? u.getAvatarUrl() : ""
            );
        }).collect(Collectors.toList()));
    }
}
