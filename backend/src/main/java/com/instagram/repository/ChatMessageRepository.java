package com.instagram.repository;

import com.instagram.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    @Query("SELECT m FROM ChatMessage m WHERE m.isGroup = false AND " +
           "((m.sender.id = :userId1 AND m.receiver.id = :userId2) OR " +
           "(m.sender.id = :userId2 AND m.receiver.id = :userId1)) " +
           "ORDER BY m.createdAt ASC")
    List<ChatMessage> findDirectMessages(@Param("userId1") Long userId1, @Param("userId2") Long userId2);

    @Query("SELECT m FROM ChatMessage m WHERE m.isGroup = true AND m.groupId = :groupId ORDER BY m.createdAt ASC")
    List<ChatMessage> findGroupMessages(@Param("groupId") String groupId);

    @Query("SELECT DISTINCT CASE WHEN m.sender.id = :userId THEN m.receiver.id ELSE m.sender.id END " +
           "FROM ChatMessage m WHERE m.isGroup = false AND (m.sender.id = :userId OR m.receiver.id = :userId)")
    List<Long> findConversationPartnerIds(@Param("userId") Long userId);

    // Last message for a DM conversation
    @Query("SELECT m FROM ChatMessage m WHERE m.isGroup = false AND " +
           "((m.sender.id = :userId1 AND m.receiver.id = :userId2) OR " +
           "(m.sender.id = :userId2 AND m.receiver.id = :userId1)) " +
           "ORDER BY m.createdAt DESC")
    List<ChatMessage> findLastDirectMessage(@Param("userId1") Long userId1, @Param("userId2") Long userId2);

    // Last message for a group
    @Query("SELECT m FROM ChatMessage m WHERE m.isGroup = true AND m.groupId = :groupId ORDER BY m.createdAt DESC")
    List<ChatMessage> findLastGroupMessage(@Param("groupId") String groupId);

    // Mark messages as read
    @Modifying
    @Query("UPDATE ChatMessage m SET m.isRead = true WHERE m.isGroup = false " +
           "AND m.sender.id = :senderId AND m.receiver.id = :receiverId AND m.isRead = false")
    int markDirectMessagesAsRead(@Param("senderId") Long senderId, @Param("receiverId") Long receiverId);

    @Modifying
    @Query("UPDATE ChatMessage m SET m.isRead = true WHERE m.isGroup = true " +
           "AND m.groupId = :groupId AND m.sender.id <> :userId AND m.isRead = false")
    int markGroupMessagesAsRead(@Param("groupId") String groupId, @Param("userId") Long userId);

    // Delete conversation (DM)
    @Modifying
    @Query("DELETE FROM ChatMessage m WHERE m.isGroup = false AND " +
           "((m.sender.id = :userId1 AND m.receiver.id = :userId2) OR " +
           "(m.sender.id = :userId2 AND m.receiver.id = :userId1))")
    int deleteDirectConversation(@Param("userId1") Long userId1, @Param("userId2") Long userId2);

    // Delete group messages
    @Modifying
    @Query("DELETE FROM ChatMessage m WHERE m.isGroup = true AND m.groupId = :groupId")
    int deleteGroupMessages(@Param("groupId") String groupId);
}
