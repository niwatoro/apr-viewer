(async () => {
  const { TRADABLE_TOKENS, RPC_ENDPOINTS, CHAINS } = require("../src/lib/constants");
  const { ethers } = require("ethers");

  const providers = Object.fromEntries(Object.entries(RPC_ENDPOINTS).map(([chainId, url]) => [Number(chainId), new ethers.providers.JsonRpcProvider({ skipFetchSetup: true, url })]));

  for (const [chainIdStr, tokens] of Object.entries(TRADABLE_TOKENS)) {
    const chainId = Number.parseInt(chainIdStr);
    const provider = providers[chainId];
    const tokenAddresses = Object.entries(tokens as Record<string, { address: string; decimals: number }>);

    for (const [symbol, { address, decimals }] of tokenAddresses) {
      const tokenContract = new ethers.Contract(address, ["function decimals() view returns (uint8)"], provider);
      const contractDecimals = await tokenContract.decimals();
      if (contractDecimals !== decimals) {
        console.log(`❌ Mismatch for ${symbol} on ${CHAINS[chainId]}: expected ${decimals}, got ${contractDecimals}`);
      } else {
        console.log(`✅ Match for ${symbol} on ${CHAINS[chainId]}: expected ${decimals}, got ${contractDecimals}`);
      }
    }
  }
})();
