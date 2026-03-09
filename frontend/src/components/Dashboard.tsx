import { StatusSnapshot } from "../types";
import { AlertBanner } from "./AlertBanner";
import { StatusCard } from "./StatusCard";
import { NetworkChart } from "./NetworkChart";
import { Activity, ArrowDown, ArrowUp, Wifi, Zap, Navigation, HardDrive } from "lucide-react";

interface DashboardProps {
    status: StatusSnapshot | null;
    history: { timestamp: string; downlink: number; uplink: number; latency: number }[];
    isConnected: boolean;
}

export function Dashboard({ status, history, isConnected }: DashboardProps) {
    if (!status) {
        return (
            <div className="flex min-h-screen items-center justify-center text-zinc-500">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-700 border-t-white"></div>
                    <p>Conectando a Starlink...</p>
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
                        <h1 className="text-xl font-bold tracking-tight">Monitor Starlink</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium border ${isConnected ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-red-500/30 bg-red-500/10 text-red-400'}`}>
                            <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                            {isConnected ? 'EN LÍNEA' : 'DESCONECTADO'}
                        </div>
                    </div>
                </header>

                <AlertBanner alerts={alerts} />

                {/* KPI Grid */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                    <StatusCard
                        label="Estado"
                        value={service.state === "ONLINE" ? "EN LÍNEA" : service.state === "OFFLINE" ? "FUERA" : service.state}
                        icon={<Activity className="h-4 w-4" />}
                        className={service.state === "ONLINE" ? "border-green-900/30 bg-green-900/10" : ""}
                    />
                    <StatusCard
                        label="Obstrucciones"
                        value={`${(service.obstruction_fraction * 100).toFixed(2)}%`}
                        icon={<Zap className="h-4 w-4" />}
                    />
                    <StatusCard
                        label="Descarga"
                        value={network.downlink_mbps.toFixed(1)}
                        unit="Mbps"
                        icon={<ArrowDown className="h-4 w-4" />}
                    />
                    <StatusCard
                        label="Subida"
                        value={network.uplink_mbps.toFixed(1)}
                        unit="Mbps"
                        icon={<ArrowUp className="h-4 w-4" />}
                    />
                    <StatusCard
                        label="Latencia"
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
                            <h3 className="mb-4 text-sm font-medium text-zinc-400">Salud del Sistema</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-500">Motores</span>
                                    <span className={health.motors_healthy ? "text-green-400" : "text-red-400"}>
                                        {health.motors_healthy ? "Sanos" : "Atascados"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-500">Calefacción</span>
                                    <span className={health.is_heating ? "text-orange-400" : "text-zinc-600"}>
                                        {health.is_heating ? "Activa" : "Apagada"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-500">Ahorro de Energía</span>
                                    <span className={service.power_save_idle ? "text-yellow-400" : "text-zinc-600"}>
                                        {service.power_save_idle ? "Activo" : "Inactivo"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-500">Tipo de Instalación</span>
                                    <span className="font-mono text-zinc-300">
                                        {service.mobility_class === "0" ? "Fija (Standard)" : 
                                         service.mobility_class === "1" ? "Móvil (Estática)" : 
                                         service.mobility_class === "2" ? "Móvil (En movimiento)" : 
                                         service.mobility_class}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-500">Tiempo de Actividad</span>
                                    <span className="font-mono text-zinc-300">{(service.uptime_seconds / 3600).toFixed(1)}h</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-500">Obstruido (24h)</span>
                                    <span className="font-mono text-zinc-300">{(service.obstructed_seconds_24h / 60).toFixed(1)} min</span>
                                </div>
                                <div className="flex items-center justify-between border-t border-white/5 pt-2 mt-2">
                                    <span className="text-zinc-500">Consumo Eléctrico</span>
                                    <span className="font-mono text-zinc-300">{health.power_w.toFixed(1)} W</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-500">Señal SNR</span>
                                    <span className={network.snr_valid ? "text-green-400" : "text-yellow-400"}>
                                        {network.snr_valid ? "Óptima" : "Baja"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-500">Actualización</span>
                                    <span className={service.update_ready ? "text-blue-400" : "text-zinc-600"}>
                                        {service.update_ready ? "Disponible" : "Al Día"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Installation Panel */}
                        <div className="rounded-xl border border-white/5 bg-white/5 p-4 backdrop-blur-sm">
                            <h3 className="mb-4 text-sm font-medium text-zinc-400 flex items-center gap-2">
                                <Navigation className="h-4 w-4" /> Instalación
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-500">Inclinación (Act / Op)</span>
                                    <span className="font-mono text-zinc-300">{installation.tilt_current.toFixed(1)}° / {installation.tilt_target.toFixed(1)}°</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-500">Azimuth (Act / Op)</span>
                                    <span className="font-mono text-zinc-300">{installation.azimuth_current.toFixed(1)}° / {installation.azimuth_target.toFixed(1)}°</span>
                                </div>
                                <div className="flex items-center justify-between border-t border-white/5 pt-2 mt-2">
                                    <span className="text-zinc-500">Satélites GPS</span>
                                    <span className="font-mono text-zinc-300">{installation.gps_satellites}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-500">GPS Válido</span>
                                    <span className={installation.gps_valid ? "text-green-400" : "text-red-400"}>
                                        {installation.gps_valid ? "Sí" : "No"}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-zinc-500">Coordenadas</span>
                                    <span className="font-mono text-zinc-300 text-right">{installation.latitude.toFixed(4)}, {installation.longitude.toFixed(4)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-500">Altitud</span>
                                    <span className="font-mono text-zinc-300">{installation.altitude_m.toFixed(1)} m</span>
                                </div>
                            </div>
                        </div>

                        {/* Consumption Panel */}
                        <div className="rounded-xl border border-white/5 bg-white/5 p-4 backdrop-blur-sm">
                            <h3 className="mb-4 text-sm font-medium text-zinc-400 flex items-center gap-2">
                                <HardDrive className="h-4 w-4" /> Uso de Datos
                            </h3>
                            <div className="space-y-3">
                                <div className="group relative overflow-hidden rounded-xl bg-white/5 p-4 transition-all hover:bg-white/10">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider text-zinc-500">Sesión Actual</p>
                                            <p className="font-mono text-2xl font-bold text-white">
                                                {(status.consumption?.session_gb || 0).toFixed(2)}
                                                <span className="ml-1 text-xs font-normal text-zinc-500">GB</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                                        <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Hoy</p>
                                        <p className="font-mono text-lg font-semibold text-zinc-200">
                                            {(status.consumption?.day_gb || 0).toFixed(2)}
                                            <span className="ml-1 text-[10px] text-zinc-600">GB</span>
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                                        <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Mes</p>
                                        <p className="font-mono text-lg font-semibold text-zinc-200">
                                            {(status.consumption?.month_gb || 0).toFixed(2)}
                                            <span className="ml-1 text-[10px] text-zinc-600">GB</span>
                                        </p>
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
