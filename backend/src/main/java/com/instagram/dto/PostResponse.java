package com.instagram.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PostResponse {
    private Long id;
    private Long userId;
    private String username;
    private String userAvatarUrl;
    private String imageUrl;
    private String caption;
    private long likeCount;
    private long commentCount;
    private boolean likedByCurrentUser;
    private boolean bookmarkedByCurrentUser;
    private LocalDateTime createdAt;
}
