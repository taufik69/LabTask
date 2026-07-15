import { useMutation, useQueryClient } from "@tanstack/react-query";
import { signUp, login, logout } from "@/modules/user/user.api";

const useSignUp = () => {
  return useMutation({
    mutationFn: signUp,
  });
};

const useLogin = () => {
  return useMutation({
    mutationFn: login,
  });
};

const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      // drop every cached query so the next login doesn't briefly show
      // the previous user's feed/comments before a refetch lands
      queryClient.clear();
    },
  });
};

export { useSignUp, useLogin, useLogout };
