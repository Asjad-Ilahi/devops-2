
import { auth, signInWithPhoneNumber, RecaptchaVerifier } from "@/firebase";

export async function sendVerificationSMS(phoneNumber: string, recaptchaVerifier: RecaptchaVerifier) {
  try {
    // Ensure phone number is in the correct E.164 format (e.g., +923001234567)
    const cleanedPhoneNumber = phoneNumber.replace(/\D/g, "");
    const formattedPhoneNumber = `+${cleanedPhoneNumber}`;
    console.log("Sending SMS to:", formattedPhoneNumber);

    // Validate phone number format
    if (!/^\+\d{10,15}$/.test(formattedPhoneNumber)) {
      throw new Error("Invalid phone number format. Must include country code and be 10-15 digits.");
    }

    const confirmationResult = await signInWithPhoneNumber(auth, formattedPhoneNumber, recaptchaVerifier);
    console.log("SMS verification code sent successfully");
    return confirmationResult;
  } catch (error: any) {
    console.error("Error sending SMS:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    throw error; // Let the caller handle the error
  }
}
