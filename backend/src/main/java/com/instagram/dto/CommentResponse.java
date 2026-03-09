package com.instagram.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CommentResponse {
    private Long id;
    private Long userId;
    private String username;
    private String userAvatarUrl;
    private String content;
    private LocalDateTime createdAt;
}
