import { StatusSnapshot } from "../types";
import { AlertBanner } from "./AlertBanner";
import { StatusCard } from "./StatusCard";
import { NetworkChart } from "./NetworkChart";
import { Activity, ArrowDown, ArrowUp, Wifi, Zap, Navigation, HardDrive } from "lucide-react";

interface DashboardProps {
    status: StatusSnapshot | null;
    history: { timestamp: string; downlink: number; latency: number }[];
    isConnected: boolean;
}

export function Dashboard({ status, history, isConnected }: DashboardProps) {
    if (!status) {
        return (
            <div className="flex min-h-screen items-center justify-center text-zinc-500">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-700 border-t-white"></div>
                    <p>Connecting to Starlink...</p>
                </div>
            </div>
        );
    }

    const { health, service, network, installation, alerts } = status || {};

    if (!service || !network || !health || !installation) return null;

    return (
        <div className="min-h-screen bg-black p-6 text-zinc-100 selection:bg-white/20">
            <div className="mx-auto max-w-6xl space-y-6">
                {/* Header */}
                <header className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                            <Wifi className="h-5 w-5" />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight">Starlink Monitor</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium border ${isConnected ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-red-500/30 bg-red-500/10 text-red-400'}`}>
                            <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                            {isConnected ? 'LIVE' : 'DISCONNECTED'}
                        </div>
                        <div className="text-xs text-zinc-500 font-mono">
                            REV3_PROTO2
                        </div>
                    </div>
                </header>

                <AlertBanner alerts={alerts} />

                {/* KPI Grid */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatusCard
                        label="Service State"
                        value={service.state}
                        icon={<Activity className="h-4 w-4" />}
                        className={service.state === "CONNECTED" ? "border-green-900/30 bg-green-900/10" : ""}
                    />
                    <StatusCard
                        label="Obstructions"
                        value={`${(service.obstruction_fraction * 100).toFixed(2)}%`}
                        icon={<Zap className="h-4 w-4" />}
                    />
                    <StatusCard
                        label="Downlink"
                        value={network.downlink_mbps.toFixed(1)}
                        unit="Mbps"
                        icon={<ArrowDown className="h-4 w-4" />}
                    />
                    <StatusCard
                        label="Latency"
                        value={network.latency_ms.toFixed(0)}
                        unit="ms"
                        icon={<Activity className="h-4 w-4" />}
                    />
                </div>

                {/* Charts & Details */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <NetworkChart data={history} />
                    </div>

                    <div className="space-y-4">
                        {/* Health Panel */}
                        <div className="rounded-xl border border-white/5 bg-white/5 p-4 backdrop-blur-sm">
                            <h3 className="mb-4 text-sm font-medium text-zinc-400">System Health</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-500">Motors</span>
                                    <span className={health.motors_healthy ? "text-green-400" : "text-red-400"}>
                                        {health.motors_healthy ? "Healthy" : "Stuck"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-500">Thermal Status</span>
                                    <span className={!health.thermal_throttle ? "text-green-400" : "text-yellow-400"}>
                                        {health.thermal_throttle ? "Throttled" : "Normal"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-500">Heating</span>
                                    <span className={health.is_heating ? "text-orange-400" : "text-zinc-600"}>
                                        {health.is_heating ? "Active" : "Idle"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-500">Uptime</span>
                                    <span className="font-mono text-zinc-300">{(service.uptime_seconds / 3600).toFixed(1)}h</span>
                                </div>
                            </div>
                        </div>

                        {/* Installation Panel */}
                        <div className="rounded-xl border border-white/5 bg-white/5 p-4 backdrop-blur-sm">
                            <h3 className="mb-4 text-sm font-medium text-zinc-400 flex items-center gap-2">
                                <Navigation className="h-4 w-4" /> Installation
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-500">Tilt</span>
                                    <span className="font-mono text-zinc-300">{installation.tilt_current.toFixed(1)}°</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-500">Boresight Delta</span>
                                    <span className="font-mono text-zinc-300">{installation.tilt_delta.toFixed(1)}°</span>
                                </div>
                            </div>
                        </div>

                        {/* Consumption Panel */}
                        <div className="rounded-xl border border-white/5 bg-white/5 p-4 backdrop-blur-sm">
                            <h3 className="mb-4 text-sm font-medium text-zinc-400 flex items-center gap-2">
                                <HardDrive className="h-4 w-4" /> Data Usage
                            </h3>
                            <div className="space-y-2">
                                <div className="p-3 bg-black/20 rounded-lg">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-zinc-500 text-xs uppercase tracking-wider">Session</span>
                                        <span className="text-white font-mono text-lg">{(status.consumption?.session_gb || 0).toFixed(2)} <span className="text-xs text-zinc-600">GB</span></span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="p-2 bg-black/20 rounded-lg">
                                        <div className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">Today</div>
                                        <div className="text-zinc-300 font-mono">{(status.consumption?.day_gb || 0).toFixed(2)}</div>
                                    </div>
                                    <div className="p-2 bg-black/20 rounded-lg">
                                        <div className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">Month</div>
                                        <div className="text-zinc-300 font-mono">{(status.consumption?.month_gb || 0).toFixed(2)}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
