package com.instagram.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ChatGroupResponse {
    private Long id;
    private String name;
    private Long createdById;
    private String createdByUsername;
    private List<MemberInfo> members;
    private LocalDateTime createdAt;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class MemberInfo {
        private Long id;
        private String username;
        private String avatarUrl;
    }
}
