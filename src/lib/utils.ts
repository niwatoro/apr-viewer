import { normalize, valueToZDBigNumber } from "@aave/protocol-js";
import { clsx, type ClassValue } from "clsx";
import { BigNumber } from "ethers";
import "reflect-metadata";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(1) + "B";
  } else if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + "M";
  } else if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + "K";
  } else if (num >= 100) {
    return num.toFixed(0);
  } else {
    return num.toPrecision(2);
  }
}

export const groupBy = <T, K extends keyof T>(array: T[], key: K): Record<string, T[]> => {
  return array.reduce((acc, obj) => {
    const property = String(obj[key]);
    acc[property] = acc[property] || [];
    acc[property].push(obj);
    return acc;
  }, {} as Record<string, T[]>);
};

export const parseBigNumberWithDecimals = (value: BigNumber, decimals: number): number => {
  return Number.parseFloat(normalize(valueToZDBigNumber(value.toString()), decimals));
};
