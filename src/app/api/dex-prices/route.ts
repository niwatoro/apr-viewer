import { fetchDexPrices } from "@/lib/api/fetchPrices";
import { NextRequest, NextResponse } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const GET = async (request: NextRequest) => {
  try {
    const prices = await fetchDexPrices();
    return NextResponse.json(prices, { status: 200 });
  } catch (error) {
    console.error("Error fetching interest rates:", error);
    return NextResponse.json({ error: "Failed to fetch interest rates" }, { status: 500 });
  }
};
