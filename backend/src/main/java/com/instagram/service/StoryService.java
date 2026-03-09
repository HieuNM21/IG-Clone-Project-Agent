package com.instagram.service;

import com.instagram.dto.StoryRequest;
import com.instagram.dto.StoryResponse;
import com.instagram.model.Story;
import com.instagram.model.User;
import com.instagram.repository.FollowRepository;
import com.instagram.repository.StoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class StoryService {

    @Autowired
    private StoryRepository storyRepository;

    @Autowired
    private FollowRepository followRepository;

    @Transactional
    public StoryResponse createStory(StoryRequest request, User currentUser) {
        Story story = Story.builder()
                .user(currentUser)
                .mediaUrl(request.getMediaUrl())
                .build();

        story = storyRepository.save(story);
        return mapToStoryResponse(story);
    }

    @Transactional(readOnly = true)
    public List<StoryResponse> getFeedStories(User currentUser) {
        List<Long> followingIds = followRepository.findFollowingIds(currentUser.getId());
        List<Long> storyUserIds = new ArrayList<>(followingIds);
        storyUserIds.add(currentUser.getId());

        return storyRepository.findActiveStoriesByUserIds(storyUserIds, LocalDateTime.now())
                .stream()
                .map(this::mapToStoryResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<StoryResponse> getUserStories(Long userId) {
        return storyRepository.findActiveStoriesByUserId(userId, LocalDateTime.now())
                .stream()
                .map(this::mapToStoryResponse)
                .collect(Collectors.toList());
    }

    private StoryResponse mapToStoryResponse(Story story) {
        return StoryResponse.builder()
                .id(story.getId())
                .userId(story.getUser().getId())
                .username(story.getUser().getUsername())
                .userAvatarUrl(story.getUser().getAvatarUrl())
                .mediaUrl(story.getMediaUrl())
                .createdAt(story.getCreatedAt())
                .expiresAt(story.getExpiresAt())
                .build();
    }
}
