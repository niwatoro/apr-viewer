const EXPLORER_URLS = {
  1: "https://etherscan.io",
  10: "https://optimistic.etherscan.io",
  56: "https://bscscan.com",
  100: "https://gnosisscan.io",
  137: "https://polygonscan.com",
  250: "https://ftmscan.com",
  5000: "https://explorer.mantle.xyz",
  8453: "https://basescan.org",
  43114: "https://cchain.explorer.avax.network",
  42161: "https://arbiscan.io",
  534352: "https://scrollscan.com",
};

export const getExplorerTokenUrl = (chainId: number, tokenAddress: string) => {
  return `${EXPLORER_URLS[chainId as keyof typeof EXPLORER_URLS]}/token/${tokenAddress}`;
};

export const getExplorerContractUrl = (chainId: number, contractAddress: string) => {
  return `${EXPLORER_URLS[chainId as keyof typeof EXPLORER_URLS]}/address/${contractAddress}`;
};
