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
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class NotificationConsumer {

    private static final Logger logger = LoggerFactory.getLogger(NotificationConsumer.class);

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @RabbitListener(queues = "${app.rabbitmq.queue}")
    public void handleNotification(NotificationEvent event) {
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

            // Push real-time notification via WebSocket
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

            messagingTemplate.convertAndSendToUser(
                    user.getUsername(),
                    "/queue/notifications",
                    response
            );

            logger.info("Notification saved and pushed: {} for user {}", event.getType(), user.getUsername());
        } catch (Exception e) {
            logger.error("Error processing notification event", e);
        }
    }
}
