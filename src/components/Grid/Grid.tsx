import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Layout, Shortcut } from "../../types";
import { useSettings } from "../../hooks/useSettings";
import ShortcutIcon from "../Shortcuts/ShortcutIcon";
import ContextMenu from "../Shortcuts/ContextMenu";
import ShortcutForm from "../Shortcuts/ShortcutForm";

function snapToCell(x: number, y: number, gridSize: number) {
  return {
    x: Math.round(x / gridSize) * gridSize,
    y: Math.round(y / gridSize) * gridSize,
  };
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function Grid() {
  const { gridSize } = useSettings();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [layout, setLayout] = useState<Layout | null>(null);
  const [cellMenu, setCellMenu] = useState<{ x: number; y: number; gridX: number; gridY: number } | null>(null);
  const [addForm, setAddForm] = useState<{ gridX: number; gridY: number } | null>(null);

  useEffect(() => {
    invoke<Layout>("load_layout").then(setLayout);
  }, []);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setContainerSize({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const persist = (updated: Layout) => {
    setLayout(updated);
    invoke("save_layout", { layout: updated }).catch(console.error);
  };

  const gridCols = Math.max(1, Math.floor(containerSize.width / gridSize));
  const gridRows = Math.max(1, Math.floor(containerSize.height / gridSize));

  const handleDrop = (shortcutId: string, pixelX: number, pixelY: number) => {
    if (!layout) return;
    const snapped = snapToCell(pixelX, pixelY, gridSize);
    const cellX = Math.min(Math.max(Math.round(snapped.x / gridSize), 0), gridCols - 1);
    const cellY = Math.min(Math.max(Math.round(snapped.y / gridSize), 0), gridRows - 1);
    persist({
      ...layout,
      gridCols,
      gridRows,
      shortcuts: layout.shortcuts.map((s) =>
        s.id === shortcutId ? { ...s, gridX: cellX, gridY: cellY } : s
      ),
    });
  };

  const handleRemove = (id: string) => {
    if (!layout) return;
    persist({ ...layout, shortcuts: layout.shortcuts.filter((s) => s.id !== id) });
  };

  const handleEdit = (updated: Shortcut) => {
    if (!layout) return;
    persist({ ...layout, shortcuts: layout.shortcuts.map((s) => (s.id === updated.id ? updated : s)) });
  };

  const handleDuplicate = (shortcut: Shortcut) => {
    if (!layout) return;
    const occupied = new Set(layout.shortcuts.map((s) => `${s.gridX},${s.gridY}`));
    let freeX = 0, freeY = 0, found = false;
    outer: for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        if (!occupied.has(`${col},${row}`)) { freeX = col; freeY = row; found = true; break outer; }
      }
    }
    if (!found) return;
    persist({
      ...layout,
      shortcuts: [...layout.shortcuts, { ...shortcut, id: generateId(), gridX: freeX, gridY: freeY }],
    });
  };

  const handleUpdateChildren = (folderId: string, children: Shortcut[]) => {
    if (!layout) return;
    persist({
      ...layout,
      shortcuts: layout.shortcuts.map((s) => (s.id === folderId ? { ...s, children } : s)),
    });
  };

  const handleGridContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !layout) return;
    // Only fire on the grid background, not on shortcut icons
    if ((e.target as HTMLElement).closest(".shortcut-icon")) return;
    e.preventDefault();

    const rect = containerRef.current.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    const gridX = Math.min(Math.floor(rawX / gridSize), gridCols - 1);
    const gridY = Math.min(Math.floor(rawY / gridSize), gridRows - 1);

    const occupied = layout.shortcuts.some((s) => s.gridX === gridX && s.gridY === gridY);
    if (!occupied) setCellMenu({ x: e.clientX, y: e.clientY, gridX, gridY });
  };

  const handleAddSave = (shortcut: Shortcut) => {
    if (!layout) return;
    persist({ ...layout, shortcuts: [...layout.shortcuts, shortcut] });
    setAddForm(null);
  };

  if (!layout) return null;

  return (
    <>
      <div
        ref={containerRef}
        className="grid-canvas"
        onContextMenu={handleGridContextMenu}
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)
          `,
          backgroundSize: `${gridSize}px ${gridSize}px`,
        }}
      >
        {layout.shortcuts.map((shortcut) => {
          const pixelX = shortcut.gridX * gridSize;
          const pixelY = shortcut.gridY * gridSize;
          const inBounds = shortcut.gridX < gridCols && shortcut.gridY < gridRows;
          if (!inBounds) return null;

          return (
            <ShortcutIcon
              key={shortcut.id}
              shortcut={shortcut}
              gridSize={gridSize}
              pixelX={pixelX}
              pixelY={pixelY}
              containerRef={containerRef}
              onDrop={handleDrop}
              onRemove={handleRemove}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
              onUpdateChildren={handleUpdateChildren}
            />
          );
        })}
      </div>

      {cellMenu && (
        <ContextMenu
          x={cellMenu.x}
          y={cellMenu.y}
          items={[
            { label: "Add Shortcut", onClick: () => setAddForm({ gridX: cellMenu.gridX, gridY: cellMenu.gridY }) },
            { label: "Add Folder", onClick: () => {
              if (!layout) return;
              persist({
                ...layout,
                shortcuts: [...layout.shortcuts, {
                  id: generateId(),
                  name: "New Folder",
                  path: "",
                  gridX: cellMenu.gridX,
                  gridY: cellMenu.gridY,
                  shortcutType: "Folder",
                  alternateActions: [],
                  children: [],
                }],
              });
            }},
          ]}
          onClose={() => setCellMenu(null)}
        />
      )}

      {addForm && (
        <ShortcutForm
          gridX={addForm.gridX}
          gridY={addForm.gridY}
          onSave={handleAddSave}
          onCancel={() => setAddForm(null)}
        />
      )}
    </>
  );
}
