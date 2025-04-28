// app/models/UserRecoveryCode.ts
import mongoose from "mongoose";

const userRecoveryCodeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
});

export default mongoose.models.UserRecoveryCode || mongoose.model("UserRecoveryCode", userRecoveryCodeSchema);