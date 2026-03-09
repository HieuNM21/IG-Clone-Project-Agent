package com.instagram.service;

import com.instagram.dto.NotificationEvent;
import com.instagram.model.Like;
import com.instagram.model.Post;
import com.instagram.model.User;
import com.instagram.repository.LikeRepository;
import com.instagram.repository.PostRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LikeService {

    @Autowired
    private LikeRepository likeRepository;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private NotificationProducer notificationProducer;

    @Transactional
    public boolean toggleLike(Long postId, User currentUser) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        boolean alreadyLiked = likeRepository.existsByUserIdAndPostId(currentUser.getId(), postId);

        if (alreadyLiked) {
            likeRepository.deleteByUserIdAndPostId(currentUser.getId(), postId);
            return false; // unliked
        } else {
            Like like = Like.builder()
                    .user(currentUser)
                    .post(post)
                    .build();
            likeRepository.save(like);

            // Send notification if liking someone else's post
            if (!post.getUser().getId().equals(currentUser.getId())) {
                notificationProducer.sendNotification(NotificationEvent.builder()
                        .userId(post.getUser().getId())
                        .actorId(currentUser.getId())
                        .type("LIKE")
                        .targetId(postId)
                        .build());
            }

            return true; // liked
        }
    }
}
