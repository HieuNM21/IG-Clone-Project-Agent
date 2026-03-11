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
                .replyToId(request.getReplyToId())
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

    @Transactional(readOnly = true)
    public ChatMessageResponse getLastDirectMessage(Long userId1, Long userId2) {
        List<ChatMessage> msgs = chatMessageRepository.findLastDirectMessage(userId1, userId2);
        if (msgs.isEmpty()) return null;
        return mapToResponse(msgs.get(0));
    }

    @Transactional(readOnly = true)
    public ChatMessageResponse getLastGroupMessage(String groupId) {
        List<ChatMessage> msgs = chatMessageRepository.findLastGroupMessage(groupId);
        if (msgs.isEmpty()) return null;
        return mapToResponse(msgs.get(0));
    }

    @Transactional
    public void markDirectAsRead(Long senderId, Long receiverId) {
        chatMessageRepository.markDirectMessagesAsRead(senderId, receiverId);
    }

    @Transactional
    public void markGroupAsRead(String groupId, Long userId) {
        chatMessageRepository.markGroupMessagesAsRead(groupId, userId);
    }

    @Transactional
    public ChatMessageResponse addReaction(Long messageId, String reaction) {
        ChatMessage message = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
        // Toggle: if same reaction, remove it; if different, replace
        if (reaction.equals(message.getReaction())) {
            message.setReaction(null);
        } else {
            message.setReaction(reaction);
        }
        message = chatMessageRepository.save(message);
        return mapToResponse(message);
    }

    @Transactional
    public void deleteDirectConversation(Long userId1, Long userId2) {
        chatMessageRepository.deleteDirectConversation(userId1, userId2);
    }

    @Transactional
    public void deleteGroupConversation(String groupId) {
        chatMessageRepository.deleteGroupMessages(groupId);
    }

    private ChatMessageResponse mapToResponse(ChatMessage message) {
        ChatMessageResponse.ChatMessageResponseBuilder builder = ChatMessageResponse.builder()
                .id(message.getId())
                .senderId(message.getSender().getId())
                .senderUsername(message.getSender().getUsername())
                .senderAvatarUrl(message.getSender().getAvatarUrl())
                .receiverId(message.getReceiver() != null ? message.getReceiver().getId() : null)
                .groupId(message.getGroupId())
                .isGroup(message.getIsGroup() != null && message.getIsGroup())
                .content(message.getContent())
                .isRead(message.getIsRead() != null && message.getIsRead())
                .replyToId(message.getReplyToId())
                .reaction(message.getReaction())
                .createdAt(message.getCreatedAt());

        // Populate reply context
        if (message.getReplyToId() != null) {
            chatMessageRepository.findById(message.getReplyToId()).ifPresent(replyMsg -> {
                builder.replyToContent(replyMsg.getContent());
                builder.replyToUsername(replyMsg.getSender().getUsername());
            });
        }

        return builder.build();
    }
}
