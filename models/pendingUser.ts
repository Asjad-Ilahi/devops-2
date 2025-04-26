import mongoose from "mongoose";

const pendingUserSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  ssn: { type: String, required: true },
  streetAddress: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  verificationCode: { type: String },
  isVerified: { type: Boolean, default: false }, // Email verification status
  username: { type: String, default: "" }, // Added for Step 3
  password: { type: String, default: "" }, // Added for Step 3, will be hashed
  adminVerified: { type: Boolean, default: false }, // Admin approval status
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.PendingUser || mongoose.model("PendingUser", pendingUserSchema);