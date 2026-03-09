package com.instagram.service;

import com.instagram.dto.NotificationEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class NotificationProducer {

    private static final Logger logger = LoggerFactory.getLogger(NotificationProducer.class);

    @Autowired
    private RabbitTemplate rabbitTemplate;

    @Value("${app.rabbitmq.exchange}")
    private String exchange;

    @Value("${app.rabbitmq.routing-key}")
    private String routingKey;

    public void sendNotification(NotificationEvent event) {
        try {
            rabbitTemplate.convertAndSend(exchange, routingKey, event);
            logger.info("Notification event sent: {} -> user {}", event.getType(), event.getUserId());
        } catch (Exception e) {
            logger.error("Failed to send notification event", e);
        }
    }
}
