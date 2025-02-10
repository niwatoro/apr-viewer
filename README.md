# DeFi Interest Rate Viewer

A modern web application built with Next.js that aggregates and displays real-time interest rates from major DeFi protocols across multiple blockchain networks.

## Features

- Real-time interest rate data from multiple DeFi protocols:
  - Aave
  - Compound
  - Sky
  - Yearn Finance
- Support for multiple blockchain networks:
  - Ethereum
  - Optimism
  - BNB Chain
  - Gnosis
  - Polygon
  - Fantom
  - Mantle
  - Base
  - Avalanche
  - Arbitrum
  - Scroll
- Interactive table with sorting capabilities
- Focus on stablecoin yields for better comparison
- TVL (Total Value Locked) tracking
- Clean and responsive UI built with Tailwind CSS

## Technologies

- [Next.js 14](https://nextjs.org/) - React framework for production
- [TypeScript](https://www.typescriptlang.org/) - Type safety and better developer experience
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - Re-usable components
- [ethers.js](https://docs.ethers.org/) - Ethereum library for blockchain interaction
- [Aave Protocol JS](https://github.com/aave/aave-js) - Utilities for Aave protocol calculations

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- pnpm (recommended) or npm

### Installation

1. Clone the repository:

```bash
git clone https://github.com/niwatoro/apr-viewer.git
cd apr-viewer
```

2. Install dependencies:

```bash
pnpm install
```

3. Run the development server:

```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## API Reference

### GET /api/interest-rates

Returns an array of interest rates from various DeFi protocols.

#### Response Format

```typescript
interface InterestRate {
  platform: string;      // DeFi platform name (e.g., "Aave", "Compound")
  symbol: string;        // Token symbol (e.g., "USDC", "DAI")
  rewardSymbol: string;  // Reward token symbol
  chainName: string;     // Blockchain network name
  tokenAddress: string;  // Token contract address
  tvl: number;          // Total Value Locked in USD
  apy: number;          // Annual Percentage Yield
}
```

## Development

The project uses Next.js App Router and follows the latest React best practices:

- `src/app/page.tsx` - Main page component with the interest rate table
- `src/app/api/interest-rates/route.ts` - API route for fetching interest rates
- `src/types/` - TypeScript type definitions
- `src/components/` - Reusable UI components
- `src/lib/` - Utility functions

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE.txt](LICENSE.txt) file for details.
