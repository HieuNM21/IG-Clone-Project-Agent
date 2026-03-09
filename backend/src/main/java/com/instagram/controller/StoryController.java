package com.instagram.controller;

import com.instagram.dto.StoryRequest;
import com.instagram.dto.StoryResponse;
import com.instagram.model.User;
import com.instagram.service.StoryService;
import com.instagram.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/stories")
public class StoryController {

    @Autowired
    private StoryService storyService;

    @Autowired
    private UserService userService;

    @PostMapping
    public ResponseEntity<StoryResponse> createStory(@Valid @RequestBody StoryRequest request,
                                                      @AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = userService.findByUsername(userDetails.getUsername());
        return ResponseEntity.ok(storyService.createStory(request, currentUser));
    }

    @GetMapping
    public ResponseEntity<List<StoryResponse>> getFeedStories(@AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = userService.findByUsername(userDetails.getUsername());
        return ResponseEntity.ok(storyService.getFeedStories(currentUser));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<StoryResponse>> getUserStories(@PathVariable Long userId) {
        return ResponseEntity.ok(storyService.getUserStories(userId));
    }
}
