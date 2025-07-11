import type { ReactNode } from "react";

interface InfoBoxProps {
  title: string;
  className?: string;
  children: ReactNode;
}

export const InfoBox = ({ title, className, children }: InfoBoxProps) => {
  return (
    <div className="border border-blue-200 bg-blue-50 rounded-md p-2">
      <div className="text-sm font-semibold text-gray-800 mb-1">{title}</div>
      <div className={className}>{children}</div>
    </div>
  );
};
