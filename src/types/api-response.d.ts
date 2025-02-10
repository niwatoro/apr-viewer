export type AaveReserve = {
  symbol: string;
  tokenAddress: string;
};

export type CompoundRewards = {
  chain_id: number;
  comet: { address: string };
  comet_rewards: { address: string };
  base_asset: {
    address: string;
    decimals: number;
    description: string;
    symbol: string;
    minBorrow: string;
    priceFeed: string;
  };
  reward_asset: {
    address: string;
    decimals: number;
    description: string;
    price: string;
    symbol: string;
  };
  earn_rewards_apr: string;
  borrow_rewards_apr: string;
};

export type YearnVault = {
  address: string;
  type: string;
  kind: string;
  symbol: string;
  name: string;
  category: string;
  version: string;
  decimals: number;
  chainID: number;
  token: {
    address: string;
    name: string;
    symbol: string;
    description: string;
    decimals: number;
  };
  tvl: { totalAssets: string; tvl: number; price: number };
  apr: {
    type: string;
    netAPR: number;
    fees: {
      performance: number;
      management: number;
    };
    points: {
      weekAgo: number;
      monthAgo: number;
      inception: number;
    };
    pricePerShare: {
      today: number;
      weekAgo: number;
      monthAgo: number;
    };
    extra: {
      stakingRewardsAPR: number;
      gammaRewardAPR: null;
    };
    forwardAPR: {
      type: string;
      netAPR: number;
      composite: {
        boost: null;
        poolAPY: null;
        boostedAPR: null;
        baseAPR: null;
        cvxAPR: null;
        rewardsAPR: null;
        vnumberOracleCurrentAPR: number;
        vnumberOracleStratRatioAPR: number;
      };
    };
  };
  strategies: {
    address: string;
    name: string;
    details: {
      totalDebt: string;
      totalLoss: string;
      totalGain: string;
      performanceFee: number;
      lastReport: number;
      debtRatio: number;
    };
  }[];
  staking: {
    address: string;
    available: bool;
    source: string;
    rewards: null;
  };
  migration: {
    available: bool;
    address: string;
    contract: string;
  };
  featuringScore: number;
  pricePerShare: string;
  info: {
    sourceURL: string;
    riskLevel: number;
    isRetired: bool;
    isBoosted: bool;
    isHighlighted: bool;
    riskScore: number[];
  };
};
