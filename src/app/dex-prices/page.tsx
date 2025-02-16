"use client";

import { ExternalLink } from "@/components/external-link";
import { Header } from "@/components/header";
import { MyTable } from "@/components/my-table";
import { TableCell } from "@/components/ui/table";
import { CHAINS } from "@/lib/constants";
import { getExplorerContractUrl, getExplorerTokenUrl } from "@/lib/explorer";
import type { DexPrice } from "@/types/dex-price";
import { useEffect, useState } from "react";

export default function Home() {
  const [dexPrices, setDexPrices] = useState<DexPrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDexPrices() {
      try {
        const response = await fetch("/api/dex-prices");
        if (!response.ok) {
          throw new Error("Failed to fetch dex prices");
        }
        const data = await response.json();
        setDexPrices(data);
      } catch (err) {
        setError(`Error fetching dex prices: ${err}`);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDexPrices();
  }, []);

  return (
    <>
      <Header>DEX Prices</Header>
      <MyTable
        isLoading={isLoading}
        error={error}
        headers={[
          {
            sortColumn: "pair",
            title: "Pair",
          },
          {
            sortColumn: "dex",
            title: "DEX",
          },
          {
            sortColumn: "chain",
            title: "Chain",
          },
          {
            sortColumn: "price",
            title: "Price ($)",
          },
          {
            sortColumn: "fee",
            title: "Fee (1/100 bp)",
          },
        ]}
        data={dexPrices.map((price) => ({
          ...price,
          chain: CHAINS[price.chainId],
          pair: `${price.baseSymbol}/${price.quoteSymbol}`,
        }))}
        initialSortColumn={"pair"}
        initialSortDirection={"asc"}
        displayRow={(price: DexPrice) => (
          <>
            <TableCell>
              <ExternalLink href={getExplorerTokenUrl(price.chainId, price.baseToken)}>{price.baseSymbol}</ExternalLink>/<ExternalLink href={getExplorerTokenUrl(price.chainId, price.quoteToken)}>{price.quoteSymbol}</ExternalLink>
            </TableCell>
            <TableCell className={"flex items-center gap-1"}>
              <ExternalLink href={getExplorerContractUrl(price.chainId, price.poolAddress)}>{price.dex}</ExternalLink>
            </TableCell>
            <TableCell>{CHAINS[price.chainId]}</TableCell>
            <TableCell className={"text-right"}>{price.price.toPrecision(4)}</TableCell>
            <TableCell className={"text-right"}>{price.fee}</TableCell>
          </>
        )}
      />
    </>
  );
}
