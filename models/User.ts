import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  ssn: { type: String, required: true },
  streetAddress: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  balance: { type: Number, default: 0 }, // Checking balance
  savingsBalance: { type: Number, default: 0 },
  cryptoBalance: { type: Number, default: 0 },
  status: { type: String, enum: ["pending", "active", "suspended"], default: "active" },
  twoFactorEnabled: { type: Boolean, default: false },
  lastLogin: { type: Date, default: null },
  accountNumber: { type: String }, // Checking account number
  savingsNumber: { type: String },
  cryptoNumber: { type: String },
  verificationCode: { type: String },
  twoFactorCode: { type: String },
  isVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },

  pendingTransfer: {
    from: { type: String },
    to: { type: String },
    amount: { type: Number },
    memo: { type: String },
    verificationCode: { type: String },
    createdAt: { type: Date }
  },
  pendingExternalTransfer: {
    from: String,
    amount: Number,
    externalBankName: String,
    externalAccountNumber: String,
    externalStreet: String,
    externalCity: String,
    externalState: String,
    externalZip: String,
    externalPhone: String,
    memo: String,
    verificationCode: String,
    createdAt: Date,
  },
  pendingZelleTransfer: {
    recipientId: { type: String }, // Recipient's user ID
    amount: { type: Number },
    memo: { type: String },
    verificationCode: { type: String },
    createdAt: { type: Date }
  },
});

export default mongoose.models.User || mongoose.model("User", userSchema);