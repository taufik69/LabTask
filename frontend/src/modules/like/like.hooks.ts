import { useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { togglePostLike, toggleCommentLike } from "@/modules/like/like.api";
import { FEED_QUERY_KEY } from "@/modules/post/post.hooks";
import type { FeedPage } from "@/modules/post/post.types";
import type { CommentsPage, RepliesPage, Comment } from "@/modules/comment/comment.types";

// flips isLikedByViewer + likeCount for one post across every page of the
// feed's infinite-query cache, so the button feels instant
const useTogglePostLike = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => togglePostLike(postId),
    onMutate: async (postId: string) => {
      await queryClient.cancelQueries({ queryKey: FEED_QUERY_KEY });
      const previous = queryClient.getQueryData<InfiniteData<FeedPage>>(FEED_QUERY_KEY);

      queryClient.setQueryData<InfiniteData<FeedPage>>(FEED_QUERY_KEY, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            posts: page.posts.map((post) =>
              post.id === postId
                ? {
                    ...post,
                    isLikedByViewer: !post.isLikedByViewer,
                    likeCount: post.likeCount + (post.isLikedByViewer ? -1 : 1),
                  }
                : post
            ),
          })),
        };
      });

      return { previous };
    },
    onError: (_err, _postId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(FEED_QUERY_KEY, context.previous);
      }
    },
  });
};

const flipLike = (comment: Comment, commentId: string): Comment =>
  comment.id === commentId
    ? {
        ...comment,
        isLikedByViewer: !comment.isLikedByViewer,
        likeCount: comment.likeCount + (comment.isLikedByViewer ? -1 : 1),
      }
    : comment;

// same optimistic pattern as useTogglePostLike, but patches a comment's
// (or reply's) entry inside a comment-list infinite-query cache instead of
// the feed cache. The cached page shape differs: top-level comment lists use
// `comments`, reply lists use `replies` — patch whichever key is present.
const useToggleCommentLike = (commentsQueryKey: unknown[]) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => toggleCommentLike(commentId),
    onMutate: async (commentId: string) => {
      await queryClient.cancelQueries({ queryKey: commentsQueryKey });
      const previous = queryClient.getQueryData<InfiniteData<CommentsPage | RepliesPage>>(
        commentsQueryKey
      );

      queryClient.setQueryData<InfiniteData<CommentsPage | RepliesPage>>(
        commentsQueryKey,
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) =>
              "comments" in page
                ? { ...page, comments: page.comments.map((c) => flipLike(c, commentId)) }
                : { ...page, replies: page.replies.map((r) => flipLike(r, commentId)) }
            ),
          };
        }
      );

      return { previous };
    },
    onError: (_err, _commentId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(commentsQueryKey, context.previous);
      }
    },
  });
};

export { useTogglePostLike, useToggleCommentLike };
