import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpDown } from "lucide-react";
import { ReactNode, useState } from "react";

type Props = {
  isLoading: boolean;
  error: string | null;
  headers: {
    sortColumn: any;
    title: string;
  }[];
  data: any[];
  initialSortColumn: any;
  displayRow: (row: any) => ReactNode;
};
export const MyTable = ({ isLoading, error, headers, data, initialSortColumn, displayRow }: Props) => {
  const [sortColumn, setSortColumn] = useState<keyof typeof data>(initialSortColumn);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const sortedData = [...data].sort((a, b) => {
    if (!a[sortColumn]) return 1;
    if (!b[sortColumn]) return -1;
    if (a[sortColumn] < b[sortColumn]) return sortDirection === "asc" ? -1 : 1;
    if (a[sortColumn] > b[sortColumn]) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (column: keyof typeof data) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow key={"header"}>
          {headers.map((header) => (
            <TableHead key={header.title}>
              <Button variant="ghost" onClick={() => handleSort(header.sortColumn)}>
                {header.title} <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell colSpan={headers.length}>Loading...</TableCell>
          </TableRow>
        ) : error ? (
          <TableRow>
            <TableCell colSpan={headers.length}>{error}</TableCell>
          </TableRow>
        ) : (
          sortedData.map((row, index) => <TableRow key={index}>{displayRow(row)}</TableRow>)
        )}
      </TableBody>
    </Table>
  );
};
