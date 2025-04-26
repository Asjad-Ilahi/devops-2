// app/api/admin/login/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Admin from "@/models/Admin";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"; // Ensure this is set in your .env file

export async function POST(request: Request) {
    try {
        await dbConnect();
        const { username, password } = await request.json();

        if (!username || !password) {
            return NextResponse.json(
                { error: "Username and password are required" },
                { status: 400 }
            );
        }

        const admin = await Admin.findOne({ username });
        if (!admin) {
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            );
        }

        const isPasswordValid = await admin.comparePassword(password);
        if (!isPasswordValid) {
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            );
        }

        // Create a JWT token
        const token = jwt.sign(
            { adminId: admin._id, username: admin.username, role: "admin" },
            JWT_SECRET,
            { expiresIn: "1h" }
        );

        // Set the token in a cookie (optional, for client-side persistence)
        const response = NextResponse.json({
            success: true,
            admin: {
                id: admin._id,
                username: admin.username,
            },
            token,
        });

        response.cookies.set("adminToken", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 3600, // 1 hour
            path: "/",
        });

        return response;
    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}