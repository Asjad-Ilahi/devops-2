import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true",
      {
        headers: {
          "x-cg-demo-api-key": process.env.CRYPTO_KEY || "CRYPTO_KEY",
        },
      }
    );
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch BTC price: ${response.status} - ${errorText}`);
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Price fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch price" }, { status: 500 });
  }
}