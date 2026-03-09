package com.instagram.dto;

import lombok.*;
import javax.validation.constraints.NotBlank;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class StoryRequest {

    @NotBlank
    private String mediaUrl;
}
