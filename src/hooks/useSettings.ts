import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

export interface AppSettings {
  gridSize: number;
  taskbarOverlap: boolean;
  searchEngine: string;
  wallpapers: Record<number, string>;
}

const DEFAULTS: AppSettings = {
  gridSize: 128,
  taskbarOverlap: false,
  searchEngine: "https://google.com/search?q=",
  wallpapers: {},
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS);

  useEffect(() => {
    invoke<AppSettings>("get_settings")
      .then((s) => setSettings({ ...DEFAULTS, ...s }))
      .catch(() => {});
  }, []);

  async function setSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    await invoke("set_setting", { key, value });
    setSettings((prev) => ({ ...prev, [key]: value }));
    if (key === "taskbarOverlap") {
      await invoke("apply_window_bounds", { taskbarOverlap: value });
    }
  }

  async function setWallpaper(monitorId: number, path: string) {
    await invoke("set_wallpaper", { monitorId, imagePath: path });
    setSettings((prev) => ({
      ...prev,
      wallpapers: { ...prev.wallpapers, [monitorId]: path },
    }));
  }

  return { ...settings, setSetting, setWallpaper };
}
