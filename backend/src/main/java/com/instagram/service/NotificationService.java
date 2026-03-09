package com.instagram.service;

import com.instagram.dto.NotificationEvent;
import com.instagram.dto.NotificationResponse;
import com.instagram.model.Notification;
import com.instagram.model.NotificationType;
import com.instagram.model.User;
import com.instagram.repository.NotificationRepository;
import com.instagram.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    /**
     * Create notification, save to DB, and push via WebSocket directly.
     * This bypasses RabbitMQ and works as the primary notification delivery.
     */
    @Transactional
    public void createAndPushNotification(NotificationEvent event) {
        try {
            User user = userRepository.findById(event.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            User actor = userRepository.findById(event.getActorId())
                    .orElseThrow(() -> new RuntimeException("Actor not found"));

            Notification notification = Notification.builder()
                    .user(user)
                    .actor(actor)
                    .type(NotificationType.valueOf(event.getType()))
                    .targetId(event.getTargetId())
                    .isRead(false)
                    .build();

            notification = notificationRepository.save(notification);

            NotificationResponse response = NotificationResponse.builder()
                    .id(notification.getId())
                    .actorId(actor.getId())
                    .actorUsername(actor.getUsername())
                    .actorAvatarUrl(actor.getAvatarUrl())
                    .type(event.getType())
                    .targetId(event.getTargetId())
                    .isRead(false)
                    .createdAt(notification.getCreatedAt())
                    .build();

            // Push directly via WebSocket
            messagingTemplate.convertAndSendToUser(
                    user.getUsername(),
                    "/queue/notifications",
                    response
            );

            logger.info("Notification created and pushed: type={} for user={} from actor={}",
                    event.getType(), user.getUsername(), actor.getUsername());
        } catch (Exception e) {
            logger.error("Failed to create notification: type={} userId={} actorId={}",
                    event.getType(), event.getUserId(), event.getActorId(), e);
        }
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getUserNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsRead(userId);
    }

    private NotificationResponse mapToResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .actorId(notification.getActor().getId())
                .actorUsername(notification.getActor().getUsername())
                .actorAvatarUrl(notification.getActor().getAvatarUrl())
                .type(notification.getType().name())
                .targetId(notification.getTargetId())
                .isRead(notification.getIsRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
