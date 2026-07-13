import { useState, type CSSProperties } from "react";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
}

const LazyImage = ({ src, alt, className, style }: LazyImageProps) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onLoad={() => setLoaded(true)}
      style={{
        ...style,
        filter: loaded ? "blur(0)" : "blur(16px)",
        transition: "filter 0.35s ease-out",
      }}
    />
  );
};

export default LazyImage;
