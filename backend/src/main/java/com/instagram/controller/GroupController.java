package com.instagram.controller;

import com.instagram.dto.ChatGroupRequest;
import com.instagram.dto.ChatGroupResponse;
import com.instagram.dto.ChatMessageResponse;
import com.instagram.model.ChatGroup;
import com.instagram.model.User;
import com.instagram.repository.ChatGroupRepository;
import com.instagram.service.ChatService;
import com.instagram.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/groups")
public class GroupController {

    private static final Logger logger = LoggerFactory.getLogger(GroupController.class);

    @Autowired
    private ChatGroupRepository chatGroupRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private ChatService chatService;

    @PostMapping
    public ResponseEntity<ChatGroupResponse> createGroup(
            @RequestBody ChatGroupRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User creator = userService.findByUsername(userDetails.getUsername());

        Set<User> members = new HashSet<>();
        members.add(creator);
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
    public ResponseEntity<List<Map<String, Object>>> getMyGroups(
            @AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = userService.findByUsername(userDetails.getUsername());
        List<ChatGroup> groups = chatGroupRepository.findGroupsByMemberId(currentUser.getId());

        List<Map<String, Object>> result = groups.stream().map(g -> {
            Map<String, Object> map = new LinkedHashMap<>();
            ChatGroupResponse resp = mapToResponse(g);
            map.put("id", resp.getId());
            map.put("name", resp.getName());
            map.put("createdById", resp.getCreatedById());
            map.put("createdByUsername", resp.getCreatedByUsername());
            map.put("members", resp.getMembers());
            map.put("createdAt", resp.getCreatedAt());

            // Include last message info
            ChatMessageResponse lastMsg = chatService.getLastGroupMessage(String.valueOf(g.getId()));
            if (lastMsg != null) {
                map.put("lastMessage", lastMsg.getSenderUsername() + ": " + lastMsg.getContent());
                map.put("lastMessageTime", lastMsg.getCreatedAt());
            } else {
                map.put("lastMessage", "");
                map.put("lastMessageTime", null);
            }
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    // Add members to an existing group
    @PostMapping("/{groupId}/members")
    public ResponseEntity<ChatGroupResponse> addMembers(
            @PathVariable Long groupId,
            @RequestBody Map<String, List<Long>> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        ChatGroup group = chatGroupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));

        List<Long> memberIds = body.get("memberIds");
        if (memberIds != null) {
            for (Long memberId : memberIds) {
                User member = userService.findById(memberId);
                group.getMembers().add(member);
            }
            group = chatGroupRepository.save(group);
            logger.info("Added {} members to group '{}'", memberIds.size(), group.getName());
        }

        return ResponseEntity.ok(mapToResponse(group));
    }

    // Delete group
    @DeleteMapping("/{groupId}")
    public ResponseEntity<Void> deleteGroup(
            @PathVariable Long groupId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = userService.findByUsername(userDetails.getUsername());
        ChatGroup group = chatGroupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));

        // Only creator can delete group
        if (!group.getCreatedBy().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(403).build();
        }

        // Delete messages first, then the group
        chatService.deleteGroupConversation(String.valueOf(groupId));
        chatGroupRepository.delete(group);
        logger.info("Group '{}' deleted by {}", group.getName(), currentUser.getUsername());

        return ResponseEntity.noContent().build();
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
