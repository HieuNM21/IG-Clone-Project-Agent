package com.instagram.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ChatMessageRequest {
    private Long receiverId;
    private String groupId;
    private String content;

    @JsonProperty("isGroup")
    private boolean isGroup;
}
