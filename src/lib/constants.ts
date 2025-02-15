export const ETH_DECIMALS = 18;
export const RAY_DECIMALS = 27;

export const STABLECOIN_SYMBOLS = ["USDT", "USDC", "DAI", "TUSD", "BUSD", "FDUSD", "USDe", "EURS", "USDP", "PYUSD", "FRAX", "USDD", "XAUt", "PAXG", "GUSD", "LUSD", "USDX", "USDS", "sUSD", "cUSD", "OUSD", "RLUSD", "USDG", "sDAI", "crvUSD", "sUSDe", "USDC.e", "USR"] as string[];

export const TRADABLE_TOKENS: { [chainId: string]: { [symbol: string]: string } } = {
  1: {
    USDT: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    BNB: "0xB8c77482e45F1F44dE1745F52C74426C631bDD52",
    USDC: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    stETH: "0xae7ab96520de3a18e5e111b5eaab095312d7fe84",
    WBTC: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
    LINK: "0x514910771af9ca656af840dff83e8264ecf986ca",
    wstETH: "0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0",
    SHIB: "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE",
    TONCOIN: "0x582d872a1b094fc48f5de31d3b73f2d9be47def1",
    WETH: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    LEO: "0x2af5d2ad76741191d15dfe7bf6ac92d4bd912ca3",
    DOT: "0x21c2c96dbfa137e23946143c71ac8330f9b44001",
    OM: "0x3593d125a4f7849a1b059e64f4517a86dd60c95d",
    BGB: "0x54D2252757e1672EEaD234D27B1270728fF90581",
    USDS: "0xdC035D45d973E3EC169d2276DDab16f1e407384F",
    USDe: "0x4c9edd5852cd905f086c759e8383e09bff1e68b3",
    UNI: "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
    weETH: "0xcd5fe23c85820f7b72d0926fc9b05b43e359b7ee",
    NEAR: "0x85f17cf997934a597031b2e18a9ab6ebd4b9f6a4",
    ONDO: "0xfaba6f8e4a5e8ab82f62fe7c39859fa577269be3",
    AAVE: "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9",
    stkAAVE: "0x4da27a545c0c5b758a6ba100e3a049001de870f5",
    MNT: "0x3c3a81e81dc49a522a592e7622a7e711c06bf354",
    DAI: "0x6b175474e89094c44da98b954eedeac495271d0f",
    sUSDS: "0xa3931d71877C0E7a3148CB7Eb4463524FEc27fbD",
    OKB: "0x75231f58b43240c9718dd58b4967c5114342a86c",
    VEN: "0xd850942ef8811f2a866692a623011bde52a462c1",
    POL: "0x455e53CBB86018Ac2B8092FdCd39d8444aFFC3F6",
    cbBTC: "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf",
    CRO: "0xa0b73e1ff0b80914ab6fe0444e65848c4c34450b",
    RNDR: "0x6de037ef9ad2725eb40118bb1702ebb27e4aeb24",
    WFIL: "0x6e1A19F235bE7ED8E3369eF73b196C07257494DE",
    ARB: "0xB50721BCf8d664c30412Cfbc6cf7a15145234ad1",
    FDUSD: "0xc5f0f7b66764F6ec8C8Dff7BA683102295E16409",
    FET: "0xaea46A60368A7bD060eec7DF8CBa43b7EF41Ad85",
    ATOM: "0x8D983cb9388EaC77af0474fA441C4815500Cb7BB",
    "ATOM (IBC)": "0x519ddeff5d142fc177d95f24952ef3d2ede530bc",
    LBTC: "0x8236a87084f8b84306f72007f36f2618a5634494",
    LDO: "0x5a98fcbea516cf06857215779fd812ca3bef1b32",
    INJ: "0xe28b3B32B6c345A34Ff64674606124Dd5Aceca30",
    ENA: "0x57e114B691Db790C35207b2e685D4A43181e6061",
    KCS: "0xf34960d9d60be18cc1d5afc1a6f012a723a28811",
    IMX: "0xf57e7e7c23978c3caec3c3548e3d615c346e79ff",
    BONK: "0x4aef9bd3fbb09d8f374436d9ec25711a1be9bacb",
    BBTC: "0xf5e11df1ebcf78b6b6d26e04ff19cd786a1e81dc",
    THETA: "0x3883f5e181fccaf8410fa61e12b59bad963fb645",
    QNT: "0x4a220e6096b25eadb88358cb44068a3248254675",
    MOVE: "0x3073f7aaa4db83f95e9fff17424f71d4751a3073",
    TUSD: "0x0000000000085d4780b73119b644ae5ecd22b376",
  },
} as const;

export const CHAINS = {
  1: "Ethereum",
  10: "Optimisim",
  56: "BNB Chain",
  100: "Gnosis",
  137: "Polygon",
  250: "Fantom",
  5000: "Mantle",
  8453: "Base",
  43114: "Avalanche",
  42161: "Arbitrum",
  534352: "Scroll",
  81457: "Blast",
  42220: "Celo",
  480: "World Chain",
  324: "zkSync",
  7777777: "Zora",
} as { [chainId: number]: string };

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
  81457: "https://rpc.ankr.com/blast",
  42220: "https://rpc.ankr.com/celo",
  480: "https://worldchain-mainnet.g.alchemy.com/public",
  324: "https://mainnet.era.zksync.io",
  7777777: "https://rpc.zora.energy",
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

export const UNISWAP_V3_FACTORY_ADDRESSES: { [chainId: number]: string } = {
  43114: "0x740b1c1de25031C31FF4fC9A62f554A55cdC1baD",
  42161: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
  56: "0xdB1d10011AD0Ff90774D0C6Bb92e5C5c8b4461F7",
  8453: "0x33128a8fC17869897dcE68Ed026d694621f6FDfD",
  81457: "0x792edAdE80af5fC680d96a2eD80A44247D2Cf6Fd",
  42220: "0xAfE208a311B21f13EF87E33A90049fC17A7acDEc",
  1: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
  10: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
  137: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
  324: "0x8FdA5a7a8dCA67BBcDd10F02Fa0649A937215422",
  7777777: "0x7145F8aeef1f6510E92164038E1B6F8cB2c42Cbb",
};
