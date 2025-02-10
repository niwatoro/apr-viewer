import { AaveReserve, CompoundRewards, YearnVault } from "@/types/api-response";
import { ETH_DECIMALS, normalize, RAY, RAY_DECIMALS, rayPow, SECONDS_PER_YEAR, valueToZDBigNumber } from "@aave/protocol-js";
import { ethers } from "ethers";
import { NextRequest, NextResponse } from "next/server";
import "reflect-metadata";
import type { InterestRate } from "../../../types/interest-rate";

const STABLE_COIN_SYMBOLS = ["USDT", "USDC", "DAI", "TUSD", "BUSD", "FDUSD", "USDe", "EURS", "USDP", "PYUSD", "FRAX", "USDD", "XAUt", "PAXG", "GUSD", "LUSD", "USDX", "USDS", "sUSD", "cUSD", "OUSD", "RLUSD", "USDG", "sDAI", "crvUSD", "sUSDe"];

const CHAINS = [
  { id: 1, name: "Ethereum" },
  { id: 10, name: "Optimism" },
  { id: 56, name: "BNB Chain" },
  { id: 100, name: "Gnosis" },
  { id: 137, name: "Polygon" },
  { id: 250, name: "Fantom" },
  { id: 5000, name: "Mantle" },
  { id: 8453, name: "Base" },
  { id: 43114, name: "Avalanche" },
  { id: 42161, name: "Arbitrum" },
  { id: 534352, name: "Scroll" },
];

const RPC_ENDPOINTS: { [key: number]: string } = {
  1: "https://rpc.ankr.com/eth",
  10: "https://rpc.ankr.com/optimism",
  56: "https://rpc.ankr.com/bsc",
  100: "https://rpc.ankr.com/gnosis",
  137: "https://rpc.ankr.com/polygon",
  250: "https://rpc.ankr.com/fantom",
  5000: "https://mantle-rpc.publicnode.com",
  8453: "https://rpc.ankr.com/base",
  43114: "https://rpc.ankr.com/avalanche",
  42161: "https://rpc.ankr.com/arbitrum",
  534352: "https://rpc.ankr.com/scroll",
};

