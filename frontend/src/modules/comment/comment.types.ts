import type { PostImage, PostAuthor } from "@/modules/post/post.types";

interface Comment {
  id: string;
  post: string;
  author: PostAuthor;
  text: string;
  image?: PostImage;
  replyCount: number;
  likeCount: number;
  isLikedByViewer: boolean;
  createdAt: string;
}

interface CommentsPage {
  comments: Comment[];
  nextCursor: string | null;
  hasMore: boolean;
}

interface RepliesPage {
  replies: Comment[];
  nextCursor: string | null;
  hasMore: boolean;
}

interface CreateCommentPayload {
  text: string;
  image?: File;
}

export type { Comment, CommentsPage, RepliesPage, CreateCommentPayload };
