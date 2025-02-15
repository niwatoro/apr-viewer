import Erc20Json from "@/lib/abi/erc20.json";
import UniswapFactoryJson from "@/lib/abi/uniswap/factory.json";
import UniswapPairJson from "@/lib/abi/uniswap/pair.json";
import { RPC_ENDPOINTS, TRADABLE_TOKENS, UNISWAP_V3_FACTORY_ADDRESSES } from "@/lib/constants";
import { ArbitragePath } from "@/types/arbitrage-path";
import { BigNumber, ethers } from "ethers";
import { NextRequest, NextResponse } from "next/server";
import "reflect-metadata";

const TWO_POW_NINETY_SIX = BigNumber.from(2).pow(96);

type DexPrice = {
  dex: string;
  baseSymbol: string;
  quoteSymbol: string;
  baseToken: string;
  quoteToken: string;
  price: number;
};

const fetchUniswapV3Prices = async (): Promise<DexPrice[]> => {
  return (
    await Promise.all(
      Object.entries(UNISWAP_V3_FACTORY_ADDRESSES).map(async ([chainIdStr, factoryAddress]) => {
        const chainId = Number.parseInt(chainIdStr);
        const tokens = Object.entries(TRADABLE_TOKENS[chainId]);
        const pairs = [];
        for (let i = 0; i < tokens.length; i++) {
          for (let j = i + 1; j < tokens.length; j++) {
            pairs.push([tokens[i], tokens[j]]);
          }
        }

        const provider = new ethers.providers.JsonRpcProvider(RPC_ENDPOINTS[chainId]);
        const factory = new ethers.Contract(factoryAddress, JSON.stringify(UniswapFactoryJson), provider);

        return Promise.all(
          pairs.map(async ([firstToken, lastToken]) => {
            const pairAddress = await factory.getPair(firstToken[1], lastToken[1], 500);
            const pair = new ethers.Contract(pairAddress, JSON.stringify(UniswapPairJson), provider);
            const firstTokenContract = new ethers.Contract(firstToken[1], JSON.stringify(Erc20Json), provider);
            const secondTokenContract = new ethers.Contract(lastToken[1], JSON.stringify(Erc20Json), provider);
            const [slot0, token0, firstTokenDecimals, secondTokenDecimals] = await Promise.all([pair.slot0(), pair.token0(), firstTokenContract.decimals(), secondTokenContract.decimals()]);

            let token0Obj = {
              symbol: firstToken[0],
              address: firstToken[1],
              decimals: firstTokenDecimals,
            };
            let token1Obj = {
              symbol: lastToken[0],
              address: lastToken[1],
              decimals: secondTokenDecimals,
            };
            if (firstToken[1] !== token0) {
              const temp = token0Obj;
              token0Obj = token1Obj;
              token1Obj = temp;
            }

            const sqrtPriceX96 = slot0.sqrtPriceX96;

            return {
              dex: "Uniswap V3",
              baseSymbol: token0Obj.symbol,
              quoteSymbol: token1Obj.symbol,
              baseToken: token0Obj.address,
              quoteToken: token1Obj.address,
              price: (sqrtPriceX96 as BigNumber).div(TWO_POW_NINETY_SIX).pow(2).mul(token0Obj.decimals).div(token1Obj.decimals).toNumber(),
            };
          })
        );
      })
    )
  ).flat();
};

const fetchDexPrices = async (): Promise<DexPrice[]> => {
  return fetchUniswapV3Prices();
};

const calculateTwoTokenArbitrage = (prices: DexPrice[]): ArbitragePath[] => {
  return [];
};

const calculateArbitragePaths = (prices: DexPrice[]): ArbitragePath[] => {
  return calculateTwoTokenArbitrage(prices);
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
