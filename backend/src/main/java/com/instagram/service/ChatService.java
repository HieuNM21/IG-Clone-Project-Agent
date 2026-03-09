package com.instagram.service;

import com.instagram.dto.ChatMessageRequest;
import com.instagram.dto.ChatMessageResponse;
import com.instagram.model.ChatMessage;
import com.instagram.model.User;
import com.instagram.repository.ChatMessageRepository;
import com.instagram.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ChatService {

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public ChatMessageResponse saveMessage(ChatMessageRequest request, User sender) {
        ChatMessage message = ChatMessage.builder()
                .sender(sender)
                .content(request.getContent())
                .isGroup(request.isGroup())
                .groupId(request.getGroupId())
                .build();

        if (!request.isGroup() && request.getReceiverId() != null) {
            User receiver = userRepository.findById(request.getReceiverId())
                    .orElseThrow(() -> new RuntimeException("Receiver not found"));
            message.setReceiver(receiver);
        }

        message = chatMessageRepository.save(message);
        return mapToResponse(message);
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getDirectMessages(Long userId1, Long userId2) {
        return chatMessageRepository.findDirectMessages(userId1, userId2)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getGroupMessages(String groupId) {
        return chatMessageRepository.findGroupMessages(groupId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<User> getConversations(Long userId) {
        List<Long> partnerIds = chatMessageRepository.findConversationPartnerIds(userId);
        return userRepository.findAllById(partnerIds);
    }

    private ChatMessageResponse mapToResponse(ChatMessage message) {
        return ChatMessageResponse.builder()
                .id(message.getId())
                .senderId(message.getSender().getId())
                .senderUsername(message.getSender().getUsername())
                .senderAvatarUrl(message.getSender().getAvatarUrl())
                .receiverId(message.getReceiver() != null ? message.getReceiver().getId() : null)
                .groupId(message.getGroupId())
                .isGroup(message.getIsGroup())
                .content(message.getContent())
                .createdAt(message.getCreatedAt())
                .build();
    }
}
