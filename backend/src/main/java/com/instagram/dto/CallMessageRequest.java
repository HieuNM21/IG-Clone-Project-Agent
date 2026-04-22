package com.instagram.dto;

import lombok.Data;

@Data
public class CallMessageRequest {
    private String type; // "offer", "answer", "ice-candidate", "end", "reject"
    private Long targetId;
    private Long callerId;
    private String callerName;
    private String callerAvatar;
    private Object payload; // Can hold sdp or candidate data
    private Boolean isVideo;
}
