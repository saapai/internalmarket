import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export default function Card({
  className = "",
  hover = false,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={`bg-white rounded-xl border border-black/5 shadow-sm ${
        hover ? "hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
