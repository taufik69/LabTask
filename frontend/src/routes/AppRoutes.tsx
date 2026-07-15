import { lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { ErrorBoundary } from "react-error-boundary";
import ProtectedRoute from "@/routes/ProtectedRoute";
import PageLoader from "@/shared/components/PageLoader";
import ErrorFallback from "@/shared/components/ErrorFallback";

const RegistrationPage = lazy(
  () => import("@/modules/user/pages/RegistrationPage")
);
const LoginPage = lazy(() => import("@/modules/user/pages/LoginPage"));
const FeedPage = lazy(() => import("@/modules/user/pages/FeedPage"));

const AppRoutes = () => {
  const location = useLocation();

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      resetKeys={[location.pathname]}
    >
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/registration" element={<RegistrationPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/feed"
            element={
              <ProtectedRoute>
                <FeedPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <FeedPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};

export default AppRoutes;
