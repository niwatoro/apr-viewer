import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  href?: string;
};
export const ExternalLink = ({ children, href }: Props) => {
  return (
    <a href={href} target={"_blank"} className={href ? "hover:underline cursor-pointer text-blue-600 dark:text-blue-400" : undefined}>
      {children}
    </a>
  );
};
