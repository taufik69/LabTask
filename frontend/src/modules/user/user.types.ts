interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  createdAt: string;
}

interface SignUpPayload {
  name: string;
  email: string;
  password: string;
}

export type { User, SignUpPayload };
