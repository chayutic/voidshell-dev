import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Layout } from "../../types";
import ShortcutIcon from "../Shortcuts/ShortcutIcon";

export default function Grid() {
  const [layout, setLayout] = useState<Layout | null>(null);

  useEffect(() => {
    invoke<Layout>("load_layout").then(setLayout);
  }, []);

  if (!layout) return null;

  const { gridCols, gridRows, shortcuts } = layout;

  return (
    <div
      className="grid-canvas"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
        gridTemplateRows: `repeat(${gridRows}, 1fr)`,
        width: "100%",
        height: "100%",
        position: "absolute",
        inset: 0,
      }}
    >
      {shortcuts.map((shortcut) => (
        <ShortcutIcon
          key={shortcut.id}
          shortcut={shortcut}
          style={{
            gridColumn: shortcut.gridX + 1,
            gridRow: shortcut.gridY + 1,
          }}
        />
      ))}
    </div>
  );
}
