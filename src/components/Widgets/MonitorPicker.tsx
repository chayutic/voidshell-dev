import { useEffect, useState } from "react";
import { pickImageFile } from "../../hooks/useFileDialog";
import { useSettings } from "../../hooks/useSettings";
import { useSystem, type MonitorInfo } from "../../hooks/useSystem";

interface Props {
  onClose: () => void;
}

export default function MonitorPicker({ onClose }: Props) {
  const [monitors, setMonitors] = useState<MonitorInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [picking, setPicking] = useState<number | null>(null);
  const { wallpapers, setWallpaper } = useSettings();
  const { getMonitors } = useSystem();

  useEffect(() => {
    getMonitors()
      .then(setMonitors)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handlePick = async (monitorId: number) => {
    setPicking(monitorId);
    try {
      const path = await pickImageFile();
      if (path) await setWallpaper(monitorId, path);
    } finally {
      setPicking(null);
    }
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
      onClick={onClose}
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16, color: "#fff" }}>Wallpaper</h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.5)",
              cursor: "pointer",
              fontSize: 20,
              lineHeight: 1,
              padding: "0 4px",
            }}
          >
            ×
          </button>
        </div>

        {loading ? (
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: 0 }}>Detecting monitors…</p>
        ) : monitors.length === 0 ? (
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: 0 }}>No monitors detected.</p>
        ) : (
          monitors.map((monitor) => {
            const current = wallpapers[monitor.id];
            const busy = picking === monitor.id;
            return (
              <div
                key={monitor.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: "#fff", marginBottom: 2 }}>
                    {monitor.name || `Monitor ${monitor.id + 1}`}
                    <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginLeft: 8 }}>
                      {monitor.width}×{monitor.height}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "rgba(255,255,255,0.4)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                    title={current}
                  >
                    {current ? current.split(/[\\/]/).pop() : "No wallpaper set"}
                  </div>
                </div>
                <button
                  disabled={busy}
                  onClick={() => handlePick(monitor.id)}
                  style={{
                    background: "rgba(120,100,255,0.85)",
                    border: "none",
                    borderRadius: 7,
                    color: "#fff",
                    padding: "7px 14px",
                    cursor: busy ? "default" : "pointer",
                    fontSize: 12,
                    opacity: busy ? 0.6 : 1,
                    flexShrink: 0,
                  }}
                >
                  {busy ? "…" : "Pick"}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
