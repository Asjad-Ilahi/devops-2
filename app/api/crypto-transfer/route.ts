// /api/crypto-transfer
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Transaction from "@/models/Transaction";

export async function POST(request: Request) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret") as { userId: string };
    await dbConnect();

    const { action, amount, btcPrice, recipientWallet, memo } = await request.json();
    if (!action || !amount || !btcPrice) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const btcAmount = parseFloat(amount);

    if (action === "buy") {
      const usdAmount = btcAmount * btcPrice;
      if (user.balance < usdAmount) {
        return NextResponse.json({ error: "Insufficient checking balance" }, { status: 400 });
      }

      user.balance -= usdAmount;
      user.cryptoBalance = (user.cryptoBalance || 0) + btcAmount;

      await Transaction.create({
        userId: user._id,
        description: "Bitcoin Purchase",
        amount: -usdAmount,
        type: "crypto_buy",
        category: "Crypto",
        accountType: "crypto",
        status: "completed",
        cryptoAmount: btcAmount,
        cryptoPrice: btcPrice,
      });

      await user.save();

      return NextResponse.json({
        message: `Successfully bought ${btcAmount.toFixed(8)} BTC`,
        newCheckingBalance: user.balance,
        newCryptoBalance: user.cryptoBalance,
      });
    } else if (action === "sell") {
      if ((user.cryptoBalance || 0) < btcAmount) {
        return NextResponse.json({ error: "Insufficient Bitcoin balance" }, { status: 400 });
      }

      const usdAmount = btcAmount * btcPrice;
      user.balance += usdAmount;
      user.cryptoBalance -= btcAmount;

      await Transaction.create({
        userId: user._id,
        description: "Bitcoin Sale",
        amount: usdAmount,
        type: "crypto_sell",
        category: "Crypto",
        accountType: "crypto",
        status: "completed",
        cryptoAmount: -btcAmount,
        cryptoPrice: btcPrice,
      });

      await user.save();

      return NextResponse.json({
        message: `Successfully sold ${btcAmount.toFixed(8)} BTC`,
        newCheckingBalance: user.balance,
        newCryptoBalance: user.cryptoBalance,
      });
    } else if (action === "bitcoin_transfer") {
      if (!recipientWallet) {
        return NextResponse.json({ error: "Recipient wallet address is required" }, { status: 400 });
      }

      if ((user.cryptoBalance || 0) < btcAmount) {
        return NextResponse.json({ error: "Insufficient Bitcoin balance" }, { status: 400 });
      }

      user.cryptoBalance -= btcAmount;

      await Transaction.create({
        userId: user._id,
        description: `Bitcoin Sent to ${recipientWallet}`,
        amount: 0, // No USD amount involved
        type: "bitcoin_transfer",
        category: "Crypto Transfer",
        accountType: "crypto",
        status: "completed",
        cryptoAmount: -btcAmount,
        cryptoPrice: btcPrice,
        recipientWallet,
        memo: memo || "",
      });

      await user.save();

      return NextResponse.json({
        message: `Successfully sent ${btcAmount.toFixed(8)} BTC to ${recipientWallet}`,
        newCheckingBalance: user.balance,
        newCryptoBalance: user.cryptoBalance,
      });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Crypto transfer error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}