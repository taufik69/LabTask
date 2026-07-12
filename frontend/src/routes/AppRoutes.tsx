import { Routes, Route } from "react-router-dom";
import RegistrationPage from "@/modules/user/pages/RegistrationPage";
import LoginPage from "@/modules/user/pages/LoginPage";
import FeedPage from "@/modules/user/pages/FeedPage";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/registration" element={<RegistrationPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/feed" element={<FeedPage />} />
      <Route path="/" element={<FeedPage />} />
    </Routes>
  );
};

export default AppRoutes;
