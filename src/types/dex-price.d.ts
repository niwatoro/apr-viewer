export type DexPrice = {
  dex: string;
  poolAddress: string;
  chainId: number;
  baseSymbol: string;
  quoteSymbol: string;
  baseToken: string;
  quoteToken: string;
  price: number;
  fee: number;
  tradableAmountBaseToken: number;
  tradableAmountQuoteToken: number;
};
