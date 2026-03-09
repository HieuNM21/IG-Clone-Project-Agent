package com.instagram.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class NotificationResponse {
    private Long id;
    private Long actorId;
    private String actorUsername;
    private String actorAvatarUrl;
    private String type;
    private Long targetId;
    private boolean isRead;
    private LocalDateTime createdAt;
}
