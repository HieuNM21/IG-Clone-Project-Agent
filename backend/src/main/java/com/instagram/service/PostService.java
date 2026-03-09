package com.instagram.service;

import com.instagram.dto.PostRequest;
import com.instagram.dto.PostResponse;
import com.instagram.model.Bookmark;
import com.instagram.model.Post;
import com.instagram.model.User;
import com.instagram.repository.BookmarkRepository;
import com.instagram.repository.CommentRepository;
import com.instagram.repository.FollowRepository;
import com.instagram.repository.LikeRepository;
import com.instagram.repository.PostRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PostService {

    private static final Logger logger = LoggerFactory.getLogger(PostService.class);

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private LikeRepository likeRepository;

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private FollowRepository followRepository;

    @Autowired
    private BookmarkRepository bookmarkRepository;

    @Transactional
    public PostResponse createPost(PostRequest request, User currentUser) {
        Post post = Post.builder()
                .user(currentUser)
                .imageUrl(request.getImageUrl())
                .caption(request.getCaption())
                .build();

        post = postRepository.save(post);
        logger.info("Post {} created by {}", post.getId(), currentUser.getUsername());
        return mapToPostResponse(post, currentUser);
    }

    @Transactional(readOnly = true)
    public Page<PostResponse> getFeed(User currentUser, int page, int size) {
        List<Long> followingIds = followRepository.findFollowingIds(currentUser.getId());
        List<Long> feedUserIds = new ArrayList<>(followingIds);
        feedUserIds.add(currentUser.getId());

        Pageable pageable = PageRequest.of(page, size);
        Page<Post> posts = postRepository.findFeedPosts(feedUserIds, pageable);

        return posts.map(post -> mapToPostResponse(post, currentUser));
    }

    @Transactional(readOnly = true)
    public PostResponse getPost(Long postId, User currentUser) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        return mapToPostResponse(post, currentUser);
    }

    @Transactional(readOnly = true)
    public List<PostResponse> getUserPosts(Long userId, User currentUser) {
        return postRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(post -> mapToPostResponse(post, currentUser))
                .collect(Collectors.toList());
    }

    @Transactional
    public void deletePost(Long postId, User currentUser) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        if (!post.getUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("You can only delete your own posts");
        }

        postRepository.delete(post);
        logger.info("Post {} deleted by {}", postId, currentUser.getUsername());
    }

    @Transactional
    public boolean toggleBookmark(Long postId, User currentUser) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        boolean alreadyBookmarked = bookmarkRepository.existsByUserIdAndPostId(currentUser.getId(), postId);

        if (alreadyBookmarked) {
            bookmarkRepository.deleteByUserIdAndPostId(currentUser.getId(), postId);
            logger.info("User {} removed bookmark from post {}", currentUser.getUsername(), postId);
            return false;
        } else {
            Bookmark bookmark = Bookmark.builder()
                    .user(currentUser)
                    .post(post)
                    .build();
            bookmarkRepository.save(bookmark);
            logger.info("User {} bookmarked post {}", currentUser.getUsername(), postId);
            return true;
        }
    }

    @Transactional(readOnly = true)
    public List<PostResponse> getBookmarkedPosts(User currentUser) {
        return bookmarkRepository.findBookmarkedPostsByUserId(currentUser.getId())
                .stream()
                .map(post -> mapToPostResponse(post, currentUser))
                .collect(Collectors.toList());
    }

    private PostResponse mapToPostResponse(Post post, User currentUser) {
        long likeCount = likeRepository.countByPostId(post.getId());
        long commentCount = commentRepository.countByPostId(post.getId());
        boolean liked = currentUser != null &&
                likeRepository.existsByUserIdAndPostId(currentUser.getId(), post.getId());
        boolean bookmarked = currentUser != null &&
                bookmarkRepository.existsByUserIdAndPostId(currentUser.getId(), post.getId());

        return PostResponse.builder()
                .id(post.getId())
                .userId(post.getUser().getId())
                .username(post.getUser().getUsername())
                .userAvatarUrl(post.getUser().getAvatarUrl())
                .imageUrl(post.getImageUrl())
                .caption(post.getCaption())
                .likeCount(likeCount)
                .commentCount(commentCount)
                .likedByCurrentUser(liked)
                .bookmarkedByCurrentUser(bookmarked)
                .createdAt(post.getCreatedAt())
                .build();
    }
}
