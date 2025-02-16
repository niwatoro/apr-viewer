(async () => {
  const { TRADABLE_TOKENS, RPC_ENDPOINTS } = require("../src/lib/constants");
  const { ethers } = require("ethers");

  const providers = Object.fromEntries(Object.entries(RPC_ENDPOINTS).map(([chainId, url]) => [Number(chainId), new ethers.providers.JsonRpcProvider({ skipFetchSetup: true, url })]));

  for (const [chainIdStr, tokens] of Object.entries(TRADABLE_TOKENS)) {
    const chainId = Number.parseInt(chainIdStr);
    const provider = providers[chainId];
    const tokenAddresses = Object.entries(tokens as Record<string, string>);

    for (const [symbol, address] of tokenAddresses) {
      const tokenContract = new ethers.Contract(address, ["function decimals() view returns (uint8)"], provider);
      const decimals = await tokenContract.decimals();
      console.log(`Token ${symbol} on chain ${chainId} has ${decimals} decimals`);
    }
  }
})();
