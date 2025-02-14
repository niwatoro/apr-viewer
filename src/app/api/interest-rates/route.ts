import AaveJson from "@/lib/abi/aave.json";
import CompoundJson from "@/lib/abi/compound.json";
import UsdsVaultJson from "@/lib/abi/usds-vault.json";
import { AAVE_POOL_ADDRESSES, CHAINS, COMPOUND_CONTRACT_ADDRESSES, RPC_ENDPOINTS, SKY_CONTRACT_ADDRESSES, STABLE_COIN_SYMBOLS } from "@/lib/constants";
import { parseBigNumberWithDecimals } from "@/lib/utils";
import { AaveReserve } from "@/types/api-response";
import { ETH_DECIMALS, normalize, RAY, RAY_DECIMALS, rayPow, SECONDS_PER_YEAR, valueToZDBigNumber } from "@aave/protocol-js";
import { ethers } from "ethers";
import { NextRequest, NextResponse } from "next/server";
import "reflect-metadata";
import type { InterestRate } from "../../../types/interest-rate";

const fetchAaveYields = async (): Promise<InterestRate[]> => {
  const results = await Promise.all(
    Object.entries(AAVE_POOL_ADDRESSES).map(async ([chainIdStr, providerAddress]) => {
      const chainId = Number(chainIdStr);
      try {
        const provider = new ethers.providers.JsonRpcProvider({
          skipFetchSetup: true,
          url: RPC_ENDPOINTS[chainId],
        });
        const addressesProvider = new ethers.Contract(providerAddress, ["function getPoolDataProvider() external view returns (address)"], provider);

        const poolDataProviderAddress = await addressesProvider.getPoolDataProvider();
        const poolDataProvider = new ethers.Contract(poolDataProviderAddress, JSON.stringify(AaveJson), provider);

        const reserves = await poolDataProvider.getAllReservesTokens();
        const stableReserves = reserves.filter((reserve: AaveReserve) => STABLE_COIN_SYMBOLS.includes(reserve.symbol));

        const reserveData = await Promise.all(
          stableReserves.map(async (reserve: AaveReserve) => {
            const data = await poolDataProvider.getReserveData(reserve.tokenAddress);
            return {
              platform: "Aave",
              platformUrl: "https://app.aave.com/",
              symbol: reserve.symbol,
              rewardSymbol: reserve.symbol,
              chainName: CHAINS.find((chain) => chain.id === chainId)?.name ?? `Chain ID: ${chainId}`,
              chainId,
              tokenAddress: reserve.tokenAddress,
              contractAddress: poolDataProviderAddress,
              tvl: reserve.symbol === "EURS" ? (data.totalAToken.toNumber() - data.totalVariableDebt.toNumber()) / 100 : Number.parseFloat(normalize(valueToZDBigNumber(data.totalAToken.toString()).minus(valueToZDBigNumber(data.totalVariableDebt.toString())), chainId != 56 && ["USDT", "USDC", "PYUSD"].includes(reserve.symbol) ? 6 : ETH_DECIMALS)) || 0,
              apy: Number.parseFloat(normalize(rayPow(valueToZDBigNumber(data.liquidityRate.toString()).dividedBy(SECONDS_PER_YEAR).plus(RAY), SECONDS_PER_YEAR).minus(RAY), RAY_DECIMALS)) * 100,
            };
          })
        );

        return reserveData;
      } catch (e) {
        console.error(`Error fetching Aave data for chain ${chainId}:`, e);
        return [];
      }
    })
  );

  return results.flat();
};

const fetchCompoundYields = async (): Promise<InterestRate[]> => {
  try {
    return (
      await Promise.all(
        Object.entries(COMPOUND_CONTRACT_ADDRESSES).map(async (arg) => {
          const [chainId, compoundRewards] = arg;
          const provider = new ethers.providers.JsonRpcProvider({
            skipFetchSetup: true,
            url: RPC_ENDPOINTS[Number(chainId)],
          });

          return await Promise.all(
            Object.entries(compoundRewards).map(async (arg) => {
              const [symbol, contractAddress] = arg;
              const contract = new ethers.Contract(contractAddress, JSON.stringify(CompoundJson), provider);
              const [totalSupply, totalBorrow, baseTokenPriceFeed, decimals, utilization, baseToken] = await Promise.all([contract.totalSupply(), contract.totalBorrow(), contract.baseTokenPriceFeed(), contract.decimals(), contract.getUtilization(), contract.baseToken()]);
              const [price, supplyRate] = await Promise.all([contract.getPrice(baseTokenPriceFeed), contract.getSupplyRate(utilization)]);

              return {
                platform: "Compound III",
                platformUrl: "https://app.compound.finance/",
                symbol,
                rewardSymbol: symbol,
                chainName: CHAINS.find((chain) => chain.id === Number(chainId))?.name ?? `Chain ID: ${chainId}`,
                chainId: Number(chainId),
                contractAddress,
                tokenAddress: baseToken,
                tvl: (parseBigNumberWithDecimals(totalSupply, decimals) - parseBigNumberWithDecimals(totalBorrow, decimals)) * parseBigNumberWithDecimals(price, decimals),
                apy: Number.parseFloat(normalize(valueToZDBigNumber(supplyRate.toString()).times(SECONDS_PER_YEAR), 18)) * 100,
              };
            })
          );
        })
      )
    ).flatMap((x) => x);
  } catch (e) {
    console.error("Error fetching Compound data:", e);
    return [];
  }
};

const fetchSkyYields = async (): Promise<InterestRate[]> => {
  try {
    const chainId = 1;
    const contractAddress = SKY_CONTRACT_ADDRESSES[chainId];

    const provider = new ethers.providers.JsonRpcProvider({
      skipFetchSetup: true,
      url: RPC_ENDPOINTS[chainId],
    });
    const contract = new ethers.Contract(contractAddress, JSON.stringify(UsdsVaultJson), provider);
    const [asset, decimals, ssr, symbol, totalAssets] = await Promise.all([contract.asset(), contract.decimals(), contract.ssr(), contract.symbol(), contract.totalAssets()]);

    return [
      {
        platform: "Sky",
        platformUrl: "https://app.sky.money/",
        symbol,
        rewardSymbol: symbol,
        chainName: CHAINS.find((chain) => chain.id === chainId)?.name ?? `Chain ID: ${chainId}`,
        chainId,
        tokenAddress: asset,
        contractAddress,
        tvl: parseBigNumberWithDecimals(totalAssets, decimals),
        apy: Number.parseFloat(normalize(rayPow(valueToZDBigNumber(ssr.toString()), SECONDS_PER_YEAR).minus(RAY), RAY_DECIMALS)) * 100,
      },
    ];
  } catch (e) {
    console.error("Error fetching Sky data:", e);
    return [];
  }
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const GET = async (request: NextRequest) => {
  try {
    const [aave, compound, sky] = await Promise.all([
      fetchAaveYields(),
      fetchCompoundYields(),
      fetchSkyYields(),
      // Add other yield fetching functions here
    ]);

    const allRates = [...aave, ...compound, ...sky];
    return NextResponse.json(allRates, { status: 200 });
  } catch (error) {
    console.error("Error fetching interest rates:", error);
    return NextResponse.json({ error: "Failed to fetch interest rates" }, { status: 500 });
  }
};
