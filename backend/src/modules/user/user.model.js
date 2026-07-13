import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";


const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    username: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    refreshToken: {
      type: String,
      select: false,
    },
  },
  { timestamps: true },
);

/* ---------- Pre-save hook: username generate + password hash ---------- */
userSchema.pre("save", async function (next) {
  // username generate — sudhu notun user ba name change hole
  if (
    this.isNew ||
    this.isModified("firstName") ||
    this.isModified("lastName")
  ) {
    const base = `${this.firstName}${this.lastName}`
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    let username = base;
    // unique username generate while not unique
    while (
      await mongoose.models.User.exists({ username, _id: { $ne: this._id } })
    ) {
      username = `${base}${Math.floor(1000 + Math.random() * 9000)}`;
    }
    this.username = username;
  }

  // password hash
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }

  next();
});

/* ---------- Method: password compare ---------- */
userSchema.methods.isPasswordCorrect = async function (plainPassword) {
  return await bcrypt.compare(plainPassword, this.password);
};

/* ---------- Method: Access Token ---------- */
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "50m" },
  );
};

/* ---------- Method: Refresh Token ---------- */
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign({ _id: this._id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d",
  });
};

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
