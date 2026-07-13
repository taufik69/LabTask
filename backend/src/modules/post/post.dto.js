class PostDTO {
  static toResponse(post, { isLikedByViewer = false } = {}) {
    return {
      id: post._id,
      author: post.author && {
        id: post.author._id,
        firstName: post.author.firstName,
        lastName: post.author.lastName,
        username: post.author.username,
      },
      text: post.text,
      image: post.image,
      visibility: post.visibility,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      isLikedByViewer,
      createdAt: post.createdAt,
    };
  }

  static toListResponse(posts, likedPostIds = new Set()) {
    return posts.map((post) =>
      this.toResponse(post, {
        isLikedByViewer: likedPostIds.has(String(post._id)),
      }),
    );
  }
}

export { PostDTO };
