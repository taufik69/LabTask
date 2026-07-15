import { useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useComments, useCreateComment } from "@/modules/comment/comment.hooks";
import { getApiErrorMessage } from "@/shared/utils/getApiErrorMessage";
import CommentItem from "@/modules/comment/components/CommentItem";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

interface CommentSectionProps {
  postId: string;
  show: boolean;
}

const CommentSection = ({ postId, show }: CommentSectionProps) => {
  const [commentText, setCommentText] = useState("");
  const [commentImage, setCommentImage] = useState<File | null>(null);
  const [commentImagePreview, setCommentImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useComments(
    postId,
    show
  );
  const { mutate: submitComment, isPending: isCommenting } = useCreateComment(postId);

  const comments = useMemo(
    () => data?.pages.flatMap((page) => page.comments) ?? [],
    [data]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("Image must be smaller than 10MB");
      e.target.value = "";
      return;
    }

    if (commentImagePreview) URL.revokeObjectURL(commentImagePreview);
    setCommentImage(file);
    setCommentImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    if (commentImagePreview) URL.revokeObjectURL(commentImagePreview);
    setCommentImage(null);
    setCommentImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() && !commentImage) return;

    submitComment(
      { text: commentText.trim(), image: commentImage ?? undefined },
      {
        onSuccess: () => {
          setCommentText("");
          handleRemoveImage();
        },
        onError: (err) => {
          toast.error(getApiErrorMessage(err, "Failed to post comment"));
        },
      }
    );
  };

  return (
    <>
      <div className="_feed_inner_timeline_cooment_area">
        <div className="_feed_inner_comment_box">
          <form className="_feed_inner_comment_box_form" onSubmit={handleSubmit}>
            <div className="_feed_inner_comment_box_content">
              <div className="_feed_inner_comment_box_content_image">
                <img src="/images/comment_img.png" alt="" className="_comment_img" />
              </div>
              <div className="_feed_inner_comment_box_content_txt">
                <textarea
                  className="form-control _comment_textarea"
                  placeholder="Write a comment"
                  id={`comment-${postId}`}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  disabled={isCommenting}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                ></textarea>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />

            {commentImagePreview && (
              <div style={{ position: "relative", width: "120px", marginTop: "8px" }}>
                <img
                  src={commentImagePreview}
                  alt="Selected preview"
                  style={{ width: "100%", borderRadius: "8px", display: "block" }}
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  disabled={isCommenting}
                  aria-label="Remove selected image"
                  style={{
                    position: "absolute",
                    top: "4px",
                    right: "4px",
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    border: "none",
                    background: "rgba(0,0,0,0.6)",
                    color: "#fff",
                    fontSize: "14px",
                    lineHeight: "22px",
                    textAlign: "center",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  ×
                </button>
              </div>
            )}

            <div className="_feed_inner_comment_box_icon" style={{ display: "flex", alignItems: "center" }}>
              <button
                type="button"
                className="_feed_inner_comment_box_icon_btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={isCommenting}
                aria-label="Add photo"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16">
                  <path fill="#000" fillOpacity=".46" fillRule="evenodd" d="M10.867 1.333c2.257 0 3.774 1.581 3.774 3.933v5.435c0 2.352-1.517 3.932-3.774 3.932H5.101c-2.254 0-3.767-1.58-3.767-3.932V5.266c0-2.352 1.513-3.933 3.767-3.933h5.766zm0 1H5.101c-1.681 0-2.767 1.152-2.767 2.933v5.435c0 1.782 1.086 2.932 2.767 2.932h5.766c1.685 0 2.774-1.15 2.774-2.932V5.266c0-1.781-1.089-2.933-2.774-2.933zm.426 5.733l.017.015.013.013.009.008.037.037c.12.12.453.46 1.443 1.477a.5.5 0 11-.716.697S10.73 8.91 10.633 8.816a.614.614 0 00-.433-.118.622.622 0 00-.421.225c-1.55 1.88-1.568 1.897-1.594 1.922a1.456 1.456 0 01-2.057-.021s-.62-.63-.63-.642c-.155-.143-.43-.134-.594.04l-1.02 1.076a.498.498 0 01-.707.018.499.499 0 01-.018-.706l1.018-1.075c.54-.573 1.45-.6 2.025-.06l.639.647c.178.18.467.184.646.008l1.519-1.843a1.618 1.618 0 011.098-.584c.433-.038.854.088 1.19.363zM5.706 4.42c.921 0 1.67.75 1.67 1.67 0 .92-.75 1.67-1.67 1.67-.92 0-1.67-.75-1.67-1.67 0-.921.75-1.67 1.67-1.67zm0 1a.67.67 0 10.001 1.34.67.67 0 00-.002-1.34z" clipRule="evenodd" />
                </svg>
              </button>
              {(commentText.trim() || commentImage) && (
                <button
                  type="submit"
                  aria-label="Send comment"
                  disabled={isCommenting}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    border: "none",
                    background: "#377dff",
                    marginLeft: "4px",
                    cursor: isCommenting ? "default" : "pointer",
                    opacity: isCommenting ? 0.6 : 1,
                    flexShrink: 0,
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M3 20l18-8L3 4v6l12 2-12 2v6z" fill="#fff" />
                  </svg>
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {show && (
        <div className="_timline_comment_main">
          {isLoading && <p className="_comment_status_text">Loading comments...</p>}
          {comments.map((comment) => (
            <CommentItem key={comment.id} postId={postId} comment={comment} />
          ))}
          {hasNextPage && (
            <div className="_previous_comment">
              <button
                type="button"
                className="_previous_comment_txt"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? "Loading..." : "View more comments"}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default CommentSection;
