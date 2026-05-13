import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

interface TelemetryData {
  cpuPercent: number;
  ramUsedMb: number;
  ramTotalMb: number;
}

// Polls the Rust sysinfo backend every 2s.
export default function SystemTelemetry() {
  const [data, setData] = useState<TelemetryData | null>(null);

  useEffect(() => {
    const tick = () => invoke<TelemetryData>("get_telemetry").then(setData);
    tick();
    const id = setInterval(tick, 2000);
    return () => clearInterval(id);
  }, []);

  if (!data) return null;

  return (
    <div className="widget widget--telemetry" style={{ pointerEvents: "auto" }}>
      <span>CPU {data.cpuPercent.toFixed(0)}%</span>
      <span>RAM {Math.round(data.ramUsedMb / 1024)}/{Math.round(data.ramTotalMb / 1024)} GB</span>
    </div>
  );
}
