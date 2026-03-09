package com.instagram.controller;

import com.instagram.dto.ApiResponse;
import com.instagram.model.User;
import com.instagram.service.FollowService;
import com.instagram.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users/{userId}/follow")
public class FollowController {

    @Autowired
    private FollowService followService;

    @Autowired
    private UserService userService;

    @PostMapping
    public ResponseEntity<ApiResponse> toggleFollow(@PathVariable Long userId,
                                                     @AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = userService.findByUsername(userDetails.getUsername());
        boolean followed = followService.toggleFollow(userId, currentUser);
        String message = followed ? "Followed" : "Unfollowed";
        return ResponseEntity.ok(ApiResponse.builder().success(true).message(message).build());
    }
}
