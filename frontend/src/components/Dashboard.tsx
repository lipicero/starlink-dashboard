import { memo, useState, useMemo } from "react";
import { StatusSnapshot } from "../types";
import { AlertBanner } from "./AlertBanner";
import { StatusCard } from "./StatusCard";
import dynamic from "next/dynamic";
import { Activity, ArrowDown, ArrowUp, Zap, Navigation, HardDrive, Thermometer, ArrowUpCircle, Signal, Link2 } from "lucide-react";
import { cn } from "../lib/utils";

const NetworkChart = dynamic(() => import("./NetworkChart").then(mod => mod.NetworkChart), {
    ssr: false,
    loading: () => <div className="h-[350px] w-full animate-pulse rounded-2xl border border-white/5 bg-zinc-900/40" />
});

interface DashboardProps {
    status: StatusSnapshot | null;
    history: { timestamp: string; downlink: number; uplink: number; latency: number; power: number }[];
    isConnected: boolean;
}

export const Dashboard = memo(function Dashboard({ status, history, isConnected }: DashboardProps) {
    if (!status) {
        return (
            <div className="flex min-h-screen items-center justify-center text-zinc-500">
                <div aria-live="polite" className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-700 border-t-white"></div>
                    <p>Conectando a Starlink…</p>
                </div>
            </div>
        );
    }

    const { health, service, network, installation, alerts } = status || {};

    if (!service || !network || !health || !installation) return null;

    const [sampleLimit, setSampleLimit] = useState(60);

    const filteredHistory = useMemo(() => history.slice(-sampleLimit), [history, sampleLimit]);

    const avgDownlink = filteredHistory.length > 0
        ? filteredHistory.reduce((acc, curr) => acc + curr.downlink, 0) / filteredHistory.length
        : 0;
    const avgUplink = filteredHistory.length > 0
        ? filteredHistory.reduce((acc, curr) => acc + curr.uplink, 0) / filteredHistory.length
        : 0;
    const avgLatency = filteredHistory.length > 0
        ? filteredHistory.reduce((acc, curr) => acc + curr.latency, 0) / filteredHistory.length
        : 0;
    const avgPower = filteredHistory.length > 0
        ? filteredHistory.reduce((acc, curr) => acc + curr.power, 0) / filteredHistory.length
        : 0;

    // Quality Score Calculation
    const calculateQualityScore = () => {
        let score = 100;
        if (network.packet_loss > 0) score -= (network.packet_loss * 100) * 5;
        if (network.latency_ms > 50) score -= (network.latency_ms - 50) / 2;
        if (!network.snr_valid) score -= 15;
        if (service.obstruction_fraction > 0) score -= service.obstruction_fraction * 200;
        return Math.floor(Math.max(0, Math.min(100, score)));
    };

    const qualityScore = calculateQualityScore();

    return (
        <div className="min-h-screen bg-[#020205] p-6 text-zinc-100 selection:bg-blue-500/30 relative overflow-hidden">
            {/* Ambient Background Effects */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="mx-auto max-w-7xl space-y-8 relative z-10">
                {/* Header */}                <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-4">
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-black tracking-tighter text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500 text-center sm:text-left">
                                STARLINK <span className="text-blue-500">DASHBOARD</span>
                            </h1>
                        </div>
                        <div className="hidden md:flex ml-4 items-center bg-white/[0.03] border border-white/5 rounded-full p-1 self-center">
                            {[60, 300, 600, 720].map((limit) => (
                                <button
                                    key={limit}
                                    onClick={() => setSampleLimit(limit)}
                                    className={cn(
                                        "px-3 py-1 text-[10px] font-bold rounded-full transition-all",
                                        sampleLimit === limit 
                                            ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40" 
                                            : "text-zinc-500 hover:text-white"
                                    )}
                                >
                                    {limit === 60 ? "1m" : limit === 300 ? "5m" : limit === 600 ? "10m" : "Max"}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 sm:gap-4">
                        <div className="flex items-center gap-3 sm:mr-4 bg-white/[0.03] border border-white/5 px-3 py-1.5 rounded-2xl">
                            <div className="flex flex-col items-end">
                                <span className="text-[8px] sm:text-[10px] font-black tracking-widest text-zinc-600 uppercase">Calidad</span>
                                <span className={cn(
                                    "text-sm sm:text-xl font-black font-mono leading-none",
                                    qualityScore > 80 ? "text-green-400" : qualityScore > 50 ? "text-yellow-400" : "text-red-400"
                                )}>{qualityScore}%</span>
                            </div>
                            <div className="hidden md:block h-1.5 w-20 lg:w-24 bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                    className={cn(
                                        "h-full transition-all duration-1000",
                                        qualityScore > 80 ? "bg-green-500" : qualityScore > 50 ? "bg-yellow-500" : "bg-red-500"
                                    )}
                                    style={{ width: `${qualityScore}%` }}
                                />
                            </div>
                        </div>
                        {service.update_ready && (
                            <div className="flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-400 animate-pulse">
                                <ArrowUpCircle className="h-3 w-3" />
                                Actualización Lista
                            </div>
                        )}
                        <div className={cn(
                            "flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold border transition-all duration-500",
                            isConnected
                                ? 'border-green-500/20 bg-green-500/5 text-green-400 shadow-[0_0_15px_-5px_rgba(34,197,94,0.3)]'
                                : 'border-red-500/20 bg-red-500/5 text-red-400 shadow-[0_0_15px_-5px_rgba(239,68,68,0.3)]'
                        )}>
                            <div className={cn(
                                "h-2 w-2 rounded-full animate-pulse",
                                isConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'
                            )} />
                            {isConnected ? 'SISTEMA ONLINE' : 'SISTEMA OFFLINE'}
                        </div>
                    </div>
                </header>

                <AlertBanner alerts={alerts} />
                {/* KPI Grid */}
                <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-5">
                    <StatusCard
                        label="Estado del Sistema"
                        value={service.state === "En Linea" ? "Activo" : service.state === "Fuera de Linea" ? "Inactivo" : service.state}
                        icon={<Activity aria-hidden="true" className="h-4 w-4" />}
                        className={cn(
                            "transition-all duration-500",
                            service.state === "En Linea" ? "border-red-500/20 bg-red-500/5" : "border-green-500/20 bg-green-500/5"
                        )}
                    />
                    <StatusCard
                        label="Obstrucciones"
                        value={`${(service.obstruction_fraction * 100).toFixed(2)}%`}
                        icon={<Zap aria-hidden="true" className="h-4 w-4 text-yellow-500" />}
                    >
                        <div className="mt-2 border-t border-white/5 pt-2 space-y-1">
                            <div className="flex items-center justify-between text-[10px]">
                                <span className="text-zinc-500 uppercase tracking-tighter">Estabilidad</span>
                                <span className={cn(
                                    "font-mono font-bold",
                                    service.obstruction_fraction > 0.05 ? "text-red-400" : "text-green-400"
                                )}>
                                    {service.obstruction_fraction < 0.01 ? "Óptima" : service.obstruction_fraction < 0.05 ? "Normal" : "Critica"}
                                </span>
                            </div>
                        </div>
                    </StatusCard>
                    <StatusCard
                        label="Descarga"
                        value={network.downlink_mbps.toFixed(1)}
                        unit="Mbps"
                        icon={<ArrowDown aria-hidden="true" className="h-4 w-4 text-blue-500" />}
                    >
                        <div className="mt-2 border-t border-white/5 pt-2 flex items-center justify-between text-[10px]">
                            <span className="text-zinc-500 uppercase tracking-tighter">Promedio Hist.</span>
                            <span className="font-mono text-zinc-300 font-bold">{avgDownlink.toFixed(1)} Mbps</span>
                        </div>
                    </StatusCard>
                    <StatusCard
                        label="Subida"
                        value={network.uplink_mbps.toFixed(1)}
                        unit="Mbps"
                        icon={<ArrowUp aria-hidden="true" className="h-4 w-4 text-blue-500" />}
                    >
                        <div className="mt-2 border-t border-white/5 pt-2 flex items-center justify-between text-[10px]">
                            <span className="text-zinc-500 uppercase tracking-tighter">Promedio Hist.</span>
                            <span className="font-mono text-zinc-300 font-bold">{avgUplink.toFixed(1)} Mbps</span>
                        </div>
                    </StatusCard>
                    <StatusCard
                        label="Latencia"
                        value={network.latency_ms.toFixed(0)}
                        unit="ms"
                        icon={<Activity aria-hidden="true" className="h-4 w-4 text-purple-500" />}
                    >
                        <div className="mt-2 border-t border-white/5 pt-2 flex flex-col gap-1.5">
                            <div className="flex items-center justify-between text-[10px]">
                                <span className="text-zinc-500 uppercase tracking-tighter">Pérdida Paquetes</span>
                                <span className={cn(
                                    "font-mono font-bold",
                                    network.packet_loss > 0 ? "text-red-400" : "text-green-400"
                                )}>
                                    {(network.packet_loss * 100).toFixed(1)}%
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-[10px]">
                                <span className="text-zinc-500 uppercase tracking-tighter">Promedio Hist.</span>
                                <span className="font-mono text-zinc-300 font-bold">{avgLatency.toFixed(0)} ms</span>
                            </div>
                        </div>
                    </StatusCard>
                </div>

                {/* Charts & Details */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <NetworkChart data={filteredHistory} />
                    </div>

                    <div className="space-y-4">
                        {/* Health Panel */}
                        <div className="group relative rounded-2xl border border-white/5 bg-zinc-900/40 p-6 backdrop-blur-xl transition-all hover:border-white/10">
                            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent rounded-2xl pointer-events-none" />
                            <h3 className="mb-6 text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center justify-between">
                                Salud del Sistema
                                <div className="h-[1px] flex-grow ml-4 bg-white/5" />
                            </h3>
                            <div className="space-y-4 text-sm font-medium">
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-500">Motores</span>
                                    <span className={cn(
                                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                        health.motors_healthy ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                                    )}>
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
                                    <span className="text-zinc-500">Calidad Señal (SNR)</span>
                                    <div className="flex items-center gap-2">
                                        <Signal className={cn(
                                            "h-3 w-3",
                                            network.snr_valid ? "text-green-500" : "text-red-500"
                                        )} />
                                        <span className={network.snr_valid ? "text-green-400" : "text-red-400"}>
                                            {network.snr_valid ? "Sincronizada" : "Ruido Alto"}
                                        </span>
                                    </div>
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
                                                service.mobility_class === "2" ? "Móvil (Movi)" :
                                                    service.mobility_class}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-500">Uptime</span>
                                    <span className="font-mono text-zinc-100 italic [font-variant-numeric:tabular-nums]">{(service.uptime_seconds / 3600).toFixed(1)}h</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-500">Obstruido (24h)</span>
                                    <span className="font-mono text-zinc-300 [font-variant-numeric:tabular-nums]">{(service.obstructed_seconds_24h / 60).toFixed(1)} min</span>
                                </div>
                                <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-2">
                                    <div className="flex flex-col">
                                        <span className="text-zinc-500 uppercase text-[10px] tracking-tighter">Potencia Actual</span>
                                        <span className="font-mono text-blue-400 font-bold [font-variant-numeric:tabular-nums]">{health.power_w.toFixed(1)} W</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-zinc-500 uppercase text-[10px] tracking-tighter">Promedio ({sampleLimit === 720 ? 'Max' : sampleLimit === 60 ? '1m' : sampleLimit === 300 ? '5m' : '10m'})</span>
                                        <span className="font-mono text-zinc-300 font-bold [font-variant-numeric:tabular-nums]">{avgPower.toFixed(1)} W</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Installation Panel */}
                        <div className="group relative rounded-2xl border border-white/5 bg-zinc-900/40 p-6 backdrop-blur-xl transition-all hover:border-white/10">
                            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent rounded-2xl pointer-events-none" />
                            <h3 className="mb-6 text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Navigation aria-hidden="true" className="h-4 w-4 text-blue-500" /> Instalación
                                </div>
                                <div className="h-[1px] flex-grow ml-4 bg-white/5" />
                            </h3>
                            <div className="space-y-4 text-sm font-medium">
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-500">Inclinación (Act / Op)</span>
                                    <span className="font-mono text-zinc-100 [font-variant-numeric:tabular-nums]">{installation.tilt_current.toFixed(1)}° / <span className="text-blue-500">{installation.tilt_target.toFixed(1)}°</span></span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-500">Azimuth (Act / Op)</span>
                                    <span className="font-mono text-zinc-100 [font-variant-numeric:tabular-nums]">{installation.azimuth_current.toFixed(1)}° / <span className="text-blue-500">{installation.azimuth_target.toFixed(1)}°</span></span>
                                </div>
                                <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-2">
                                    <span className="text-zinc-500">Sats / GPS</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono font-bold text-zinc-100 [font-variant-numeric:tabular-nums]">{installation.gps_satellites}</span>
                                        <span className={cn(
                                            "h-1.5 w-1.5 rounded-full",
                                            installation.gps_valid ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" : "bg-red-500"
                                        )} />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                    <span className="text-[10px] uppercase tracking-widest text-zinc-500 text-center">Datos de ubicación precisa</span>
                                    <div className="flex justify-between items-center bg-black/40 p-2 rounded-lg font-mono text-[11px] [font-variant-numeric:tabular-nums]">
                                        <span className="text-zinc-600">LAT:</span>
                                        <span className="text-zinc-200">{installation.latitude.toFixed(5)}°</span>
                                        <span className="w-1 h-1 rounded-full bg-white/10" />
                                        <span className="text-zinc-600">LON:</span>
                                        <span className="text-zinc-200">{installation.longitude.toFixed(5)}°</span>
                                    </div>
                                    <div className="flex justify-between items-center px-2">
                                        <span className="text-zinc-600 text-[11px]">ALTITUD:</span>
                                        <span className="text-zinc-100 font-mono font-bold [font-variant-numeric:tabular-nums]">{installation.altitude_m.toFixed(1)}m</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Consumption Panel */}
                        <div className="group relative rounded-2xl border border-white/5 bg-zinc-900/40 p-6 backdrop-blur-xl transition-all hover:border-white/10">
                            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent rounded-2xl pointer-events-none" />
                            <h3 className="mb-6 text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <HardDrive aria-hidden="true" className="h-4 w-4 text-purple-500" /> Uso de Datos
                                </div>
                                <div className="h-[1px] flex-grow ml-4 bg-white/5" />
                            </h3>
                            <div className="space-y-4">
                                <div className="group relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/5 p-5 transition-all hover:bg-white/[0.06]">
                                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all duration-700" />
                                    <p className="text-[10px] items-center mb-1 flex gap-2 font-black uppercase tracking-widest text-zinc-500">
                                        Sesión Actual
                                        <span className="h-1 w-1 rounded-full bg-purple-500" />
                                    </p>
                                    <div className="flex items-baseline gap-2">
                                        <p className="font-mono text-4xl font-black text-white leading-none [font-variant-numeric:tabular-nums]">
                                            {(status.consumption?.session_gb || 0).toFixed(2)}
                                        </p>
                                        <span className="text-xs font-bold text-zinc-500 uppercase">Gigabytes</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:bg-white/[0.04]">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">Hoy</p>
                                        <p className="font-mono text-xl font-bold text-zinc-100 flex items-baseline gap-1 [font-variant-numeric:tabular-nums]">
                                            {(status.consumption?.day_gb || 0).toFixed(2)}
                                            <span className="text-[10px] text-zinc-600">GB</span>
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:bg-white/[0.04]">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">Mes</p>
                                        <p className="font-mono text-xl font-bold text-zinc-100 flex items-baseline gap-1 [font-variant-numeric:tabular-nums]">
                                            {(status.consumption?.month_gb || 0).toFixed(2)}
                                            <span className="text-[10px] text-zinc-600">GB</span>
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
});
