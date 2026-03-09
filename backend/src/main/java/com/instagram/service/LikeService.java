package com.instagram.service;

import com.instagram.dto.NotificationEvent;
import com.instagram.model.Like;
import com.instagram.model.Post;
import com.instagram.model.User;
import com.instagram.repository.LikeRepository;
import com.instagram.repository.PostRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LikeService {

    private static final Logger logger = LoggerFactory.getLogger(LikeService.class);

    @Autowired
    private LikeRepository likeRepository;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private NotificationService notificationService;

    @Transactional
    public boolean toggleLike(Long postId, User currentUser) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        boolean alreadyLiked = likeRepository.existsByUserIdAndPostId(currentUser.getId(), postId);

        if (alreadyLiked) {
            likeRepository.deleteByUserIdAndPostId(currentUser.getId(), postId);
            logger.info("User {} unliked post {}", currentUser.getUsername(), postId);
            return false;
        } else {
            Like like = Like.builder()
                    .user(currentUser)
                    .post(post)
                    .build();
            likeRepository.save(like);
            logger.info("User {} liked post {}", currentUser.getUsername(), postId);

            // Send notification directly (no RabbitMQ)
            if (!post.getUser().getId().equals(currentUser.getId())) {
                notificationService.createAndPushNotification(NotificationEvent.builder()
                        .userId(post.getUser().getId())
                        .actorId(currentUser.getId())
                        .type("LIKE")
                        .targetId(postId)
                        .build());
            }

            return true;
        }
    }
}
