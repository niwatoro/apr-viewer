"use client";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getExplorerContractUrl, getExplorerTokenUrl } from "@/lib/explorer";
import { formatNumber } from "@/lib/utils";
import { ArrowUpDown } from "lucide-react";
import { useEffect, useState } from "react";
import type { InterestRate } from "../types/interest-rate";

export default function Home() {
  const [interestRates, setInterestRates] = useState<InterestRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<keyof InterestRate>("apy");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  useEffect(() => {
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

  const sortedRates = [...interestRates].sort((a, b) => {
    if (a[sortColumn] < b[sortColumn]) return sortDirection === "asc" ? -1 : 1;
    if (a[sortColumn] > b[sortColumn]) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (column: keyof InterestRate) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">DeFi Interest Rates</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Button variant="ghost" onClick={() => handleSort("symbol")}>
                Symbol <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" onClick={() => handleSort("platform")}>
                Platform <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" onClick={() => handleSort("tvl")}>
                TVL ($) <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" onClick={() => handleSort("apy")}>
                APY (%) <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" onClick={() => handleSort("chainName")}>
                Chain <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={5}>Loading...</TableCell>
            </TableRow>
          ) : error ? (
            <TableRow>
              <TableCell colSpan={5}>{error}</TableCell>
            </TableRow>
          ) : (
            sortedRates.map((rate, index) => (
              <TableRow key={index}>
                <TableCell>
                  <a href={getExplorerTokenUrl(rate.chainId, rate.tokenAddress)!} target={"_blank"} className={"hover:underline cursor-pointer text-blue-600"}>
                    {rate.symbol}
                  </a>
                </TableCell>
                <TableCell>{rate.platform}</TableCell>
                <TableCell className={"text-right"}>{formatNumber(rate.tvl)}</TableCell>
                <TableCell className={"text-right"}>{(rate.apy || 0).toFixed(2)}%</TableCell>
                <TableCell>
                  <a href={!!rate.contractAddress ? getExplorerContractUrl(rate.chainId, rate.contractAddress)! : undefined} target={"_blank"} className={!!rate.contractAddress ? "hover:underline cursor-pointer text-blue-600" : undefined}>
                    {rate.chainName}
                  </a>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
