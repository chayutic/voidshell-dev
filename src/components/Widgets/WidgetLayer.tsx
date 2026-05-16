import { useState } from "react";
import MonitorPicker from "./MonitorPicker";

// Top-level container for all positioned widgets.
// Widgets are rendered with absolute positioning and do not interfere with the grid.
export default function WidgetLayer() {
  const [showPicker, setShowPicker] = useState(false);
  return (
    <div className="widget-layer" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <button
        onClick={() => setShowPicker(true)}
        style={{
          pointerEvents: "auto",
          position: "absolute",
          bottom: 16,
          right: 16,
          background: "rgba(255,255,255,0.07)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 8,
          color: "rgba(255,255,255,0.55)",
          padding: "6px 12px",
          cursor: "pointer",
          fontSize: 12,
        }}
      >
        Wallpaper
      </button>
      {showPicker && <MonitorPicker onClose={() => setShowPicker(false)} />}
    </div>
  );
}
