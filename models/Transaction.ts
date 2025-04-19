import mongoose from "mongoose";

// Define the Transaction schema
const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
    index: true,
  },
  type: {
    type: String,
    enum: [
      "deposit",
      "withdrawal",
      "transfer",
      "payment",
      "fee",
      "interest",
      "crypto_buy",
      "crypto_sell",
      "refund",
    ],
    required: true,
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  accountType: {
    type: String,
    enum: ["checking", "savings", "crypto"],
    required: true,
  },
  status: {
    type: String,
    enum: ["completed", "pending", "failed"],
    default: "completed",
  },
  cryptoAmount: {
    type: Number,
    required: function (this: any) {
      return this.type === "crypto_buy" || this.type === "crypto_sell";
    },
  },
  cryptoPrice: {
    type: Number,
    required: function (this: any) {
      return this.type === "crypto_buy" || this.type === "crypto_sell";
    },
  },
  relatedTransactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Transaction",
  },
});

export default mongoose.models.Transaction || mongoose.model("Transaction", transactionSchema);