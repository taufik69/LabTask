import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { queryClient } from "@/shared/api/queryClient";

const AppProviders = ({ children }: { children: ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
        <ToastContainer
          position="top-center"
          autoClose={3000}
          hideProgressBar
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export { AppProviders };
