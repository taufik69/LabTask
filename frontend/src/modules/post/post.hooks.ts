import { useMutation, useInfiniteQuery, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { createPost, getFeed } from "@/modules/post/post.api";
import type { FeedPage } from "@/modules/post/post.types";

const FEED_QUERY_KEY = ["feed"];

const hasPendingImage = (data?: InfiniteData<FeedPage>) =>
  data?.pages.some((page) =>
    page.posts.some(
      (post) =>
        post.image &&
        (post.image.status === "pending" || post.image.status === "processing")
    )
  ) ?? false;

const useFeed = () => {
  return useInfiniteQuery({
    queryKey: FEED_QUERY_KEY,
    queryFn: ({ pageParam }) => getFeed(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
    // while any post's image is still being processed by the background
    // worker, poll so the real Cloudinary URL replaces the local preview
    refetchInterval: (query) => (hasPendingImage(query.state.data) ? 2000 : false),
  });
};

interface CreatePostVariables {
  text: string;
  visibility: "public" | "private";
  image?: File;
  localPreviewUrl?: string;
}

const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: CreatePostVariables) => createPost(variables),
    onSuccess: (newPost, variables) => {
      // if an image was attached, show the locally selected preview right
      // away instead of waiting for the background worker's Cloudinary URL
      const postToInsert =
        variables.localPreviewUrl && newPost.image
          ? { ...newPost, image: { ...newPost.image, url: variables.localPreviewUrl } }
          : newPost;

      // prepend the freshly created post into the cache instead of a full
      // refetch, so it appears at the top of the feed instantly
      queryClient.setQueryData<InfiniteData<FeedPage>>(FEED_QUERY_KEY, (old) => {
        if (!old) return old;
        const [firstPage, ...restPages] = old.pages;
        return {
          ...old,
          pages: [
            { ...firstPage, posts: [postToInsert, ...firstPage.posts] },
            ...restPages,
          ],
        };
      });

      // creating a post is infrequent, so it's worth reconciling with the
      // server in the background (e.g. once the image worker finishes) via
      // a real invalidation rather than trusting the optimistic patch forever
      queryClient.invalidateQueries({ queryKey: FEED_QUERY_KEY });
    },
  });
};

export { useFeed, useCreatePost, FEED_QUERY_KEY };
