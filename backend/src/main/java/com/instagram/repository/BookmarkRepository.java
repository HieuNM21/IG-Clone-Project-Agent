package com.instagram.repository;

import com.instagram.model.Bookmark;
import com.instagram.model.BookmarkId;
import com.instagram.model.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookmarkRepository extends JpaRepository<Bookmark, BookmarkId> {

    boolean existsByUserIdAndPostId(Long userId, Long postId);

    void deleteByUserIdAndPostId(Long userId, Long postId);

    @Query("SELECT b.post FROM Bookmark b WHERE b.user.id = :userId ORDER BY b.createdAt DESC")
    List<Post> findBookmarkedPostsByUserId(Long userId);
}
