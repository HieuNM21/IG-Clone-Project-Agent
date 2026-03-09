package com.instagram.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class NotificationEvent {
    private Long userId;
    private Long actorId;
    private String type;
    private Long targetId;
}
