package com.instagram.model;

import lombok.*;
import java.io.Serializable;
import java.util.Objects;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class BookmarkId implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long user;
    private Long post;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        BookmarkId that = (BookmarkId) o;
        return Objects.equals(user, that.user) && Objects.equals(post, that.post);
    }

    @Override
    public int hashCode() {
        return Objects.hash(user, post);
    }
}
