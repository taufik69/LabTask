import { useRef, useState } from "react";
import { toast } from "react-toastify";
import { useCreatePost } from "@/modules/post/post.hooks";
import { getApiErrorMessage } from "@/shared/utils/getApiErrorMessage";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

interface CreatePostModalProps {
  show: boolean;
  onClose: () => void;
  authorName?: string;
}

const CreatePostModal = ({ show, onClose, authorName = "You" }: CreatePostModalProps) => {
  const [postText, setPostText] = useState("");
  const [postImage, setPostImage] = useState<File | null>(null);
  const [postImagePreview, setPostImagePreview] = useState<string | null>(null);
  const [postVisibility, setPostVisibility] = useState<"public" | "private">("public");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutate: submitPost, isPending: isPosting } = useCreatePost();

  const handlePhotoClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      if (postImagePreview) URL.revokeObjectURL(postImagePreview);
      setPostImage(null);
      setPostImagePreview(null);
      return;
    }

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

    if (postImagePreview) URL.revokeObjectURL(postImagePreview);
    setPostImage(file);
    setPostImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    if (postImagePreview) URL.revokeObjectURL(postImagePreview);
    setPostImage(null);
    setPostImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const resetForm = ({ keepPreviewAlive = false } = {}) => {
    if (!keepPreviewAlive && postImagePreview) URL.revokeObjectURL(postImagePreview);
    setPostText("");
    setPostImage(null);
    setPostImagePreview(null);
    setPostVisibility("public");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    if (isPosting) return;
    resetForm();
    onClose();
  };

  const handleSubmit = () => {
    if (!postText.trim() && !postImage) {
      toast.error("Post must have text or image");
      return;
    }

    submitPost(
      {
        text: postText.trim(),
        visibility: postVisibility,
        image: postImage ?? undefined,
        localPreviewUrl: postImagePreview ?? undefined,
      },
      {
        onSuccess: () => {
          toast.success("Post created successfully");
          // ownership of the preview object URL transfers to the feed
          // cache now, so don't revoke it here — PostCard revokes it once
          // the real Cloudinary URL takes over
          resetForm({ keepPreviewAlive: true });
          onClose();
        },
        onError: (err) => {
          toast.error(getApiErrorMessage(err, "Failed to create post"));
        },
      }
    );
  };

  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1050,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.5)",
        padding: "16px",
      }}
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className="modal-dialog modal-dialog-centered"
        role="document"
        style={{ margin: 0, width: "500px", maxWidth: "100%" }}
      >
        <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Create post</h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={handleClose}
                disabled={isPosting}
              ></button>
            </div>

            <div className="modal-body">
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                <img
                  src="/images/txt_img.png"
                  alt=""
                  style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }}
                />
                <div>
                  <div style={{ fontWeight: 600 }}>{authorName}</div>
                  <select
                    value={postVisibility}
                    onChange={(e) => setPostVisibility(e.target.value as "public" | "private")}
                    disabled={isPosting}
                    style={{
                      height: "28px",
                      padding: "0 8px",
                      borderRadius: "14px",
                      border: "1px solid #dbe2ea",
                      background: "#f0f2f5",
                      fontSize: "12px",
                      fontWeight: 500,
                      color: "#4a4a4a",
                      cursor: "pointer",
                    }}
                  >
                    <option value="public">🌐 Public</option>
                    <option value="private">🔒 Only me</option>
                  </select>
                </div>
              </div>

              <textarea
                className="form-control"
                placeholder={`What's on your mind, ${authorName}?`}
                rows={postImagePreview ? 2 : 5}
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                disabled={isPosting}
                autoFocus
                style={{ border: "none", resize: "none", fontSize: "18px", boxShadow: "none" }}
              ></textarea>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />

              {postImagePreview && (
                <div style={{ position: "relative", width: "100%", height: "280px", marginTop: "20px" }}>
                  <img
                    src={postImagePreview}
                    alt="Selected preview"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: "8px",
                      display: "block",
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    disabled={isPosting}
                    aria-label="Remove selected image"
                    style={{
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      border: "none",
                      background: "rgba(0,0,0,0.6)",
                      color: "#fff",
                      fontSize: "16px",
                      lineHeight: "28px",
                      textAlign: "center",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    ×
                  </button>
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: "16px",
                  padding: "12px",
                  border: "1px solid #dbe2ea",
                  borderRadius: "8px",
                }}
              >
                <span style={{ fontWeight: 500, fontSize: "14px" }}>Add to your post</span>
                <button
                  type="button"
                  onClick={handlePhotoClick}
                  disabled={isPosting}
                  aria-label="Add photo"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px",
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 20 20">
                    <path fill="#45bd62" d="M13.916 0c3.109 0 5.18 2.429 5.18 5.914v8.17c0 3.486-2.072 5.916-5.18 5.916H5.999C2.89 20 .827 17.572.827 14.085v-8.17C.827 2.43 2.897 0 6 0h7.917zm0 1.504H5.999c-2.321 0-3.799 1.735-3.799 4.41v8.17c0 2.68 1.472 4.412 3.799 4.412h7.917c2.328 0 3.807-1.734 3.807-4.411v-8.17c0-2.678-1.478-4.411-3.807-4.411zm.65 8.68l.12.125 1.9 2.147a.803.803 0 01-.016 1.063.642.642 0 01-.894.058l-.076-.074-1.9-2.148a.806.806 0 00-1.205-.028l-.074.087-2.04 2.717c-.722.963-2.02 1.066-2.86.26l-.111-.116-.814-.91a.562.562 0 00-.793-.07l-.075.073-1.4 1.617a.645.645 0 01-.97.029.805.805 0 01-.09-.977l.064-.086 1.4-1.617c.736-.852 1.95-.897 2.734-.137l.114.12.81.905a.587.587 0 00.861.033l.07-.078 2.04-2.718c.81-1.08 2.27-1.19 3.205-.275zM6.831 4.64c1.265 0 2.292 1.125 2.292 2.51 0 1.386-1.027 2.511-2.292 2.511S4.54 8.537 4.54 7.152c0-1.386 1.026-2.51 2.291-2.51zm0 1.504c-.507 0-.918.451-.918 1.007 0 .555.411 1.006.918 1.006.507 0 .919-.451.919-1.006 0-.556-.412-1.007-.919-1.007z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="modal-footer" style={{ border: "none" }}>
              <button
                type="button"
                className="_feed_inner_text_area_btn_link"
                style={{ width: "100%" }}
                onClick={handleSubmit}
                disabled={isPosting}
              >
                <span>{isPosting ? "Posting..." : "Post"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
  );
};

export default CreatePostModal;
