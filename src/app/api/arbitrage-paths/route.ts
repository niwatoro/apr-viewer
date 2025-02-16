import PancakeSwapAbi from "@/lib/abi/pancakeswap/pool.json";
import UniswapPoolAbi from "@/lib/abi/uniswap/pool.json";
import { RPC_ENDPOINTS, TRADABLE_TOKENS } from "@/lib/constants";
import PancakeSwapV3Pools from "@/lib/pools/pancakeswap-v3-pools.json";
import UniswapV3Pools from "@/lib/pools/uniswap-v3-pools.json";
import { ArbitragePath } from "@/types/arbitrage-path";
import Big from "big.js";
import { ethers } from "ethers";
import { NextRequest, NextResponse } from "next/server";
import "reflect-metadata";

const providers = Object.fromEntries(Object.entries(RPC_ENDPOINTS).map(([chainId, url]) => [Number(chainId), new ethers.providers.JsonRpcProvider({ skipFetchSetup: true, url })]));

type DexPrice = {
  dex: string;
  baseSymbol: string;
  quoteSymbol: string;
  baseToken: string;
  quoteToken: string;
  price: number;
  fee: number;
};

const fetchUniswapV3Prices = async (): Promise<DexPrice[]> => {
  const results = await Promise.allSettled(
    Object.entries(UniswapV3Pools).map(async ([chainIdStr, pools]) => {
      const chainId = Number.parseInt(chainIdStr);
      const provider = providers[chainId];

      const prices = [];
      for (const { token0Symbol, token0Address, token1Symbol, token1Address, poolAddress, fee } of pools) {
        try {
          const pool = new ethers.Contract(poolAddress, JSON.stringify(UniswapPoolAbi), provider);
          const slot0 = await pool.slot0();
          const sqrtPriceX96 = slot0.sqrtPriceX96;
          const Q96 = new Big(2).pow(96);
          let decimalAdjustment;
          if (token0Symbol === "WETH" && token1Symbol === "USDC") {
            decimalAdjustment = new Big(10).pow(-5);
          } else {
            decimalAdjustment = new Big(10).pow(TRADABLE_TOKENS[chainId][token0Symbol].decimals - TRADABLE_TOKENS[chainId][token1Symbol].decimals);
          }

          prices.push({
            dex: "Uniswap V3",
            baseSymbol: token0Symbol,
            quoteSymbol: token1Symbol,
            baseToken: token0Address,
            quoteToken: token1Address,
            price: Number.parseFloat(new Big(sqrtPriceX96.toString()).pow(2).div(Q96.pow(2)).mul(decimalAdjustment).toString()),
            fee,
          });
        } catch (e) {
          console.error(`Error fetching ${token0Symbol}-${token1Symbol} price on Uniswap V3:`, e);
        } finally {
          await new Promise((resolve) => setTimeout(resolve, 100)); // Rate limit requests
        }
      }
      return prices;
    })
  );

  return results.filter((res) => res.status === "fulfilled").flatMap((res) => res.value.filter((v) => v !== null));
};

