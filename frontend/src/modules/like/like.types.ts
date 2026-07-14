type LikeTargetType = "Post" | "Comment";

interface Liker {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
}

interface LikersPage {
  likers: Liker[];
  nextCursor: string | null;
  hasMore: boolean;
}

interface ToggleLikeResult {
  liked: boolean;
}

export type { LikeTargetType, Liker, LikersPage, ToggleLikeResult };
