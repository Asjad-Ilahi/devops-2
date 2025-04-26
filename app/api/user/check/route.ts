import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  await dbConnect();
  const { contactType, value } = await req.json();

  if (!contactType || !value) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (contactType !== "email" && contactType !== "phone") {
    return NextResponse.json({ error: "Invalid contact type" }, { status: 400 });
  }

  try {
    const user = await User.findOne({ [contactType]: value });
    if (user) {
      return NextResponse.json({ exists: true, name: user.fullName }, { status: 200 });
    } else {
      return NextResponse.json({ exists: false }, { status: 200 });
    }
  } catch (error) {
    console.error("Error checking user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}