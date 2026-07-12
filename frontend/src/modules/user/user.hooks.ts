import { useMutation } from "@tanstack/react-query";
import { signUp } from "@/modules/user/user.api";

const useSignUp = () => {
  return useMutation({
    mutationFn: signUp,
  });
};

export { useSignUp };
