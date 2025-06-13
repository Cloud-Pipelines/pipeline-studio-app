import type { PropsWithChildren } from "react";

const KeyboardKey = ({ children }: PropsWithChildren) => {
  return (
    <div
      className="
        px-2 py-1 
        bg-white/70 
        border border-gray-300/60 
        rounded-md 
        shadow-md 
        backdrop-blur-sm
        text-gray-700/80
        text-xs 
        font-medium 
        select-none
      "
      style={{
        background:
          "linear-gradient(145deg, rgba(255,255,255,0.8), rgba(245,245,245,0.7))",
        boxShadow:
          "0 2px 4px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.5)",
        border: "1px solid rgba(200,200,200,0.4)",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {children}
    </div>
  );
};

export default KeyboardKey;
