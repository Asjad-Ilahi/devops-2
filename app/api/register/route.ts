import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import PendingUser from "@/models/pendingUser";
import { sendVerificationEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    // Connect to the database
    await dbConnect();

    // Parse the request body
    const {
      fullName,
      email,
      phone,
      ssn,
      streetAddress,
      city,
      state,
      zipCode,
      step,
    } = await req.json();

    // Validate the step parameter
    if (!step || !["requestCode", "verifyCode"].includes(step)) {
      return NextResponse.json(
        { error: "Invalid or missing step parameter" },
        { status: 400 }
      );
    }

    if (step === "requestCode") {
      // Validate required fields
      if (
        !fullName ||
        !email ||
        !phone ||
        !ssn ||
        !streetAddress ||
        !city ||
        !state ||
        !zipCode
      ) {
        return NextResponse.json(
          { error: "All fields are required" },
          { status: 400 }
        );
      }

      // Check if a pending user already exists with this email
      let pendingUser = await PendingUser.findOne({ email });

      if (pendingUser) {
        // If the user is already verified, prevent re-registration
        if (pendingUser.isVerified) {
          return NextResponse.json(
            { error: "Email already verified" },
            { status: 400 }
          );
        }
        // Update existing pending user with a new verification code
        const newCode = crypto.randomBytes(3).toString("hex").toUpperCase();
        pendingUser.verificationCode = newCode;
        await pendingUser.save();
        await sendVerificationEmail(email, newCode);
        return NextResponse.json(
          {
            message: "Verification code resent",
            pendingUserId: pendingUser._id.toString(),
          },
          { status: 200 }
        );
      } else {
        // Create a new pending user
        const verificationCode = crypto
          .randomBytes(3)
          .toString("hex")
          .toUpperCase();
        pendingUser = new PendingUser({
          fullName,
          email,
          phone,
          ssn,
          streetAddress,
          city,
          state,
          zipCode,
          verificationCode,
          isVerified: false,
          adminVerified: false,
          username: "", // Placeholder until Step 3
          password: "", // Placeholder until Step 3
        });

        // Save the pending user to the database
        await pendingUser.save();

        // Send the verification email
        await sendVerificationEmail(email, verificationCode);

        // Return success response with pendingUserId
        return NextResponse.json(
          {
            message: "Verification code sent to your email",
            pendingUserId: pendingUser._id.toString(),
          },
          { status: 200 }
        );
      }
    } else if (step === "verifyCode") {
      // Placeholder for future verification logic (not needed for handleFirstStep)
      return NextResponse.json(
        { error: "Verification step not implemented in this route" },
        { status: 501 }
      );
    }
  } catch (error: any) {
    // Log the error for debugging
    console.error("Registration error:", error);

    // Return a generic error response
    return NextResponse.json(
      {
        error:
          error.message || "An unexpected error occurred during registration",
      },
      { status: 500 }
    );
  }
}
