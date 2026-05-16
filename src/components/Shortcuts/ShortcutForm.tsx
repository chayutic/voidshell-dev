import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { pickFile, pickImageFile } from "../../hooks/useFileDialog";
import type { Shortcut, ShortcutType, AlternateAction } from "../../types";

interface Props {
  initial?: Partial<Shortcut>;
  gridX: number;
  gridY: number;
  onSave: (shortcut: Shortcut) => void;
  onCancel: () => void;
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function ShortcutForm({ initial, gridX, gridY, onSave, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [path, setPath] = useState(initial?.path ?? "");
  const [iconUrl, setIconUrl] = useState(initial?.iconUrl ?? "");
  const [shortcutType, setShortcutType] = useState<ShortcutType>(initial?.shortcutType ?? "Standard");
  const [actions, setActions] = useState<AlternateAction[]>(initial?.alternateActions ?? []);
  const [pathError, setPathError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleBrowsePath = async () => {
    const picked = await pickFile();
    if (picked) { setPath(picked); setPathError(""); }
  };

  const handleBrowseIcon = async () => {
    const picked = await pickImageFile();
    if (picked) setIconUrl(picked);
  };

  const addAction = () => {
    setActions((prev) => [...prev, { label: "", command: "", actionType: "Exec" }]);
  };

  const updateAction = (i: number, field: keyof AlternateAction, value: string) => {
    setActions((prev) => prev.map((a, idx) => idx === i ? { ...a, [field]: value } : a));
  };

  const removeAction = (i: number) => {
    setActions((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    if (shortcutType === "Standard" && path.trim()) {
      const valid: boolean = await invoke("validate_path", { path: path.trim() });
      if (!valid) { setPathError("Path not found on disk."); return; }
    }
    setSaving(true);
    const shortcut: Shortcut = {
      id: initial?.id ?? generateId(),
      name: name.trim(),
      path: path.trim(),
      iconUrl: iconUrl || undefined,
      gridX,
      gridY,
      shortcutType,
      alternateActions: actions.filter((a) => a.label && a.command),
      children: initial?.children ?? (shortcutType === "Folder" ? [] : undefined),
    };
    onSave(shortcut);
    setSaving(false);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 6,
    color: "rgba(255,255,255,0.9)",
    padding: "7px 10px",
    fontSize: 13,
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
    marginBottom: 4,
    marginTop: 12,
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: "rgba(18,18,26,0.98)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 12,
          padding: 24,
          width: 420,
          maxHeight: "80vh",
          overflowY: "auto",
          boxShadow: "0 16px 48px rgba(0,0,0,0.8)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: "0 0 4px", fontSize: 16, color: "#fff" }}>
          {initial?.id ? "Edit Shortcut" : "Add Shortcut"}
        </h3>

        <label style={labelStyle}>Type</label>
        <select
          value={shortcutType}
          onChange={(e) => setShortcutType(e.target.value as ShortcutType)}
          style={{ ...inputStyle, cursor: "pointer" }}
        >
          <option value="Standard">Standard</option>
          <option value="Folder">Folder</option>
        </select>

        <label style={labelStyle}>Name *</label>
        <input
          style={inputStyle}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My App"
          autoFocus
        />

        {shortcutType === "Standard" && (
          <>
            <label style={labelStyle}>Path / URL</label>
            <div style={{ display: "flex", gap: 6 }}>
              <input
                style={{ ...inputStyle, flex: 1 }}
                value={path}
                onChange={(e) => { setPath(e.target.value); setPathError(""); }}
                placeholder="C:\Program Files\..."
              />
              <button
                onClick={handleBrowsePath}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 6,
                  color: "#fff",
                  padding: "0 12px",
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                Browse
              </button>
            </div>
            {pathError && (
              <span style={{ fontSize: 11, color: "#ff5f5f" }}>{pathError}</span>
            )}
          </>
        )}

        <label style={labelStyle}>Icon (optional)</label>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {iconUrl && (
            <img src={iconUrl} alt="" style={{ width: 32, height: 32, objectFit: "contain", borderRadius: 4 }} />
          )}
          <button
            onClick={handleBrowseIcon}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 6,
              color: "rgba(255,255,255,0.7)",
              padding: "6px 12px",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            {iconUrl ? "Change Icon" : "Pick Icon"}
          </button>
          {iconUrl && (
            <button
              onClick={() => setIconUrl("")}
              style={{
                background: "none",
                border: "none",
                color: "rgba(255,255,255,0.4)",
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              Clear
            </button>
          )}
        </div>

        {shortcutType === "Standard" && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Ninja Actions</span>
              <button
                onClick={addAction}
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 5,
                  color: "#fff",
                  padding: "3px 10px",
                  cursor: "pointer",
                  fontSize: 11,
                }}
              >
                + Add
              </button>
            </div>
            {actions.map((action, i) => (
              <div key={i} style={{ display: "flex", gap: 6, marginTop: 8, alignItems: "flex-start" }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                  <input
                    style={{ ...inputStyle, fontSize: 12 }}
                    value={action.label}
                    onChange={(e) => updateAction(i, "label", e.target.value)}
                    placeholder="Label"
                  />
                  <input
                    style={{ ...inputStyle, fontSize: 12 }}
                    value={action.command}
                    onChange={(e) => updateAction(i, "command", e.target.value)}
                    placeholder="Command or URL"
                  />
                  <select
                    style={{ ...inputStyle, fontSize: 12 }}
                    value={action.actionType}
                    onChange={(e) => updateAction(i, "actionType", e.target.value)}
                  >
                    <option value="Exec">Exec</option>
                    <option value="Url">URL</option>
                    <option value="System">System</option>
                  </select>
                </div>
                <button
                  onClick={() => removeAction(i)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#ff5f5f",
                    cursor: "pointer",
                    fontSize: 16,
                    padding: "4px",
                    marginTop: 2,
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 20, justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{
              background: "none",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 7,
              color: "rgba(255,255,255,0.6)",
              padding: "8px 18px",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            style={{
              background: "rgba(120,100,255,0.85)",
              border: "none",
              borderRadius: 7,
              color: "#fff",
              padding: "8px 20px",
              cursor: "pointer",
              fontSize: 13,
              opacity: !name.trim() ? 0.5 : 1,
            }}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
