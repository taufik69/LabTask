class CommentDTO {
  static toResponse(comment, { isLikedByViewer = false } = {}) {
    return {
      id: comment._id,
      post: comment.post,
      author: comment.author && {
        id: comment.author._id,
        firstName: comment.author.firstName,
        lastName: comment.author.lastName,
        username: comment.author.username,
      },
      text: comment.text,
      image: comment.image,
      replyCount: comment.replyCount,
      likeCount: comment.likeCount,
      isLikedByViewer,
      createdAt: comment.createdAt,
    };
  }

  static toListResponse(comments, likedCommentIds = new Set()) {
    return comments.map((comment) =>
      this.toResponse(comment, {
        isLikedByViewer: likedCommentIds.has(String(comment._id)),
      }),
    );
  }
}

export { CommentDTO };
