import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import PendingUser from "@/models/pendingUser";
import User from "@/models/User";
import crypto from "crypto";

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const { pendingUserId } = await req.json();

        if (!pendingUserId) {
            return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
        }

        const pendingUser = await PendingUser.findById(pendingUserId);
        if (!pendingUser || !pendingUser.isVerified) {
            return NextResponse.json({ error: "User not found or not email-verified" }, { status: 400 });
        }

        if (pendingUser.adminVerified === true) {
            return NextResponse.json({ error: "User already approved" }, { status: 400 });
        }

        const existingUser = await User.findOne({ $or: [{ email: pendingUser.email }, { username: pendingUser.username }] });
        if (existingUser) {
            return NextResponse.json({ error: "Email or username already in use" }, { status: 400 });
        }

        const newUser = new User({
            fullName: pendingUser.fullName,
            email: pendingUser.email,
            phone: pendingUser.phone,
            ssn: pendingUser.ssn,
            streetAddress: pendingUser.streetAddress,
            city: pendingUser.city,
            state: pendingUser.state,
            zipCode: pendingUser.zipCode,
            username: pendingUser.username,
            password: pendingUser.password,
            isVerified: true,
            accountNumber: `CHK-${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
            savingsNumber: `SAV-${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
            cryptoNumber: `BTC-${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
            balance: 0,
            savingsBalance: 0,
            cryptoBalance: 0,
        });
        await newUser.save();
        await PendingUser.deleteOne({ _id: pendingUserId });

        return NextResponse.json({ message: "User approved and account numbers generated" }, { status: 200 });
    } catch (error: any) {
        console.error("Approval error:", error);
        return NextResponse.json(
            { error: error.message || "Approval failed" },
            { status: 500 }
        );
    }
}