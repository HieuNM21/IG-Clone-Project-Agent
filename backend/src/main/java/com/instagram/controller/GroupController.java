package com.instagram.controller;

import com.instagram.dto.ChatGroupRequest;
import com.instagram.dto.ChatGroupResponse;
import com.instagram.model.ChatGroup;
import com.instagram.model.User;
import com.instagram.repository.ChatGroupRepository;
import com.instagram.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/groups")
public class GroupController {

    private static final Logger logger = LoggerFactory.getLogger(GroupController.class);

    @Autowired
    private ChatGroupRepository chatGroupRepository;

    @Autowired
    private UserService userService;

    @PostMapping
    public ResponseEntity<ChatGroupResponse> createGroup(
            @RequestBody ChatGroupRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User creator = userService.findByUsername(userDetails.getUsername());

        Set<User> members = new HashSet<>();
        members.add(creator); // Creator is always a member
        for (Long memberId : request.getMemberIds()) {
            members.add(userService.findById(memberId));
        }

        ChatGroup group = ChatGroup.builder()
                .name(request.getName())
                .createdBy(creator)
                .members(members)
                .build();

        group = chatGroupRepository.save(group);
        logger.info("Group '{}' created by {} with {} members", group.getName(), creator.getUsername(), members.size());

        return ResponseEntity.ok(mapToResponse(group));
    }

    @GetMapping
    public ResponseEntity<List<ChatGroupResponse>> getMyGroups(
            @AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = userService.findByUsername(userDetails.getUsername());
        List<ChatGroup> groups = chatGroupRepository.findGroupsByMemberId(currentUser.getId());
        return ResponseEntity.ok(groups.stream().map(this::mapToResponse).collect(Collectors.toList()));
    }

    private ChatGroupResponse mapToResponse(ChatGroup group) {
        return ChatGroupResponse.builder()
                .id(group.getId())
                .name(group.getName())
                .createdById(group.getCreatedBy().getId())
                .createdByUsername(group.getCreatedBy().getUsername())
                .members(group.getMembers().stream()
                        .map(m -> ChatGroupResponse.MemberInfo.builder()
                                .id(m.getId())
                                .username(m.getUsername())
                                .avatarUrl(m.getAvatarUrl())
                                .build())
                        .collect(Collectors.toList()))
                .createdAt(group.getCreatedAt())
                .build();
    }
}
