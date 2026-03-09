package com.instagram.controller;

import com.instagram.dto.PostRequest;
import com.instagram.dto.PostResponse;
import com.instagram.model.User;
import com.instagram.service.PostService;
import com.instagram.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    @Autowired
    private PostService postService;

    @Autowired
    private UserService userService;

    @PostMapping
    public ResponseEntity<PostResponse> createPost(@Valid @RequestBody PostRequest request,
                                                    @AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = userService.findByUsername(userDetails.getUsername());
        return ResponseEntity.ok(postService.createPost(request, currentUser));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PostResponse> getPost(@PathVariable Long id,
                                                 @AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = userService.findByUsername(userDetails.getUsername());
        return ResponseEntity.ok(postService.getPost(id, currentUser));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<PostResponse>> getUserPosts(@PathVariable Long userId,
                                                            @AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = userService.findByUsername(userDetails.getUsername());
        return ResponseEntity.ok(postService.getUserPosts(userId, currentUser));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(@PathVariable Long id,
                                            @AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = userService.findByUsername(userDetails.getUsername());
        postService.deletePost(id, currentUser);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/bookmark")
    public ResponseEntity<Map<String, Boolean>> toggleBookmark(@PathVariable Long id,
                                                                @AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = userService.findByUsername(userDetails.getUsername());
        boolean bookmarked = postService.toggleBookmark(id, currentUser);
        return ResponseEntity.ok(Map.of("bookmarked", bookmarked));
    }

    @GetMapping("/bookmarks")
    public ResponseEntity<List<PostResponse>> getBookmarkedPosts(
            @AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = userService.findByUsername(userDetails.getUsername());
        return ResponseEntity.ok(postService.getBookmarkedPosts(currentUser));
    }
}
