package com.instagram.service;

import com.instagram.dto.UserProfileResponse;
import com.instagram.model.User;
import com.instagram.repository.FollowRepository;
import com.instagram.repository.PostRepository;
import com.instagram.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private FollowRepository followRepository;

    public User findByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
    }

    public User findById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found: " + id));
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(String username, User currentUser) {
        User user = findByUsername(username);

        long postCount = postRepository.countByUserId(user.getId());
        long followerCount = followRepository.countByFollowingId(user.getId());
        long followingCount = followRepository.countByFollowerId(user.getId());
        boolean isFollowing = false;

        if (currentUser != null && !currentUser.getId().equals(user.getId())) {
            isFollowing = followRepository.existsByFollowerIdAndFollowingId(currentUser.getId(), user.getId());
        }

        return UserProfileResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .bio(user.getBio())
                .avatarUrl(user.getAvatarUrl())
                .postCount(postCount)
                .followerCount(followerCount)
                .followingCount(followingCount)
                .followedByCurrentUser(isFollowing)
                .build();
    }

    public List<UserProfileResponse> searchUsers(String query) {
        return userRepository.findByUsernameContainingIgnoreCase(query)
                .stream()
                .map(user -> UserProfileResponse.builder()
                        .id(user.getId())
                        .username(user.getUsername())
                        .fullName(user.getFullName())
                        .avatarUrl(user.getAvatarUrl())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public User updateProfile(User currentUser, String fullName, String bio, String avatarUrl) {
        if (fullName != null) currentUser.setFullName(fullName);
        if (bio != null) currentUser.setBio(bio);
        if (avatarUrl != null) currentUser.setAvatarUrl(avatarUrl);
        return userRepository.save(currentUser);
    }
}
