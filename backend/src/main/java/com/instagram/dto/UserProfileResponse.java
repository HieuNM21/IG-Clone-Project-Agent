package com.instagram.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserProfileResponse {
    private Long id;
    private String username;
    private String fullName;
    private String bio;
    private String avatarUrl;
    private long postCount;
    private long followerCount;
    private long followingCount;
    private boolean followedByCurrentUser;
}
