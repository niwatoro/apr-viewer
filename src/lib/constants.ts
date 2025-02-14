export const STABLE_COIN_SYMBOLS = ["USDT", "USDC", "DAI", "TUSD", "BUSD", "FDUSD", "USDe", "EURS", "USDP", "PYUSD", "FRAX", "USDD", "XAUt", "PAXG", "GUSD", "LUSD", "USDX", "USDS", "sUSD", "cUSD", "OUSD", "RLUSD", "USDG", "sDAI", "crvUSD", "sUSDe", "USDC.e", "USR"];

export const CHAINS = [
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

export const RPC_ENDPOINTS: { [key: number]: string } = {
  1: "https://rpc.ankr.com/eth",
  10: "https://rpc.ankr.com/optimism",
  56: "https://rpc.ankr.com/bsc",
  100: "https://rpc.ankr.com/gnosis",
  137: "https://rpc.ankr.com/polygon",
  250: "https://endpoints.omniatech.io/v1/fantom/mainnet/public",
  5000: "https://mantle-rpc.publicnode.com",
  8453: "https://rpc.ankr.com/base",
  43114: "https://rpc.ankr.com/avalanche",
  42161: "https://rpc.ankr.com/arbitrum",
  534352: "https://rpc.ankr.com/scroll",
};

export const AAVE_POOL_ADDRESSES: { [key: number]: string } = {
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

export const COMPOUND_CONTRACT_ADDRESSES: { [chainId: number]: { [tokenSymbol: string]: string } } = {
  1: {
    USDC: "0xc3d688B66703497DAA19211EEdff47f25384cdc3",
    USDT: "0x3Afdc9BCA9213A35503b077a6072F3D0d5AB0840",
    USDS: "0x5D409e56D886231aDAf00c8775665AD0f9897b56",
  },
  137: {
    USDC: "0xF25212E676D1F7F89Cd72fFEe66158f541246445",
    USDT: "0xaeB318360f27748Acb200CE616E389A6C9409a07",
  },
  42161: {
    "USDC.e": "0xA5EDBDD9646f8dFF606d7448e414884C7d905dCA",
    USDC: "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf",
    USDT: "0xd98Be00b5D27fc98112BdE293e487f8D4cA57d07",
  },
  8453: {
    USDC: "0xb125E6687d4313864e53df431d5425969c15Eb2F",
    USDbC: "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf",
  },
  534352: {
    USDC: "0xB2f97c1Bd3bf02f5e74d13f02E3e26F93D77CE44",
  },
  10: {
    USDC: "0x2e44e174f7D53F0212823acC11C01A11d58c5bCB",
    USDT: "0x995E394b8B2437aC8Ce61Ee0bC610D617962B214",
  },
  5000: {
    USDe: "0x606174f62cd968d8e684c645080fa694c1D7786E",
  },
};

export const SKY_CONTRACT_ADDRESSES: { [chainId: number]: string } = {
  1: "0xa3931d71877C0E7a3148CB7Eb4463524FEc27fbD",
};
