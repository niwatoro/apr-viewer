"use client";

import { Header } from "@/components/header";
import { MyTable } from "@/components/my-table";
import { TableCell } from "@/components/ui/table";
import { formatNumber } from "@/lib/utils";
import { type ArbitragePath } from "@/types/arbitrage-path";
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const [arbitragePaths, setArbitragePaths] = useState<ArbitragePath[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    async function fetchArbitragePaths() {
      try {
        const response = await fetch("/api/arbitrage-paths");
        if (!response.ok) {
          throw new Error("Failed to fetch arbitrage paths");
        }
        const data = await response.json();
        setArbitragePaths(data);
      } catch (err) {
        setError(`Error fetching arbitrage paths: ${err}`);
      } finally {
        setIsLoading(false);
      }
    }

    fetchArbitragePaths();
  }, []);

  return (
    <>
      <Header>Arbitrage Path</Header>
      <MyTable
        isLoading={isLoading}
        error={error}
        headers={[
          { sortColumn: "type", title: "Type" },
          { sortColumn: "profit", title: "Profit ($0)" },
          { sortColumn: "path", title: "Path" },
        ]}
        data={arbitragePaths}
        initialSortColumn={"profit"}
        displayRow={(row) => {
          return (
            <>
              <TableCell>{row.type}</TableCell>
              <TableCell className={"text-right"}>{formatNumber(row.profit)}</TableCell>
              <TableCell>{row.path}</TableCell>
            </>
          );
        }}
      />
    </>
  );
}
