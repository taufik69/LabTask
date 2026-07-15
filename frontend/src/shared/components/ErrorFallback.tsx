import type { FallbackProps } from "react-error-boundary";

const ErrorFallback = ({ resetErrorBoundary }: FallbackProps) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      gap: "12px",
      textAlign: "center",
    }}
  >
    <span>Something went wrong.</span>
    <button type="button" onClick={resetErrorBoundary}>
      Try again
    </button>
  </div>
);

export default ErrorFallback;
