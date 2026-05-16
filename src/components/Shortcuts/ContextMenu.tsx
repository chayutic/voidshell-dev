import { useEffect, useRef } from "react";

export interface ContextMenuItem {
  label: string;
  onClick: () => void;
  danger?: boolean;
  separator?: boolean;
}

interface Props {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export default function ContextMenu({ x, y, items, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  // Adjust position so menu doesn't overflow viewport
  const menuWidth = 180;
  const adjustedX = x + menuWidth > window.innerWidth ? x - menuWidth : x;

  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        top: y,
        left: adjustedX,
        zIndex: 9999,
        background: "rgba(20,20,28,0.96)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 8,
        boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
        minWidth: menuWidth,
        padding: "4px 0",
        backdropFilter: "blur(12px)",
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((item, i) =>
        item.separator ? (
          <div
            key={i}
            style={{
              height: 1,
              background: "rgba(255,255,255,0.08)",
              margin: "4px 0",
            }}
          />
        ) : (
          <button
            key={item.label}
            onClick={() => { item.onClick(); onClose(); }}
            style={{
              display: "block",
              width: "calc(100% - 8px)",
              padding: "8px 14px",
              background: "none",
              border: "none",
              color: item.danger ? "#ff5f5f" : "rgba(255,255,255,0.88)",
              fontSize: 13,
              textAlign: "left",
              cursor: "pointer",
              borderRadius: 4,
              margin: "0 4px",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "none";
            }}
          >
            {item.label}
          </button>
        )
      )}
    </div>
  );
}
