package com.instagram.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
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
    @JsonProperty("isRead")
    private boolean isRead;
    private LocalDateTime createdAt;
}
