import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
}

const Button = ({ isLoading, children, disabled, ...rest }: ButtonProps) => {
  return (
    <button
      disabled={disabled || isLoading}
      className="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      {...rest}
    >
      {isLoading ? "Please wait..." : children}
    </button>
  );
};

export { Button };
