"use client";

import { ExternalLink } from "@/components/external-link";
import { Header } from "@/components/header";
import { MyTable } from "@/components/my-table";
import { TableCell } from "@/components/ui/table";
import { getExplorerContractUrl, getExplorerTokenUrl } from "@/lib/explorer";
import { formatNumber } from "@/lib/utils";
import type { InterestRate } from "@/types/interest-rate";
import { BadgeCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const [interestRates, setInterestRates] = useState<InterestRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    async function fetchInterestRates() {
      try {
        const response = await fetch("/api/interest-rates");
        if (!response.ok) {
          throw new Error("Failed to fetch interest rates");
        }
        const data = await response.json();
        setInterestRates(data);
      } catch (err) {
        setError(`Error fetching interest rates: ${err}`);
      } finally {
        setIsLoading(false);
      }
    }

    fetchInterestRates();
  }, []);

  return (
    <>
      <Header>Stablecoin Yields</Header>
      <MyTable
        isLoading={isLoading}
        error={error}
        headers={[
          {
            sortColumn: "symbol",
            title: "Symbol",
          },
          {
            sortColumn: "platform",
            title: "Platform",
          },
          {
            sortColumn: "chainName",
            title: "Chain",
          },
          {
            sortColumn: "tvl",
            title: "TVL ($)",
          },
          {
            sortColumn: "apy",
            title: "APY (%)",
          },
        ]}
        data={interestRates}
        initialSortColumn={"apy"}
        displayRow={(rate) => (
          <>
            <TableCell className={"flex items-center gap-1"}>
              <ExternalLink href={getExplorerTokenUrl(rate.chainId, rate.tokenAddress)!}>
                <span>{rate.symbol}</span>
              </ExternalLink>
              {rate.verified && <BadgeCheck className={"w-3 h-3 text-blue-400 black:text-blue-600"} />}
            </TableCell>
            <TableCell>
              <ExternalLink href={!!rate.contractAddress ? getExplorerContractUrl(rate.chainId, rate.contractAddress)! : undefined}>{rate.platform}</ExternalLink>
            </TableCell>
            <TableCell>{rate.chainName}</TableCell>
            <TableCell className={"text-right"}>{formatNumber(rate.tvl)}</TableCell>
            <TableCell className={"text-right"}>{(rate.apy || 0).toFixed(2)}%</TableCell>
          </>
        )}
      />
    </>
  );
}
