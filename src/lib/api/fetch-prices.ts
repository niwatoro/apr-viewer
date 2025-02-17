import UniswapPoolAbi from "@/lib/abi/uniswap/pool.json";
import { TRADABLE_TOKENS } from "@/lib/constants";
import PancakeSwapV3Pools from "@/lib/pools/pancakeswap-v3-pools.json";
import UniswapV3Pools from "@/lib/pools/uniswap-v3-pools.json";
import { DexPrice } from "@/types/dex-price";
import Big from "big.js";
import { BigNumber, ethers } from "ethers";
import { RPC_ENDPOINTS } from "../constants";

const Q96 = Big(2).pow(96);
const sqrt99 = Big("0.99498743710662");
const sqrt101 = Big("1.00498756211209");
const providers = Object.fromEntries(Object.entries(RPC_ENDPOINTS).map(([chainId, url]) => [Number(chainId), new ethers.providers.JsonRpcProvider({ skipFetchSetup: true, url })]));

const fetchUniswapV3Prices = async (): Promise<DexPrice[]> => {
  const results = await Promise.allSettled(
    Object.entries(UniswapV3Pools).map(async ([chainIdStr, pools]) => {
      const chainId = Number.parseInt(chainIdStr);
      const provider = providers[chainId];

      const prices = [];
      for (const { token0Symbol, token0Address, token1Symbol, token1Address, poolAddress, fee } of pools) {
        try {
          const poolContract = new ethers.Contract(poolAddress, JSON.stringify(UniswapPoolAbi), provider);
          const [slot0, liquidity] = await Promise.all([poolContract.slot0(), poolContract.liquidity()]);
          const sqrtPriceX96: BigNumber = slot0.sqrtPriceX96;
          const decimalAdjustment = Big(10).pow(TRADABLE_TOKENS[chainId][token0Symbol].decimals - TRADABLE_TOKENS[chainId][token1Symbol].decimals);

          const S = Big(sqrtPriceX96.toString()).div(Q96);

          const SLimitToken0 = S.times(sqrt99);
          const SLimitToken1 = S.times(sqrt101);

          const L = Big(liquidity.toString());

          const tradableAmountBaseToken = L.times(S.minus(SLimitToken0)).div(S.times(SLimitToken0));
          const tradableAmountQuoteToken = L.times(SLimitToken1.minus(S));

          prices.push({
            dex: "Uniswap V3",
            poolAddress,
            chainId,
            baseSymbol: token0Symbol,
            quoteSymbol: token1Symbol,
            baseToken: token0Address,
            quoteToken: token1Address,
            price: Number.parseFloat(S.pow(2).mul(decimalAdjustment).toString()),
            fee,
            tradableAmountBaseToken: Number.parseFloat(tradableAmountBaseToken.div(Big(10).pow(TRADABLE_TOKENS[chainId][token0Symbol].decimals)).toString()),
            tradableAmountQuoteToken: Number.parseFloat(tradableAmountQuoteToken.div(Big(10).pow(TRADABLE_TOKENS[chainId][token1Symbol].decimals)).toString()),
          });
        } catch (e) {
          console.error(`Error fetching ${token0Symbol}-${token1Symbol} price on Uniswap V3:`, e);
        }
      }
      return prices;
    })
  );

  console.log("Finished: Uniswap V3");
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
          const poolContract = new ethers.Contract(poolAddress, JSON.stringify(UniswapPoolAbi), provider);
          const [slot0, liquidity] = await Promise.all([poolContract.slot0(), poolContract.liquidity()]);
          const sqrtPriceX96: BigNumber = slot0.sqrtPriceX96;
          const decimalAdjustment = Big(10).pow(TRADABLE_TOKENS[chainId][token0Symbol].decimals - TRADABLE_TOKENS[chainId][token1Symbol].decimals);

          const S = Big(sqrtPriceX96.toString()).div(Q96);

          const SLimitToken0 = S.times(sqrt99);
          const SLimitToken1 = S.times(sqrt101);

          const L = Big(liquidity.toString());

          const tradableAmountBaseToken = L.times(S.minus(SLimitToken0)).div(S.times(SLimitToken0));
          const tradableAmountQuoteToken = L.times(SLimitToken1.minus(S));

          prices.push({
            dex: "PancakeSwap V3",
            poolAddress,
            chainId,
            baseSymbol: token0Symbol,
            quoteSymbol: token1Symbol,
            baseToken: token0Address,
            quoteToken: token1Address,
            price: Number.parseFloat(S.pow(2).mul(decimalAdjustment).toString()),
            fee,
            tradableAmountBaseToken: Number.parseFloat(tradableAmountBaseToken.div(Big(10).pow(TRADABLE_TOKENS[chainId][token0Symbol].decimals)).toString()),
            tradableAmountQuoteToken: Number.parseFloat(tradableAmountQuoteToken.div(Big(10).pow(TRADABLE_TOKENS[chainId][token1Symbol].decimals)).toString()),
          });
        } catch (e) {
          console.error(`Error fetching ${token0Symbol}-${token1Symbol} price on PancakeSwap V3:`, e);
        }
      }
      return prices;
    })
  );

  console.log("Finished: PancakeSwap V3");
  return results.filter((res) => res.status === "fulfilled").flatMap((res) => res.value.filter((v) => v !== null));
};

export const fetchDexPrices = async (): Promise<DexPrice[]> => {
  const [uniswapV3Prices, pancakeswapV3Prices] = await Promise.all([fetchUniswapV3Prices(), fetchPancakeSwapV3Prices()]);
  return [...uniswapV3Prices, ...pancakeswapV3Prices];
};
