import PancakeSwapAbi from "@/lib/abi/pancakeswap/pool.json";
import UniswapPoolAbi from "@/lib/abi/uniswap/pool.json";
import { TRADABLE_TOKENS } from "@/lib/constants";
import PancakeSwapV3Pools from "@/lib/pools/pancakeswap-v3-pools.json";
import UniswapV3Pools from "@/lib/pools/uniswap-v3-pools.json";
import { DexPrice } from "@/types/dex-price";
import Big from "big.js";
import { ethers } from "ethers";
import { RPC_ENDPOINTS } from "../constants";

const providers = Object.fromEntries(Object.entries(RPC_ENDPOINTS).map(([chainId, url]) => [Number(chainId), new ethers.providers.JsonRpcProvider({ skipFetchSetup: true, url })]));

const fetchUniswapV3Prices = async (): Promise<DexPrice[]> => {
  const results = await Promise.allSettled(
    Object.entries(UniswapV3Pools).map(async ([chainIdStr, pools]) => {
      const chainId = Number.parseInt(chainIdStr);
      const provider = providers[chainId];

      const prices = [];
      for (const { token0Symbol, token0Address, token1Symbol, token1Address, poolAddress, fee } of pools) {
        const pool = new ethers.Contract(poolAddress, JSON.stringify(UniswapPoolAbi), provider);
        const slot0 = await pool.slot0();
        const sqrtPriceX96 = slot0.sqrtPriceX96;
        const Q96 = new Big(2).pow(96);
        const decimalAdjustment = new Big(10).pow(TRADABLE_TOKENS[chainId][token0Symbol].decimals - TRADABLE_TOKENS[chainId][token1Symbol].decimals);

        prices.push({
          dex: "Uniswap V3",
          poolAddress,
          chainId,
          baseSymbol: token0Symbol,
          quoteSymbol: token1Symbol,
          baseToken: token0Address,
          quoteToken: token1Address,
          price: Number.parseFloat(new Big(sqrtPriceX96.toString()).pow(2).div(Q96.pow(2)).mul(decimalAdjustment).toString()),
          fee,
        });
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
          const decimalAdjustment = new Big(10).pow(TRADABLE_TOKENS[chainId][token0Symbol].decimals - TRADABLE_TOKENS[chainId][token1Symbol].decimals);

          prices.push({
            dex: "PancakeSwap V3",
            poolAddress,
            chainId,
            baseSymbol: token0Symbol,
            quoteSymbol: token1Symbol,
            baseToken: token0Address,
            quoteToken: token1Address,
            price: Number.parseFloat(new Big(sqrtPriceX96.toString()).pow(2).div(Q96.pow(2)).mul(decimalAdjustment).toString()),
            fee,
          });
        } catch (e) {
          console.error(`Error fetching ${token0Symbol}-${token1Symbol} price on PancakeSwap V3:`, e);
        }
      }
      return prices;
    })
  );

  return results.filter((res) => res.status === "fulfilled").flatMap((res) => res.value.filter((v) => v !== null));
};

export const fetchDexPrices = async (): Promise<DexPrice[]> => {
  const [uniswapV3Prices, pancakeswapV3Prices] = await Promise.all([fetchUniswapV3Prices(), fetchPancakeSwapV3Prices()]);
  return [...uniswapV3Prices, ...pancakeswapV3Prices];
};
