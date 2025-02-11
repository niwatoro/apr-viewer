export type InterestRate = {
  platform: string;
  symbol: string;
  rewardSymbol: string;
  chainName: string;
  chainId: number;
  tokenAddress: string;
  contractAddress: string;
  tvl: number;
  apy: number;
};
