import { useMutation, useInfiniteQuery, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { createComment, getComments, createReply, getReplies } from "@/modules/comment/comment.api";
import { FEED_QUERY_KEY } from "@/modules/post/post.hooks";
import type { FeedPage } from "@/modules/post/post.types";
import type { CommentsPage, RepliesPage, CreateCommentPayload } from "@/modules/comment/comment.types";

const commentsQueryKey = (postId: string) => ["comments", postId];
const repliesQueryKey = (commentId: string) => ["replies", commentId];

// bumps the post's commentCount in the feed cache so "N Comment" reflects
// new comments/replies without a full feed refetch
const bumpFeedCommentCount = (
  queryClient: ReturnType<typeof useQueryClient>,
  postId: string,
  delta: number
) => {
  queryClient.setQueryData<InfiniteData<FeedPage>>(FEED_QUERY_KEY, (old) => {
    if (!old) return old;
    return {
      ...old,
      pages: old.pages.map((page) => ({
        ...page,
        posts: page.posts.map((post) =>
          post.id === postId ? { ...post, commentCount: post.commentCount + delta } : post
        ),
      })),
    };
  });
};

const useComments = (postId: string, enabled: boolean) => {
  return useInfiniteQuery({
    queryKey: commentsQueryKey(postId),
    queryFn: ({ pageParam }) => getComments(postId, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
    enabled,
  });
};

const useCreateComment = (postId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCommentPayload) => createComment(postId, payload),
    onSuccess: (newComment) => {
      // oldest-first list, so a fresh comment goes at the end of the last page
      queryClient.setQueryData<InfiniteData<CommentsPage>>(commentsQueryKey(postId), (old) => {
        if (!old) return old;
        const pages = [...old.pages];
        const lastIndex = pages.length - 1;
        pages[lastIndex] = {
          ...pages[lastIndex],
          comments: [...pages[lastIndex].comments, newComment],
        };
        return { ...old, pages };
      });
      bumpFeedCommentCount(queryClient, postId, 1);

      // comments are created infrequently, so invalidate to reconcile with
      // the server instead of trusting the optimistic patch indefinitely
      queryClient.invalidateQueries({ queryKey: commentsQueryKey(postId) });
    },
  });
};

const useReplies = (commentId: string, enabled: boolean) => {
  return useInfiniteQuery({
    queryKey: repliesQueryKey(commentId),
    queryFn: ({ pageParam }) => getReplies(commentId, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
    enabled,
  });
};

const useCreateReply = (postId: string, commentId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCommentPayload) => createReply(commentId, payload),
    onSuccess: (newReply) => {
      queryClient.setQueryData<InfiniteData<RepliesPage>>(repliesQueryKey(commentId), (old) => {
        if (!old) {
          return { pages: [{ replies: [newReply], nextCursor: null, hasMore: false }], pageParams: [null] };
        }
        const pages = [...old.pages];
        const lastIndex = pages.length - 1;
        pages[lastIndex] = {
          ...pages[lastIndex],
          replies: [...pages[lastIndex].replies, newReply],
        };
        return { ...old, pages };
      });

      // parent comment's replyCount lives inside the comments cache
      queryClient.setQueryData<InfiniteData<CommentsPage>>(commentsQueryKey(postId), (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            comments: page.comments.map((comment) =>
              comment.id === commentId
                ? { ...comment, replyCount: comment.replyCount + 1 }
                : comment
            ),
          })),
        };
      });

      // replies also count toward the post's total commentCount (backend does this too)
      bumpFeedCommentCount(queryClient, postId, 1);

      // replies are created infrequently, so invalidate to reconcile with
      // the server instead of trusting the optimistic patch indefinitely
      queryClient.invalidateQueries({ queryKey: repliesQueryKey(commentId) });
    },
  });
};

export { useComments, useCreateComment, useReplies, useCreateReply, commentsQueryKey, repliesQueryKey };
