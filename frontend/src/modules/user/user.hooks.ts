import { useMutation } from "@tanstack/react-query";
import { signUp, login } from "@/modules/user/user.api";

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

export { useSignUp, useLogin };
