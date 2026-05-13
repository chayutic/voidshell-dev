// Mirrors the Rust structs in shortcuts.rs (camelCase via serde rename).

export type ShortcutType = "Standard" | "Folder";

export type AlternateActionType = "Exec" | "Url" | "System";

export interface AlternateAction {
  label: string;
  command: string;
  actionType: AlternateActionType;
}

export interface Shortcut {
  id: string;
  name: string;
  path: string;
  iconUrl?: string;
  gridX: number;
  gridY: number;
  shortcutType: ShortcutType;
  alternateActions: AlternateAction[];
  children?: Shortcut[];
}

export interface Layout {
  version: number;
  gridCols: number;
  gridRows: number;
  shortcuts: Shortcut[];
}
