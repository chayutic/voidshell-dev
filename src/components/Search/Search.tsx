import { useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useOllama } from "../../hooks/useOllama";
import { useSystem } from "../../hooks/useSystem";

const URL_RE = /^https?:\/\//i;
const AI_RE = /^[?/]/;
const SYSTEM_CMDS: Record<string, () => void> = {};

export default function Search() {
  const [value, setValue] = useState("");
  const [visible, setVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { prompt, response, loading } = useOllama();
  const system = useSystem();

  // Register system commands lazily to avoid circular deps
  SYSTEM_CMDS["sleep"] = system.systemStandby;
  SYSTEM_CMDS["off"] = system.shutdownSystem;
  SYSTEM_CMDS["restart"] = system.restartSystem;

  const handleSubmit = async () => {
    const raw = value.trim();
    if (!raw) return;

    if (URL_RE.test(raw)) {
      invoke("plugin:shell|open", { path: raw });
    } else if (AI_RE.test(raw)) {
      await prompt(raw.slice(1).trim());
    } else if (raw in SYSTEM_CMDS) {
      SYSTEM_CMDS[raw]?.();
    } else {
      // Treat as shortcut name search — Phase 2 will wire this up
      console.log("search:", raw);
    }

    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
    if (e.key === "Escape") {
      setValue("");
      setVisible(false);
    }
  };

  if (!visible) {
    return (
      <button
        className="search-trigger"
        onClick={() => {
          setVisible(true);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
      />
    );
  }

  return (
    <div className="search-overlay">
      <input
        ref={inputRef}
        className="search-input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search, URL, or ? for AI…"
        autoComplete="off"
      />
      {loading && <div className="search-response search-response--loading">…</div>}
      {response && <div className="search-response">{response}</div>}
    </div>
  );
}
