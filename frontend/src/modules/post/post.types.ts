interface PostImage {
  url: string;
  publicId: string;
  status: "pending" | "processing" | "uploaded" | "failed";
  localPath: string;
  tries: number;
  lastError: string;
}

interface PostAuthor {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
}

interface Post {
  id: string;
  author: PostAuthor;
  text: string;
  image?: PostImage;
  visibility: "public" | "private";
  likeCount: number;
  commentCount: number;
  isLikedByViewer: boolean;
  createdAt: string;
}

interface CreatePostPayload {
  text: string;
  visibility: "public" | "private";
  image?: File;
}

interface FeedPage {
  posts: Post[];
  nextCursor: string | null;
  hasMore: boolean;
}

export type { Post, PostImage, PostAuthor, CreatePostPayload, FeedPage };
