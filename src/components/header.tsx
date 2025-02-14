import { ReactNode } from "react";

type Props = {
  children: ReactNode;
};
export const Header = ({ children }: Props) => {
  return <h1 className="text-3xl font-bold mb-6">{children}</h1>;
};
