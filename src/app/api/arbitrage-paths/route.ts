import { fetchDexPrices } from "@/lib/api/fetch-prices";
import { ArbitragePath } from "@/types/arbitrage-path";
import { DexPrice } from "@/types/dex-price";
import { NextRequest, NextResponse } from "next/server";
import "reflect-metadata";

// Calculate the fee multiplier for a given fee in 1/100 bp.
const feeMultiplier = (fee: number): number => 1 - fee * 1e-6;

const calculateTwoTokenArbitrage = (prices: DexPrice[]): ArbitragePath[] => {
  const arbitragePaths: ArbitragePath[] = [];

  // Build a mapping for token pairs regardless of their order.
  // This allows us to compare prices across different DEXs for the same pair.
  const priceMap: { [key: string]: DexPrice[] } = {};

  // Iterate through each price entry.
  prices.forEach((price) => {
    let key;
    let priceObj;
    // Determine the order for the token pair based on the token addresses.
    // This ensures consistency when grouping prices.
    if (price.baseToken < price.quoteToken) {
      key = `${price.baseToken}-${price.quoteToken}`;
      priceObj = price;
    } else {
      key = `${price.quoteToken}-${price.baseToken}`;
      // Reverse the price for the swapped pair so that the conversion rate is correct.
      priceObj = {
        ...price,
        baseToken: price.quoteToken,
        quoteToken: price.baseToken,
        baseSymbol: price.quoteSymbol,
        quoteSymbol: price.baseSymbol,
        price: 1 / price.price,
      };
    }
    // Initialize the array for this token pair if it doesn't exist.
    if (!priceMap[key]) {
      priceMap[key] = [];
    }
    // Add the normalized price to the map.
    priceMap[key].push(priceObj);
  });

  // Process each token pair to check for arbitrage opportunities.
  Object.values(priceMap).forEach((priceList) => {
    // Only consider pairs available on at least 2 different platforms.
    if (priceList.length < 2) return;

    // Find the minimum and maximum price in the price list.
    let minPrice = priceList[0];
    let maxPrice = priceList[0];
    priceList.forEach((price) => {
      if (price.price < minPrice.price) {
        minPrice = price;
      }
      if (price.price > maxPrice.price) {
        maxPrice = price;
      }
    });

    // For a two-token arbitrage, assume starting with quote tokens:
    // 1. Buy base tokens at the lower price (adjusted for fee).
    // 2. Sell base tokens at the higher price (adjusted for fee).
    // The effective conversion factors become:
    const effectiveBuy = feeMultiplier(minPrice.fee) / minPrice.price;
    const effectiveSell = feeMultiplier(maxPrice.fee) * maxPrice.price;
    const multiplier = effectiveBuy * effectiveSell;
    const profit = (multiplier - 1) * 100; // Profit percentage

    // A threshold can be used to filter out low profit opportunities (1% in this case).
    const threshold = 1;
    if (profit > threshold) {
      arbitragePaths.push({
        type: "Two Token",
        path: `[${minPrice.dex}] Buy ${minPrice.baseSymbol} @ ${minPrice.price.toPrecision(2)} → [${maxPrice.dex}] Sell ${minPrice.quoteSymbol} @ ${maxPrice.price.toPrecision(4)}`,
        profit,
      });
    }
  });

  return arbitragePaths;
};

const calculateThreeTokenArbitrage = (prices: DexPrice[]): ArbitragePath[] => {
  const arbitragePaths: ArbitragePath[] = [];

  // Step 1: Build a graph of token prices
  const graph: { [key: string]: DexPrice[] } = {};
  prices.forEach((price) => {
    const key = price.baseToken;
    if (!graph[key]) {
      graph[key] = [];
    }
    graph[key].push({
      dex: price.dex,
      chainId: price.chainId,
      baseSymbol: price.baseSymbol,
      quoteSymbol: price.quoteSymbol,
      baseToken: price.baseToken,
      quoteToken: price.quoteToken,
      poolAddress: price.poolAddress,
      price: price.price,
      fee: price.fee,
    });

    // Add reverse edge (quoteToken → baseToken)
    const reverseKey = price.quoteToken;
    if (!graph[reverseKey]) {
      graph[reverseKey] = [];
    }
    graph[reverseKey].push({
      dex: price.dex,
      chainId: price.chainId,
      baseSymbol: price.quoteSymbol,
      quoteSymbol: price.baseSymbol,
      baseToken: price.quoteToken,
      quoteToken: price.baseToken,
      poolAddress: price.poolAddress,
      price: 1 / price.price, // Inverse price
      fee: price.fee,
    });
  });

  // Step 2: Find all triangular cycles (A → B → C → A)
  const tokens = Object.keys(graph);
  for (const tokenA of tokens) {
    for (const edgeAB of graph[tokenA]) {
      const tokenB = edgeAB.quoteToken;
      if (tokenB === tokenA) continue; // Skip self-loops

      for (const edgeBC of graph[tokenB]) {
        const tokenC = edgeBC.quoteToken;
        if (tokenC === tokenA || tokenC === tokenB) continue; // Skip cycles with less than 3 tokens

        for (const edgeCA of graph[tokenC]) {
          if (edgeCA.quoteToken === tokenA) {
            // Found a cycle: A → B → C → A
            const priceAB = edgeAB.price;
            const priceBC = edgeBC.price;
            const priceCA = edgeCA.price;

            // Adjust each leg's conversion for fees
            const effectiveAB = priceAB * feeMultiplier(edgeAB.fee);
            const effectiveBC = priceBC * feeMultiplier(edgeBC.fee);
            const effectiveCA = priceCA * feeMultiplier(edgeCA.fee);
            const effectiveRate = effectiveAB * effectiveBC * effectiveCA;

            const profit = (effectiveRate - 1) * 100; // Profit percentage
            const threshold = 1; // 1% threshold for arbitrage opportunity
            if (profit > threshold) {
              arbitragePaths.push({
                type: "Three Token",
                path: `[${edgeAB.dex}] ${edgeAB.baseSymbol}/${edgeAB.quoteSymbol} @ ${priceAB.toPrecision(4)} → [${edgeBC.dex}] ${edgeBC.baseSymbol}/${edgeBC.quoteSymbol} @ ${priceBC.toPrecision(4)} → [${edgeCA.dex}] ${edgeCA.baseSymbol}/${edgeCA.quoteSymbol} @ ${priceCA.toPrecision(4)}`,
                profit,
              });
            }
          }
        }
      }
    }
  }

  return arbitragePaths;
};

const calculateArbitragePaths = (prices: DexPrice[]): ArbitragePath[] => {
  const twoTokenArbitrage = calculateTwoTokenArbitrage(prices);
  const threeTokenArbitrage = calculateThreeTokenArbitrage(prices);
  return [...twoTokenArbitrage, ...threeTokenArbitrage];
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const GET = async (request: NextRequest) => {
  try {
    const dexPrices = await fetchDexPrices();
    const arbitragePaths = calculateArbitragePaths(dexPrices);
    return NextResponse.json(arbitragePaths);
  } catch (error) {
    console.error("Error fetching arbitrage paths:", error);
    return NextResponse.json({ error: "Failed to fetch arbitrage paths" }, { status: 500 });
  }
};