const fetchPancakeSwapV3Prices = async (): Promise<DexPrice[]> => {
  const results = await Promise.allSettled(
    Object.entries(PancakeSwapV3Pools).map(async ([chainIdStr, pools]) => {
      const chainId = Number.parseInt(chainIdStr);
      const provider = providers[chainId];

      const prices = [];
      for (const { token0Symbol, token0Address, token1Symbol, token1Address, poolAddress, fee } of pools) {
        try {
          const pool = new ethers.Contract(poolAddress, JSON.stringify(PancakeSwapAbi), provider);
          const slot0 = await pool.slot0();
          const sqrtPriceX96 = slot0.sqrtPriceX96;
          const Q96 = new Big(2).pow(96);
          let decimalAdjustment;
          if (token0Symbol === "WETH" && token1Symbol === "USDC") {
            decimalAdjustment = new Big(10).pow(-5);
          } else {
            decimalAdjustment = new Big(10).pow(TRADABLE_TOKENS[chainId][token0Symbol].decimals - TRADABLE_TOKENS[chainId][token1Symbol].decimals);
          }
          prices.push({
            dex: "PancakeSwap V3",
            baseSymbol: token0Symbol,
            quoteSymbol: token1Symbol,
            baseToken: token0Address,
            quoteToken: token1Address,
            price: Number.parseFloat(new Big(sqrtPriceX96.toString()).pow(2).div(Q96.pow(2)).mul(decimalAdjustment).toString()),
            fee,
          });
        } catch (e) {
          console.error(`Error fetching ${token0Symbol}-${token1Symbol} price on PancakeSwap V3:`, e);
        } finally {
          await new Promise((resolve) => setTimeout(resolve, 100)); // Rate limit requests
        }
      }
      return prices;
    })
  );

  return results.filter((res) => res.status === "fulfilled").flatMap((res) => res.value.filter((v) => v !== null));
};

const fetchDexPrices = async (): Promise<DexPrice[]> => {
  const [uniswapV3Prices, pancakeswapV3Prices] = await Promise.all([fetchUniswapV3Prices(), fetchPancakeSwapV3Prices()]);
  return [...uniswapV3Prices, ...pancakeswapV3Prices];
};

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

    // Calculate the price difference and determine profit percentage.
    // profit percentage formula: (difference / average price) * 100
    const priceDifference = maxPrice.price - minPrice.price;
    const profit = (priceDifference / (maxPrice.price + minPrice.price)) * 100;

    // A threshold can be used to filter out low profit opportunities (0% in this case).
    const threshold = 0;
    if (profit > threshold) {
      arbitragePaths.push({
        type: "Two Token",
        path: `[${minPrice.dex}] Buy ${minPrice.baseSymbol} @ ${minPrice.price.toPrecision(2)} → [${maxPrice.dex}] Sell ${minPrice.quoteSymbol} @ ${maxPrice.price.toFixed(2)}`,
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
      baseSymbol: price.baseSymbol,
      baseToken: price.baseToken,
      quoteSymbol: price.quoteSymbol,
      quoteToken: price.quoteToken,
      dex: price.dex,
      price: price.price,
      fee: price.fee,
    });

    // Add reverse edge (quoteToken → baseToken)
    const reverseKey = price.quoteToken;
    if (!graph[reverseKey]) {
      graph[reverseKey] = [];
    }
    graph[reverseKey].push({
      baseSymbol: price.quoteSymbol,
      baseToken: price.quoteToken,
      quoteSymbol: price.baseSymbol,
      quoteToken: price.baseToken,
      dex: price.dex,
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

            // Incorporate fees on each leg of the swap
            const effectiveRate = priceAB * priceBC * priceCA;

            const profit = (effectiveRate - 1) * 100; // Profit percentage

            // Only record profitable cycles
            const threshold = 0; // 0% threshold for arbitrage opportunity
            if (profit > threshold) {
              arbitragePaths.push({
                type: "Three Token",
                path: `[${edgeAB.dex}] ${edgeAB.baseSymbol}/${edgeAB.quoteSymbol} @ ${priceAB.toFixed(2)} → [${edgeBC.dex}] ${edgeBC.baseSymbol}/${edgeBC.quoteSymbol} @ ${priceBC.toFixed(2)} → [${edgeCA.dex}] ${edgeCA.baseSymbol}/${edgeCA.quoteSymbol} @ ${priceCA.toFixed(2)}`,
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
    console.log("Fetched DEX prices.");
    const arbitragePaths = calculateArbitragePaths(dexPrices);
    return NextResponse.json(arbitragePaths);
  } catch (error) {
    console.error("Error fetching arbitrage paths:", error);
    return NextResponse.json({ error: "Failed to fetch arbitrage paths" }, { status: 500 });
  }
};
