import AaveJson from "@/lib/abi/aave.json";
import CompoundJson from "@/lib/abi/compound.json";
import UsdsVaultJson from "@/lib/abi/usds-vault.json";
import { AAVE_POOL_ADDRESSES, CHAINS, COMPOUND_CONTRACT_ADDRESSES, ETH_DECIMALS, RAY_DECIMALS, RPC_ENDPOINTS, SKY_CONTRACT_ADDRESSES, STABLECOIN_SYMBOLS, TRADABLE_TOKENS } from "@/lib/constants";
import { parseBigNumberWithDecimals } from "@/lib/utils";
import { AaveReserve } from "@/types/api-response";
import { normalize, RAY, rayPow, SECONDS_PER_YEAR, valueToZDBigNumber } from "@aave/protocol-js";
import { ethers } from "ethers";
import { NextRequest, NextResponse } from "next/server";
import "reflect-metadata";
import type { InterestRate } from "../../../types/interest-rate";

const providers = Object.fromEntries(Object.entries(RPC_ENDPOINTS).map(([chainId, url]) => [Number(chainId), new ethers.providers.JsonRpcProvider({ skipFetchSetup: true, url })]));

const fetchAaveYields = async (): Promise<InterestRate[]> => {
  try {
    const results = await Promise.allSettled(
      Object.entries(AAVE_POOL_ADDRESSES).map(async ([chainIdStr, providerAddress]) => {
        const chainId = Number.parseInt(chainIdStr);
        try {
          const provider = providers[chainId];
          const addressesProvider = new ethers.Contract(providerAddress, ["function getPoolDataProvider() external view returns (address)"], provider);

          const poolDataProviderAddress = await addressesProvider.getPoolDataProvider();
          const poolDataProvider = new ethers.Contract(poolDataProviderAddress, JSON.stringify(AaveJson), provider);

          const reserves = await poolDataProvider.getAllReservesTokens();
          const stableReserves = reserves.filter((reserve: AaveReserve) => STABLECOIN_SYMBOLS.includes(reserve.symbol));

          const rates = [];
          for (const reserve of stableReserves) {
            const data = await poolDataProvider.getReserveData(reserve.tokenAddress);
            rates.push({
              platform: "Aave",
              platformUrl: "https://app.aave.com/",
              symbol: reserve.symbol,
              rewardSymbol: reserve.symbol,
              chainName: CHAINS[chainId] ?? `Chain ID: ${chainId}`,
              chainId,
              tokenAddress: reserve.tokenAddress,
              contractAddress: poolDataProviderAddress,
              tvl: reserve.symbol === "EURS" ? (data.totalAToken.toNumber() - data.totalVariableDebt.toNumber()) / 100 : Number.parseFloat(normalize(valueToZDBigNumber(data.totalAToken.toString()).minus(valueToZDBigNumber(data.totalVariableDebt.toString())), chainId != 56 && ["USDT", "USDC", "PYUSD"].includes(reserve.symbol) ? 6 : ETH_DECIMALS)) || 0,
              apy: Number.parseFloat(normalize(rayPow(valueToZDBigNumber(data.liquidityRate.toString()).dividedBy(SECONDS_PER_YEAR).plus(RAY), SECONDS_PER_YEAR).minus(RAY), RAY_DECIMALS)) * 100,
            });
          }
          return rates;
        } catch (e) {
          console.error(`Error fetching Aave data for chain ${chainId}:`, e);
          return [];
        }
      })
    );
    console.log("Finished: Aave");

    return results.flatMap((res) => (res.status === "fulfilled" ? res.value : []));
  } catch (e) {
    console.error("Error fetching Aave data:", e);
    return [];
  }
};

const fetchCompoundIIIYields = async (): Promise<InterestRate[]> => {
  try {
    const results = await Promise.allSettled(
      Object.entries(COMPOUND_CONTRACT_ADDRESSES).map(async ([chainIdStr, compoundRewards]) => {
        const chainId = Number.parseInt(chainIdStr);
        const provider = providers[chainId];

        const rates = [];
        for (const [symbol, contractAddress] of Object.entries(compoundRewards)) {
          const contract = new ethers.Contract(contractAddress, JSON.stringify(CompoundJson), provider);
          const [totalSupply, totalBorrow, baseTokenPriceFeed, decimals, utilization, baseToken] = await Promise.all([contract.totalSupply(), contract.totalBorrow(), contract.baseTokenPriceFeed(), contract.decimals(), contract.getUtilization(), contract.baseToken()]);
          const [price, supplyRate] = await Promise.all([contract.getPrice(baseTokenPriceFeed), contract.getSupplyRate(utilization)]);

          rates.push({
            platform: "Compound III",
            platformUrl: "https://app.compound.finance/",
            symbol,
            rewardSymbol: symbol,
            chainName: CHAINS[chainId] || `Chain ID: ${chainId}`,
            chainId: chainId,
            contractAddress,
            tokenAddress: baseToken,
            tvl: (parseBigNumberWithDecimals(totalSupply, decimals) - parseBigNumberWithDecimals(totalBorrow, decimals)) * parseBigNumberWithDecimals(price, decimals),
            apy: Number.parseFloat(normalize(valueToZDBigNumber(supplyRate.toString()).times(SECONDS_PER_YEAR), 18)) * 100,
          });
        }
        return rates;
      })
    );

    console.log("Finished Compound III");

    return results.flatMap((res) => (res.status === "fulfilled" ? res.value.filter(Boolean) : []));
  } catch (e) {
    console.error("Error fetching Compound data:", e);
    return [];
  }
};

const fetchSkyYields = async (): Promise<InterestRate[]> => {
  try {
    const chainId = 1;
    const contractAddress = SKY_CONTRACT_ADDRESSES[chainId];

    const provider = providers[chainId];
    const contract = new ethers.Contract(contractAddress, JSON.stringify(UsdsVaultJson), provider);
    const [asset, decimals, ssr, symbol, totalAssets] = await Promise.all([contract.asset(), contract.decimals(), contract.ssr(), contract.symbol(), contract.totalAssets()]);

    console.log("Finished: Sky");

    return [
      {
        platform: "Sky",
        platformUrl: "https://app.sky.money/",
        symbol,
        rewardSymbol: symbol,
        chainName: CHAINS[chainId] ?? `Chain ID: ${chainId}`,
        chainId,
        tokenAddress: asset,
        contractAddress,
        tvl: parseBigNumberWithDecimals(totalAssets, decimals),
        apy: Number.parseFloat(normalize(rayPow(valueToZDBigNumber(ssr.toString()), SECONDS_PER_YEAR).minus(RAY), RAY_DECIMALS)) * 100,
        verified: TRADABLE_TOKENS?.[chainId]?.[symbol]?.address.toLowerCase() === asset?.toLowerCase(),
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
    const [aave, compound, sky] = await Promise.all([fetchAaveYields(), fetchCompoundIIIYields(), fetchSkyYields()]);

    const allRates = [...aave, ...compound, ...sky];
    return NextResponse.json(allRates, { status: 200 });
  } catch (error) {
    console.error("Error fetching interest rates:", error);
    return NextResponse.json({ error: "Failed to fetch interest rates" }, { status: 500 });
  }
};
