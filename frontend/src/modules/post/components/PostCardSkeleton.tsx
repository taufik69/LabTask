const PostCardSkeleton = () => (
  <div className="_feed_inner_timeline_post_area _b_radious6 _padd_b24 _padd_t24 _mar_b16">
    <div className="_feed_inner_timeline_content _padd_r24 _padd_l24">
      <div className="_feed_inner_timeline_post_top">
        <div className="_feed_inner_timeline_post_box">
          <div className="_feed_inner_timeline_post_box_image">
            <div
              className="_skeleton"
              style={{ width: "40px", height: "40px", borderRadius: "50%" }}
            />
          </div>
          <div className="_feed_inner_timeline_post_box_txt" style={{ flex: 1 }}>
            <div
              className="_skeleton"
              style={{ width: "140px", height: "14px", marginBottom: "8px" }}
            />
            <div className="_skeleton" style={{ width: "90px", height: "12px" }} />
          </div>
        </div>
      </div>
      <div
        className="_skeleton"
        style={{ width: "100%", height: "14px", marginTop: "16px", marginBottom: "8px" }}
      />
      <div className="_skeleton" style={{ width: "70%", height: "14px", marginBottom: "16px" }} />
      <div className="_skeleton" style={{ width: "100%", height: "260px", borderRadius: "8px" }} />
    </div>
    <div
      className="_feed_inner_timeline_total_reacts _padd_r24 _padd_l24 _mar_b26"
      style={{ marginTop: "16px", display: "flex", justifyContent: "space-between" }}
    >
      <div className="_skeleton" style={{ width: "60px", height: "14px" }} />
      <div className="_skeleton" style={{ width: "100px", height: "14px" }} />
    </div>
    <div style={{ padding: "0 24px" }}>
      <div className="_skeleton" style={{ width: "100%", height: "36px", borderRadius: "8px" }} />
    </div>
  </div>
);

export default PostCardSkeleton;
