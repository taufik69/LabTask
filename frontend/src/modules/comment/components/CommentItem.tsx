import { useState } from "react";
import { toast } from "react-toastify";
import type { Comment } from "@/modules/comment/comment.types";
import { useReplies, useCreateReply } from "@/modules/comment/comment.hooks";
import { useToggleCommentLike } from "@/modules/like/like.hooks";
import { commentsQueryKey, repliesQueryKey } from "@/modules/comment/comment.hooks";
import { getApiErrorMessage } from "@/shared/utils/getApiErrorMessage";

const formatRelativeTime = (isoDate: string) => {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d`;
};

interface CommentItemProps {
  postId: string;
  comment: Comment;
  /** replies are flattened one level deep — a reply is rendered without its own reply toggle */
  isReply?: boolean;
  /** required when isReply is true: the top-level comment this reply belongs to */
  parentCommentId?: string;
}

const CommentItem = ({ postId, comment, isReply = false, parentCommentId }: CommentItemProps) => {
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState("");

  const { mutate: toggleLike } = useToggleCommentLike(
    isReply && parentCommentId ? repliesQueryKey(parentCommentId) : commentsQueryKey(postId)
  );
  const {
    data: repliesData,
    isLoading: isRepliesLoading,
  } = useReplies(comment.id, showReplies && !isReply);
  const { mutate: submitReply, isPending: isReplying } = useCreateReply(postId, comment.id);

  const replies = repliesData?.pages.flatMap((page) => page.replies) ?? [];

  const handleToggleLike = () => {
    toggleLike(comment.id);
  };

  const handleSubmitReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    submitReply(
      { text: replyText.trim() },
      {
        onSuccess: () => {
          setReplyText("");
          setShowReplies(true);
        },
        onError: (err) => {
          toast.error(getApiErrorMessage(err, "Failed to post reply"));
        },
      }
    );
  };

  return (
    <div className="_comment_main">
      <div className="_comment_image">
        <span className="_comment_image_link">
          <img src="/images/txt_img.png" alt="" className="_comment_img1" />
        </span>
      </div>
      <div className="_comment_area">
        <div className="_comment_details">
          <div className="_comment_details_top">
            <div className="_comment_name">
              <h4 className="_comment_name_title">
                {comment.author.firstName} {comment.author.lastName}
              </h4>
            </div>
          </div>
          <div className="_comment_status">
            <p className="_comment_status_text">
              <span>{comment.text}</span>
            </p>
            {comment.image?.url && (
              <img
                src={comment.image.url}
                alt=""
                style={{ maxWidth: "180px", borderRadius: "8px", marginTop: "6px", display: "block" }}
              />
            )}
          </div>
          <div className="_total_reactions">
            <div className="_total_react">
              <span className="_reaction_like">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-thumbs-up"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
              </span>
            </div>
            <span className="_total">{comment.likeCount}</span>
          </div>
          <div className="_comment_reply">
            <div className="_comment_reply_num">
              <ul className="_comment_reply_list">
                <li>
                  <span
                    onClick={handleToggleLike}
                    style={{ cursor: "pointer", fontWeight: comment.isLikedByViewer ? 700 : 400 }}
                  >
                    {comment.isLikedByViewer ? "Liked" : "Like"}.
                  </span>
                </li>
                {!isReply && (
                  <li>
                    <span onClick={() => setShowReplies((v) => !v)} style={{ cursor: "pointer" }}>
                      Reply.
                    </span>
                  </li>
                )}
                <li>
                  <span className="_time_link">.{formatRelativeTime(comment.createdAt)}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {!isReply && comment.replyCount > 0 && !showReplies && (
          <div className="_previous_comment">
            <button
              type="button"
              className="_previous_comment_txt"
              onClick={() => setShowReplies(true)}
            >
              View {comment.replyCount} {comment.replyCount === 1 ? "reply" : "replies"}
            </button>
          </div>
        )}

        {!isReply && showReplies && (
          <div style={{ marginTop: "10px" }}>
            {isRepliesLoading && <p className="_comment_status_text">Loading replies...</p>}
            {replies.map((reply) => (
              <CommentItem
                key={reply.id}
                postId={postId}
                comment={reply}
                isReply
                parentCommentId={comment.id}
              />
            ))}

            <form className="_feed_inner_comment_box_form" onSubmit={handleSubmitReply}>
              <div className="_feed_inner_comment_box_content">
                <div className="_feed_inner_comment_box_content_image">
                  <img src="/images/comment_img.png" alt="" className="_comment_img" />
                </div>
                <div className="_feed_inner_comment_box_content_txt">
                  <textarea
                    className="form-control _comment_textarea"
                    placeholder="Write a reply"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    disabled={isReplying}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmitReply(e);
                      }
                    }}
                  ></textarea>
                </div>
              </div>

              {replyText.trim() && (
                <div className="_feed_inner_comment_box_icon" style={{ display: "flex", alignItems: "center" }}>
                  <button
                    type="submit"
                    aria-label="Send reply"
                    disabled={isReplying}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "26px",
                      height: "26px",
                      borderRadius: "50%",
                      border: "none",
                      background: "#377dff",
                      cursor: isReplying ? "default" : "pointer",
                      opacity: isReplying ? 0.6 : 1,
                      flexShrink: 0,
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none">
                      <path d="M3 20l18-8L3 4v6l12 2-12 2v6z" fill="#fff" />
                    </svg>
                  </button>
                </div>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentItem;
