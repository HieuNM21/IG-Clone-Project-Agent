package com.instagram.service;

import com.instagram.dto.CommentRequest;
import com.instagram.dto.CommentResponse;
import com.instagram.dto.NotificationEvent;
import com.instagram.model.Comment;
import com.instagram.model.Post;
import com.instagram.model.User;
import com.instagram.repository.CommentRepository;
import com.instagram.repository.PostRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CommentService {

    private static final Logger logger = LoggerFactory.getLogger(CommentService.class);

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Transactional
    public CommentResponse addComment(Long postId, CommentRequest request, User currentUser) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        Comment comment = Comment.builder()
                .post(post)
                .user(currentUser)
                .content(request.getContent())
                .build();

        comment = commentRepository.save(comment);
        logger.info("User {} commented on post {}: '{}'", currentUser.getUsername(), postId, request.getContent());

        CommentResponse response = mapToCommentResponse(comment);

        // Push comment to all subscribers of the post topic
        messagingTemplate.convertAndSend("/topic/post." + postId + ".comments", response);
        logger.info("Comment pushed to /topic/post.{}.comments", postId);

        // Send notification
        if (!post.getUser().getId().equals(currentUser.getId())) {
            notificationService.createAndPushNotification(NotificationEvent.builder()
                    .userId(post.getUser().getId())
                    .actorId(currentUser.getId())
                    .type("COMMENT")
                    .targetId(postId)
                    .build());
        }

        return response;
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> getComments(Long postId) {
        return commentRepository.findByPostIdOrderByCreatedAtAsc(postId)
                .stream()
                .map(this::mapToCommentResponse)
                .collect(Collectors.toList());
    }

    private CommentResponse mapToCommentResponse(Comment comment) {
        return CommentResponse.builder()
                .id(comment.getId())
                .userId(comment.getUser().getId())
                .username(comment.getUser().getUsername())
                .userAvatarUrl(comment.getUser().getAvatarUrl())
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt())
                .build();
    }
}
