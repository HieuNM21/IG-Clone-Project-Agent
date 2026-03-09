package com.instagram.dto;

import lombok.*;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ChatGroupRequest {
    private String name;
    private List<Long> memberIds;
}
