package com.instagram.controller;

import com.instagram.dto.ApiResponse;
import com.instagram.model.User;
import com.instagram.service.LikeService;
import com.instagram.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/posts/{postId}/like")
public class LikeController {

    @Autowired
    private LikeService likeService;

    @Autowired
    private UserService userService;

    @PostMapping
    public ResponseEntity<ApiResponse> toggleLike(@PathVariable Long postId,
                                                   @AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = userService.findByUsername(userDetails.getUsername());
        boolean liked = likeService.toggleLike(postId, currentUser);
        String message = liked ? "Post liked" : "Post unliked";
        return ResponseEntity.ok(ApiResponse.builder().success(true).message(message).build());
    }
}
