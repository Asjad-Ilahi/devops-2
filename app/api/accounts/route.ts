import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import jwt, { JwtPayload } from "jsonwebtoken";

// Define the expected shape of our JWT payload
interface CustomJwtPayload extends JwtPayload {
  userId: string;
}

const JWT_SECRET = 'iuB2C7z9';
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    let decoded: CustomJwtPayload;
    try {
      const verified = jwt.verify(token, JWT_SECRET as string);
      
      if (typeof verified === "string" || !verified) {
        return NextResponse.json({ error: "Invalid token format" }, { status: 401 });
      }

      decoded = verified as CustomJwtPayload;

      if (!decoded.userId) {
        return NextResponse.json({ error: "Invalid token: missing userId" }, { status: 401 });
      }
    } catch (error) {
      console.error("Token verification failed:", error);
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    // Fetch the user including twoFactorEnabled
    const user = await User.findById(decoded.userId).select(
      "accountNumber savingsNumber cryptoNumber balance savingsBalance cryptoBalance createdAt twoFactorEnabled"
    );
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      checkingNumber: user.accountNumber || "Not Set",
      savingsNumber: user.savingsNumber || "Not Set",
      cryptoNumber: user.cryptoNumber || "Not Set",
      checkingBalance: user.balance || 0,
      savingsBalance: user.savingsBalance || 0,
      cryptoBalance: user.cryptoBalance || 0,
      openedDate: user.createdAt ? user.createdAt.toISOString().split("T")[0] : "N/A",
      twoFactorEnabled: user.twoFactorEnabled || false, // Include twoFactorEnabled
    }, { status: 200 });
  } catch (error) {
    console.error("Accounts fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}