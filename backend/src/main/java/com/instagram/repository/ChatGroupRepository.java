package com.instagram.repository;

import com.instagram.model.ChatGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatGroupRepository extends JpaRepository<ChatGroup, Long> {

    @Query("SELECT g FROM ChatGroup g JOIN g.members m WHERE m.id = :userId ORDER BY g.createdAt DESC")
    List<ChatGroup> findGroupsByMemberId(Long userId);
}
