import { invoke } from "@tauri-apps/api/core";

export interface MonitorInfo {
  id: number;
  width: number;
  height: number;
  x: number;
  y: number;
  name: string;
}

export function useSystem() {
  const getMonitors = () => invoke<MonitorInfo[]>("get_monitors");
  const toggleMonitorPower = (on: boolean) => invoke<void>("toggle_monitor_power", { on });
  const systemStandby = () => invoke<void>("system_standby");
  const shutdownSystem = () => invoke<void>("shutdown_system");
  const restartSystem = () => invoke<void>("restart_system");

  return { getMonitors, toggleMonitorPower, systemStandby, shutdownSystem, restartSystem };
}
