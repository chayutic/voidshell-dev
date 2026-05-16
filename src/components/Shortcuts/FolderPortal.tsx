import { useRef, useState } from "react";
import type { Shortcut } from "../../types";
import ShortcutForm from "./ShortcutForm";
import ContextMenu from "./ContextMenu";

// Imported lazily via forward-declared interface to avoid circular import —
// ShortcutIcon imports FolderPortal and FolderPortal needs ShortcutIcon.
// We use a dynamic import pattern at the call site instead.
import ShortcutIcon from "./ShortcutIcon";

const CELL = 96; // folder sub-grid uses a smaller cell size
const COLS = 5;
const ROWS = 4;

interface Props {
  folder: Shortcut;
  onClose: () => void;
  onUpdateChildren: (children: Shortcut[]) => void;
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function FolderPortal({ folder, onClose, onUpdateChildren }: Props) {
  const [children, setChildren] = useState<Shortcut[]>(folder.children ?? []);
  const [addForm, setAddForm] = useState<{ gridX: number; gridY: number } | null>(null);
  const [cellMenu, setCellMenu] = useState<{ x: number; y: number; gridX: number; gridY: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const updateAndPropagate = (next: Shortcut[]) => {
    setChildren(next);
    onUpdateChildren(next);
  };

  const handleRemove = (id: string) => {
    updateAndPropagate(children.filter((c) => c.id !== id));
  };

  const handleEdit = (updated: Shortcut) => {
    updateAndPropagate(children.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleDuplicate = (shortcut: Shortcut) => {
    // Find a free cell
    const occupied = new Set(children.map((c) => `${c.gridX},${c.gridY}`));
    let freeX = 0, freeY = 0, found = false;
    outer: for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        if (!occupied.has(`${col},${row}`)) { freeX = col; freeY = row; found = true; break outer; }
      }
    }
    if (!found) return;
    updateAndPropagate([...children, { ...shortcut, id: generateId(), gridX: freeX, gridY: freeY }]);
  };

  const handleDrop = (id: string, pixelX: number, pixelY: number) => {
    const cellX = Math.min(Math.max(Math.round(pixelX / CELL), 0), COLS - 1);
    const cellY = Math.min(Math.max(Math.round(pixelY / CELL), 0), ROWS - 1);
    updateAndPropagate(children.map((c) => (c.id === id ? { ...c, gridX: cellX, gridY: cellY } : c)));
  };

  const handleUpdateNestedChildren = (folderId: string, nested: Shortcut[]) => {
    updateAndPropagate(
      children.map((c) => (c.id === folderId ? { ...c, children: nested } : c))
    );
  };

  const handleCellContextMenu = (e: React.MouseEvent, gridX: number, gridY: number) => {
    e.preventDefault();
    const occupied = children.some((c) => c.gridX === gridX && c.gridY === gridY);
    if (!occupied) setCellMenu({ x: e.clientX, y: e.clientY, gridX, gridY });
  };

  const handleSaveNew = (shortcut: Shortcut) => {
    updateAndPropagate([...children, shortcut]);
    setAddForm(null);
  };

  const width = COLS * CELL;
  const height = ROWS * CELL;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        zIndex: 5000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "rgba(14,14,22,0.97)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 14,
          padding: 16,
          boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <span style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>
            📁 {folder.name}
          </span>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.4)",
              cursor: "pointer",
              fontSize: 18,
              lineHeight: 1,
              padding: "0 4px",
            }}
          >
            ×
          </button>
        </div>

        {/* Sub-grid */}
        <div
          ref={containerRef}
          style={{
            position: "relative",
            width,
            height,
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)
            `,
            backgroundSize: `${CELL}px ${CELL}px`,
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          {/* Invisible hit-areas for empty cells */}
          {Array.from({ length: ROWS }, (_, row) =>
            Array.from({ length: COLS }, (_, col) => (
              <div
                key={`${col}-${row}`}
                onContextMenu={(e) => handleCellContextMenu(e, col, row)}
                style={{
                  position: "absolute",
                  left: col * CELL,
                  top: row * CELL,
                  width: CELL,
                  height: CELL,
                }}
              />
            ))
          )}

          {children.map((child) => {
            const inBounds = child.gridX < COLS && child.gridY < ROWS;
            if (!inBounds) return null;
            return (
              <ShortcutIcon
                key={child.id}
                shortcut={child}
                gridSize={CELL}
                pixelX={child.gridX * CELL}
                pixelY={child.gridY * CELL}
                containerRef={containerRef}
                onDrop={handleDrop}
                onRemove={handleRemove}
                onEdit={handleEdit}
                onDuplicate={handleDuplicate}
                onUpdateChildren={handleUpdateNestedChildren}
              />
            );
          })}
        </div>

        <button
          onClick={() => setAddForm({ gridX: 0, gridY: 0 })}
          style={{
            marginTop: 12,
            display: "block",
            width: "100%",
            background: "rgba(255,255,255,0.05)",
            border: "1px dashed rgba(255,255,255,0.15)",
            borderRadius: 7,
            color: "rgba(255,255,255,0.5)",
            padding: "7px 0",
            cursor: "pointer",
            fontSize: 12,
          }}
        >
          + Add Shortcut
        </button>
      </div>

      {cellMenu && (
        <ContextMenu
          x={cellMenu.x}
          y={cellMenu.y}
          items={[
            {
              label: "Add Shortcut Here",
              onClick: () => { setAddForm({ gridX: cellMenu.gridX, gridY: cellMenu.gridY }); },
            },
          ]}
          onClose={() => setCellMenu(null)}
        />
      )}

      {addForm && (
        <ShortcutForm
          gridX={addForm.gridX}
          gridY={addForm.gridY}
          onSave={handleSaveNew}
          onCancel={() => setAddForm(null)}
        />
      )}
    </div>
  );
}
