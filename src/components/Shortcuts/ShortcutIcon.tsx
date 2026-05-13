import { useState, CSSProperties } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Shortcut } from "../../types";
import NinjaMenu from "./NinjaMenu";

interface Props {
  shortcut: Shortcut;
  style?: CSSProperties;
}

export default function ShortcutIcon({ shortcut, style }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleClick = () => {
    invoke("launch_application", { path: shortcut.path });
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (shortcut.alternateActions.length > 0) setMenuOpen(true);
  };

  return (
    <div
      style={style}
      className="shortcut-icon"
      onClick={handleClick}
      onContextMenu={handleContextMenu}
    >
      {shortcut.iconUrl && (
        <img src={shortcut.iconUrl} alt={shortcut.name} draggable={false} />
      )}
      <span>{shortcut.name}</span>

      {menuOpen && (
        <NinjaMenu
          actions={shortcut.alternateActions}
          onClose={() => setMenuOpen(false)}
        />
      )}
    </div>
  );
}
