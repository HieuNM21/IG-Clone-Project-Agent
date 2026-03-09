package com.instagram.service;

import com.instagram.dto.NotificationEvent;
import com.instagram.model.Follow;
import com.instagram.model.User;
import com.instagram.repository.FollowRepository;
import com.instagram.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class FollowService {

    @Autowired
    private FollowRepository followRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationProducer notificationProducer;

    @Transactional
    public boolean toggleFollow(Long targetUserId, User currentUser) {
        if (currentUser.getId().equals(targetUserId)) {
            throw new RuntimeException("You cannot follow yourself");
        }

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean alreadyFollowing = followRepository.existsByFollowerIdAndFollowingId(
                currentUser.getId(), targetUserId);

        if (alreadyFollowing) {
            followRepository.deleteByFollowerIdAndFollowingId(currentUser.getId(), targetUserId);
            return false; // unfollowed
        } else {
            Follow follow = Follow.builder()
                    .follower(currentUser)
                    .following(targetUser)
                    .build();
            followRepository.save(follow);

            // Send follow notification
            notificationProducer.sendNotification(NotificationEvent.builder()
                    .userId(targetUserId)
                    .actorId(currentUser.getId())
                    .type("FOLLOW")
                    .targetId(currentUser.getId())
                    .build());

            return true; // followed
        }
    }

    @Transactional(readOnly = true)
    public List<User> getFollowers(Long userId) {
        List<Long> followerIds = followRepository.findFollowerIds(userId);
        return userRepository.findAllById(followerIds);
    }

    @Transactional(readOnly = true)
    public List<User> getFollowing(Long userId) {
        List<Long> followingIds = followRepository.findFollowingIds(userId);
        return userRepository.findAllById(followingIds);
    }
}
