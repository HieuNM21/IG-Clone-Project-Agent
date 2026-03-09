package com.instagram.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ChatMessageRequest {
    private Long receiverId;
    private String groupId;
    private boolean isGroup;
    private String content;
}
