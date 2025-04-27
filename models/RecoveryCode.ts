import mongoose, { Schema, Document } from "mongoose";

interface IRecoveryCode extends Document {
  adminId: mongoose.Types.ObjectId;
  code: string;
  expiresAt: Date;
}

const RecoveryCodeSchema: Schema = new Schema({
  adminId: {
    type: Schema.Types.ObjectId,
    ref: "Admin",
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
    expires: 900, // Automatically delete after 15 minutes (900 seconds)
  },
});

export default mongoose.models.RecoveryCode || mongoose.model<IRecoveryCode>("RecoveryCode", RecoveryCodeSchema);