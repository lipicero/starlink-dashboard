export interface HealthStatus {
  motors_healthy: boolean;
  is_heating: boolean;
  thermal_throttle: boolean;
  dish_temperature: number;
}

export interface ServiceStatus {
  uptime_seconds: number;
  downtime_seconds: number;
  obstruction_fraction: number;
  state: string;
}

export interface NetworkStatus {
  latency_ms: number;
  packet_loss: number;
  downlink_mbps: number;
  uplink_mbps: number;
  eth_link_active: boolean;
}

export interface InstallationStatus {
  tilt_current: number;
  tilt_target: number;
  tilt_delta: number;
  rotation_delta: number;
}

export interface Alert {
  id: string;
  message: string;
  level: "info" | "warning" | "error";
}

export interface ConsumptionStatus {
  session_gb: number;
  day_gb: number;
  month_gb: number;
}

export interface StatusSnapshot {
  timestamp: string;
  health: HealthStatus;
  service: ServiceStatus;
  network: NetworkStatus;
  installation: InstallationStatus;
  consumption: ConsumptionStatus;
  alerts: Alert[];
}
