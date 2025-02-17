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

    // --- Calculate maximum trade amounts for each leg ---
    // For the buy leg (minPrice dex), we are spending quote tokens to receive base tokens.
    // The maximum quote amount allowed is limited by two factors:
    // 1. The pool's quote token limit.
    // 2. The base token limit converted to quote terms.
    const buyLimitFromQuote = minPrice.tradableAmountQuoteToken;
    const buyLimitFromBase = (minPrice.tradableAmountBaseToken * minPrice.price) / feeMultiplier(minPrice.fee);
    const QBuyMax = Math.min(buyLimitFromQuote, buyLimitFromBase);

    // For the sell leg (maxPrice dex), we are selling base tokens for quote tokens.
    // The maximum base tokens we can sell is limited by:
    // 1. The pool's base token limit.
    // 2. The quote token limit converted to base terms.
    const sellLimitFromBase = maxPrice.tradableAmountBaseToken;
    const sellLimitFromQuote = maxPrice.tradableAmountQuoteToken / (feeMultiplier(maxPrice.fee) * maxPrice.price);
    const XSellMax = Math.min(sellLimitFromBase, sellLimitFromQuote);

    // In the buy leg, if you spend Q quote tokens, you get:
    // baseBought = Q * feeMultiplier(minPrice.fee) / minPrice.price.
    // To ensure that baseBought does not exceed XSellMax:
    // Q must be <= XSellMax * minPrice.price / feeMultiplier(minPrice.fee)
    const QLimitForSell = (XSellMax * minPrice.price) / feeMultiplier(minPrice.fee);

    // The maximum quote tokens we can use is then:
    const QMaxPossible = Math.min(QBuyMax, QLimitForSell);

    // If no trade is possible, skip.
    if (QMaxPossible <= 0) return;

    const baseBought = (QMaxPossible * feeMultiplier(minPrice.fee)) / minPrice.price;
    const quoteReceived = baseBought * feeMultiplier(maxPrice.fee) * maxPrice.price;
    const profitAmount = quoteReceived - QMaxPossible;

    // We require the effective multiplier to be >1.01 (i.e. >1% profit) for the opportunity.
    const effectiveMultiplier = quoteReceived / QMaxPossible;
    if (effectiveMultiplier > 1.01 && profitAmount > 0) {
      arbitragePaths.push({
        type: "Two Token",
        path: `[${minPrice.dex}] ${minPrice.baseSymbol}/${minPrice.quoteSymbol} @ ${minPrice.price.toPrecision(4)} → [${maxPrice.dex}] ${maxPrice.baseSymbol}/${maxPrice.quoteSymbol} @ ${maxPrice.price.toPrecision(4)}`,
        profit: profitAmount,
      });
    }
  });

  return arbitragePaths;
};

const calculateThreeTokenArbitrage = (prices: DexPrice[]): ArbitragePath[] => {
  const arbitragePaths: ArbitragePath[] = [];

  // Build a graph of token prices
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
      tradableAmountBaseToken: price.tradableAmountBaseToken,
      tradableAmountQuoteToken: price.tradableAmountQuoteToken,
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
      tradableAmountBaseToken: price.tradableAmountQuoteToken,
      tradableAmountQuoteToken: price.tradableAmountBaseToken,
      price: 1 / price.price, // Inverse price
      fee: price.fee,
    });
  });

  // Helper to compute the maximum input allowed for an edge.
  const getEdgeLimit = (edge: DexPrice): number => {
    return Math.min(edge.tradableAmountBaseToken, edge.tradableAmountQuoteToken / (feeMultiplier(edge.fee) * edge.price));
  };

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
            const LAB = getEdgeLimit(edgeAB);
            const LBC = getEdgeLimit(edgeBC);
            const LCA = getEdgeLimit(edgeCA);

            // Let X be the amount of token A we start with
            // For edgeAB (A→B): we require X <= LAB
            // The output from edgeAB will be:
            //   Y = X * feeMultiplier(edgeAB.fee) * edgeAB.price.
            // For edgeBC (B→C): require Y <= LBC  =>  X <= LBC / (feeMultiplier(edgeAB.fee) * edgeAB.price)
            // The output from edgeBC will be:
            //   Z = Y * feeMultiplier(edgeBC.fee) * edgeBC.price
            // For edgeCA (C→A): require Z <= LCA  =>
            //   X <= LCA / (feeMultiplier(edgeAB.fee) * edgeAB.price * feeMultiplier(edgeBC.fee) * edgeBC.price)
            const XMax = Math.min(LAB, LBC / (feeMultiplier(edgeAB.fee) * edgeAB.price), LCA / (feeMultiplier(edgeAB.fee) * edgeAB.price * feeMultiplier(edgeBC.fee) * edgeBC.price));

            if (XMax <= 0) continue;

            // Final amount after completing the cycle:
            const finalAmount = XMax * feeMultiplier(edgeAB.fee) * edgeAB.price * feeMultiplier(edgeBC.fee) * edgeBC.price * feeMultiplier(edgeCA.fee) * edgeCA.price;

            const profitAmount = finalAmount - XMax;
            const effectiveMultiplier = finalAmount / XMax;

            if (effectiveMultiplier > 1.01 && profitAmount > 0) {
              arbitragePaths.push({
                type: "Three Token",
                path: `[${edgeAB.dex}] ${edgeAB.baseSymbol}/${edgeAB.quoteSymbol} @ ${edgeAB.price.toPrecision(4)} → [${edgeBC.dex}] ${edgeBC.baseSymbol}/${edgeBC.quoteSymbol} @ ${edgeBC.price.toPrecision(4)} → [${edgeCA.dex}] ${edgeCA.baseSymbol}/${edgeCA.quoteSymbol} @ ${edgeCA.price.toPrecision(4)}`,
                profit: profitAmount,
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
