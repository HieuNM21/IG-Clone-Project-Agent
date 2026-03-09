package com.instagram.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StoryResponse {
    private Long id;
    private Long userId;
    private String username;
    private String userAvatarUrl;
    private String mediaUrl;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
}
