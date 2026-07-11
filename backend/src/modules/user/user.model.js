import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String },
    role: { type: String, enum: ["ADMIN", "USER"], default: "USER" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const User = mongoose.model("User", userSchema);

export default User;
