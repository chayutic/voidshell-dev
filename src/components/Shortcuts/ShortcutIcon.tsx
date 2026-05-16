import { memo, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Shortcut } from "../../types";
import NinjaMenu from "./NinjaMenu";
import ContextMenu from "./ContextMenu";
import type { ContextMenuItem } from "./ContextMenu";
import ShortcutForm from "./ShortcutForm";
import FolderPortal from "./FolderPortal";

interface Props {
  shortcut: Shortcut;
  gridSize: number;
  pixelX: number;
  pixelY: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onDrop: (id: string, x: number, y: number) => void;
  onRemove: (id: string) => void;
  onEdit: (updated: Shortcut) => void;
  onDuplicate: (shortcut: Shortcut) => void;
  /** Called when a folder's children are modified from within the portal */
  onUpdateChildren?: (folderId: string, children: Shortcut[]) => void;
}

function ShortcutIcon({
  shortcut,
  gridSize,
  pixelX,
  pixelY,
  containerRef,
  onDrop,
  onRemove,
  onEdit,
  onDuplicate,
  onUpdateChildren,
}: Props) {
  const [ninjaOpen, setNinjaOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [folderOpen, setFolderOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const handleClick = () => {
    if (shortcut.shortcutType === "Folder") {
      setFolderOpen(true);
      return;
    }
    invoke("launch_application", { path: shortcut.path });
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const contextItems: ContextMenuItem[] = [
    ...(shortcut.shortcutType === "Folder"
      ? [{ label: "Open Folder", onClick: () => setFolderOpen(true) }]
      : []),
    { label: "Edit", onClick: () => setEditOpen(true) },
    { label: "Duplicate", onClick: () => onDuplicate(shortcut) },
    ...(shortcut.alternateActions.length > 0
      ? [{ label: "Ninja Actions", onClick: () => setNinjaOpen(true), separator: false }]
      : []),
    { label: "", onClick: () => {}, separator: true } as ContextMenuItem,
    { label: "Remove", onClick: () => onRemove(shortcut.id), danger: true },
  ];

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    setDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    const ghost = document.createElement("div");
    ghost.style.width = "1px";
    ghost.style.height = "1px";
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    requestAnimationFrame(() => document.body.removeChild(ghost));

    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", shortcut.id);
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    setDragging(false);
    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const rawX = e.clientX - containerRect.left - dragOffset.current.x;
    const rawY = e.clientY - containerRect.top - dragOffset.current.y;
    const maxX = containerRect.width - gridSize;
    const maxY = containerRect.height - gridSize;
    const clampedX = Math.max(0, Math.min(rawX, maxX));
    const clampedY = Math.max(0, Math.min(rawY, maxY));

    onDrop(shortcut.id, clampedX, clampedY);
  };

  return (
    <>
      <div
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        className="shortcut-icon"
        style={{
          position: "absolute",
          left: pixelX,
          top: pixelY,
          width: gridSize,
          height: gridSize,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          cursor: dragging ? "grabbing" : "grab",
          opacity: dragging ? 0.4 : 1,
          zIndex: dragging ? 1000 : "auto",
          userSelect: "none",
          transition: dragging ? "none" : "opacity 0.15s",
        }}
      >
        {shortcut.shortcutType === "Folder" ? (
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 10,
              background: "rgba(120,100,255,0.3)",
              border: "1px solid rgba(120,100,255,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
            }}
          >
            📁
          </div>
        ) : shortcut.iconUrl ? (
          <img
            src={shortcut.iconUrl}
            alt={shortcut.name}
            draggable={false}
            style={{ width: 48, height: 48, objectFit: "contain" }}
          />
        ) : (
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 8,
              background: "rgba(255,255,255,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
            }}
          >
            {shortcut.name.charAt(0).toUpperCase()}
          </div>
        )}
        <span
          style={{
            marginTop: 6,
            fontSize: 11,
            color: "rgba(255,255,255,0.85)",
            textAlign: "center",
            maxWidth: gridSize - 12,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            textShadow: "0 1px 3px rgba(0,0,0,0.8)",
          }}
        >
          {shortcut.name}
        </span>

        {ninjaOpen && (
          <NinjaMenu actions={shortcut.alternateActions} onClose={() => setNinjaOpen(false)} />
        )}
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextItems}
          onClose={() => setContextMenu(null)}
        />
      )}

      {editOpen && (
        <ShortcutForm
          initial={shortcut}
          gridX={shortcut.gridX}
          gridY={shortcut.gridY}
          onSave={(updated) => { onEdit(updated); setEditOpen(false); }}
          onCancel={() => setEditOpen(false)}
        />
      )}

      {folderOpen && shortcut.shortcutType === "Folder" && (
        <FolderPortal
          folder={shortcut}
          onClose={() => setFolderOpen(false)}
          onUpdateChildren={(children) => {
            onUpdateChildren?.(shortcut.id, children);
          }}
        />
      )}
    </>
  );
}

export default memo(ShortcutIcon);
