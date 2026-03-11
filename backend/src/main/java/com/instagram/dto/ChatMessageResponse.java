package com.instagram.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ChatMessageResponse {
    private Long id;
    private Long senderId;
    private String senderUsername;
    private String senderAvatarUrl;
    private Long receiverId;
    private String groupId;
    @JsonProperty("isGroup")
    private boolean isGroup;
    private String content;
    @JsonProperty("isRead")
    private boolean isRead;
    private Long replyToId;
    private String replyToContent;
    private String replyToUsername;
    private String reaction;
    private LocalDateTime createdAt;
}
