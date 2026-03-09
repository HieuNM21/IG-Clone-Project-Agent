package com.instagram.dto;

import lombok.*;
import javax.validation.constraints.NotBlank;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class PostRequest {

    @NotBlank
    private String imageUrl;

    private String caption;
}
