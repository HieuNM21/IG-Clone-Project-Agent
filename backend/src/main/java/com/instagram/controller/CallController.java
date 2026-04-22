package com.instagram.controller;

import com.instagram.dto.CallMessageRequest;
import com.instagram.model.User;
import com.instagram.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
public class CallController {

    private static final Logger logger = LoggerFactory.getLogger(CallController.class);

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private UserService userService;

    @MessageMapping("/call.signal")
    public void handleCallSignal(@Payload CallMessageRequest request, Principal principal) {
        if (principal == null) {
            logger.warn("Unauthenticated call signal attempt");
            return;
        }

        User sender = userService.findByUsername(principal.getName());
        if (sender == null) return;

        // Auto-fill caller details for offers
        if ("offer".equals(request.getType())) {
            request.setCallerName(sender.getFullName() != null && !sender.getFullName().isEmpty() ? sender.getFullName() : sender.getUsername());
            request.setCallerAvatar(sender.getAvatarUrl());
        }
        request.setCallerId(sender.getId());

        logger.info("WS call signal from {} to {}: type={}", sender.getUsername(), request.getTargetId(), request.getType());

        if (request.getTargetId() != null) {
            User receiver = userService.findById(request.getTargetId());
            if (receiver != null) {
                // Route the signal to the target user's call queue
                messagingTemplate.convertAndSendToUser(receiver.getUsername(), "/queue/call", request);
            }
        }
    }
}