const AAVE_POOL_ADDRESSES: { [key: number]: string } = {
  1: "0x2f39d218133afab8f2b819b1066c7e434ad94e9e",
  10: "0xa97684ead0e402dc232d5a977953df7ecbab3cdb",
  56: "0xff75b6da14ffbbfd355daf7a2731456b3562ba6d",
  100: "0x36616cf17557639614c1cddb356b1b83fc0b2132",
  137: "0xa97684ead0e402dc232d5a977953df7ecbab3cdb",
  250: "0xa97684ead0e402dc232d5a977953df7ecbab3cdb",
  8453: "0xe20fcbdbffc4dd138ce8b2e6fbb6cb49777ad64d",
  43114: "0xa97684ead0e402dc232d5a977953df7ecbab3cdb",
  42161: "0xa97684ead0e402dc232d5a977953df7ecbab3cdb",
  534352: "0x69850d0b276776781c063771b161bd8894bcdd04",
};

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
        const poolDataProvider = new ethers.Contract(poolDataProviderAddress, ["function getAllReservesTokens() external view returns (tuple(string symbol, address tokenAddress)[])", "function getReserveData(address asset) external view returns (uint256 unbacked, uint256 accruedToTreasuryScaled, uint256 totalAToken, uint256 totalStableDebt, uint256 totalVariableDebt, uint256 liquidityRate, uint256 variableBorrowRate, uint256 stableBorrowRate, uint256 averageStableBorrowRate, uint256 liquidityIndex, uint256 variableBorrowIndex, uint40 lastUpdateTimestamp)"], provider);

        const reserves = await poolDataProvider.getAllReservesTokens();
        const stableReserves = reserves.filter((reserve: AaveReserve) => STABLE_COIN_SYMBOLS.includes(reserve.symbol));

        const reserveData = await Promise.all(
          stableReserves.map(async (reserve: AaveReserve) => {
            const data = await poolDataProvider.getReserveData(reserve.tokenAddress);
            return {
              platform: "Aave",
              symbol: reserve.symbol,
              rewardSymbol: reserve.symbol,
              chainName: CHAINS.find((chain) => chain.id === chainId)?.name ?? `Chain ID: ${chainId}`,
              tokenAddress: reserve.tokenAddress,
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
    const response = await fetch("https://v3-api.compound.finance/market/all-networks/all-contracts/rewards/dapp-data");
    const data = (await response.json()) as CompoundRewards[];
    return data
      .filter(({ base_asset }) => STABLE_COIN_SYMBOLS.includes(base_asset.symbol))
      .map(({ chain_id, base_asset, reward_asset, earn_rewards_apr }) => ({
        platform: "Compound",
        symbol: base_asset.symbol,
        rewardSymbol: reward_asset.symbol,
        chainName: CHAINS.find((chain) => chain.id === chain_id)?.name ?? `Chain ID: ${chain_id}`,
        tokenAddress: base_asset.address,
        tvl: 0,
        apy: Number.parseFloat(earn_rewards_apr) * 100,
      }));
  } catch (e) {
    console.error("Error fetching Compound data:", e);
    return [];
  }
};

const fetchSkyYields = async (): Promise<InterestRate[]> => {
  try {
    const response = await fetch("https://info-sky.blockanalitica.com/api/v1/overall/?format=json");
    const data = await response.json();
    return [
      { chainId: 1, symbol: "USDS" },
      { chainId: 8453, symbol: "USDS" },
      { chainId: 8453, symbol: "USDC" },
    ].map(({ chainId, symbol }) => ({
      platform: "Sky",
      symbol,
      rewardSymbol: symbol,
      chainName: CHAINS.find((chain) => chain.id === chainId)?.name ?? `Chain ID: ${chainId}`,
      tokenAddress: "",
      tvl: 0,
      apy: Number.parseFloat(data[0].sky_savings_rate_apy) * 100,
    }));
  } catch (e) {
    console.error("Error fetching Sky data:", e);
    return [];
  }
};

const fetchYearnYields = async (): Promise<InterestRate[]> => {
  try {
    const response = await fetch("https://ydaemon.yearn.fi/vaults?hideAlways=true&strategiesCondition=inQueue&limit=2500");
    const data = await response.json();
    return (data as YearnVault[])
      .filter(({ token }) => STABLE_COIN_SYMBOLS.includes(token.symbol))
      .map(({ chainID, token, tvl, apr }) => ({
        platform: "Yearn",
        symbol: token.symbol,
        rewardSymbol: token.symbol,
        chainName: CHAINS.find((chain) => chain.id === chainID)?.name ?? `Chain ID: ${chainID}`,
        tokenAddress: token.address,
        tvl: tvl.tvl,
        apy: (apr.netAPR || apr.forwardAPR.netAPR) * (1 - apr.fees.performance - apr.fees.management) * 100,
      }))
      .filter(({ tvl }) => tvl > 0);
  } catch (e) {
    console.error("Error fetching Yearn data:", e);
    return [];
  }
};

// Implement other yield fetching functions here...

export const GET = async (_: NextRequest) => {
  try {
    const [aave, compound, sky, yearn] = await Promise.all([
      fetchAaveYields(),
      fetchCompoundYields(),
      fetchSkyYields(),
      fetchYearnYields(),
      // Add other yield fetching functions here
    ]);

    const allRates = [...aave, ...compound, ...sky, ...yearn];
    return NextResponse.json(allRates, { status: 200 });
  } catch (error) {
    console.error("Error fetching interest rates:", error);
    return NextResponse.json({ error: "Failed to fetch interest rates" }, { status: 500 });
  }
};
