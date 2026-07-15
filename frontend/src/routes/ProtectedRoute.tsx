import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { ACCESS_TOKEN_KEY } from "@/shared/api/axiosClient";

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
