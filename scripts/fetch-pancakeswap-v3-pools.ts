import { BigNumber } from "ethers";

(async () => {
  const { RPC_ENDPOINTS, TRADABLE_TOKENS, PANCAKESWAP_V3_FACTORY_ADDRESSES } = require("../src/lib/constants.ts");
  const { ethers } = require("ethers");
  const fs = require("fs");
  const PancakeswapFactoryJson = require("../src/lib/abi/pancakeswap/factory.json");
  const PancakeswapPoolJson = require("../src/lib/abi/pancakeswap/pool.json");

  const providers = Object.fromEntries(Object.entries(RPC_ENDPOINTS).map(([chainId, url]) => [Number(chainId), new ethers.providers.JsonRpcProvider({ skipFetchSetup: true, url })]));
  const addresses: {
    [chainId: number]: { token0Symbol: string; token0Address: string; token1Symbol: string; token1Address: string; poolAddress: string; fee: number }[];
  } = {};

  for (const [chainIdStr, factoryAddress] of Object.entries(PANCAKESWAP_V3_FACTORY_ADDRESSES)) {
    const chainId = Number.parseInt(chainIdStr);
    const tokens = Object.entries(TRADABLE_TOKENS[chainId] || []);
    const pools: [string, { address: string; decimals: number }][][] = [];
    for (let i = 0; i < tokens.length; i++) {
      for (let j = i + 1; j < tokens.length; j++) {
        pools.push([tokens[i] as any, tokens[j] as any]);
      }
    }

    const provider = providers[chainId];
    const factory = new ethers.Contract(factoryAddress, JSON.stringify(PancakeswapFactoryJson), provider);
    addresses[chainId] = [];

    for (const [firstToken, lastToken] of pools) {
      for (const fee of [100, 500, 2500, 10000]) {
        try {
          const address = await factory.getPool(firstToken[1].address, lastToken[1].address, fee);

          if (!address || address == "0x0000000000000000000000000000000000000000") {
            console.log(`No pool found for ${firstToken[0]}-${lastToken[0]} with fee ${fee}`);
            continue;
          }

          const pool = await new ethers.Contract(address, JSON.stringify(PancakeswapPoolJson), provider);
          const [token0, liquidity] = await Promise.all([pool.token0(), pool.liquidity()]);

          if ((liquidity as BigNumber).isZero()) {
            console.log(`Pool for ${firstToken[0]}-${lastToken[0]} has zero liquidity`);
            continue;
          }

          if (token0 === firstToken[1]) {
            addresses[chainId].push({
              token0Symbol: firstToken[0],
              token0Address: firstToken[1].address,
              token1Symbol: lastToken[0],
              token1Address: lastToken[1].address,
              poolAddress: address,
              fee,
            });
          } else {
            addresses[chainId].push({
              token0Symbol: lastToken[0],
              token0Address: lastToken[1].address,
              token1Symbol: firstToken[0],
              token1Address: firstToken[1].address,
              poolAddress: address,
              fee,
            });
          }

          console.log(`Found pool for ${firstToken[0]}-${lastToken[0]}: ${address}`);
        } catch (e) {
          console.error("Error fetching Pancakeswap V3 pool address:", e);
        } finally {
          new Promise((resolve) => setTimeout(resolve, 100));
        }
      }
    }
  }

  fs.writeFileSync("./src/lib/pools/pancakeswap-v3-pools.json", JSON.stringify(addresses, null, 2));
})();
