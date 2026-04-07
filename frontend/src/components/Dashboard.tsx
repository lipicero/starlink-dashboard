import { memo, useState, useMemo, useEffect } from "react";
import { StatusSnapshot } from "../types";
import { AlertBanner } from "./AlertBanner";
import { StatusCard } from "./StatusCard";
import dynamic from "next/dynamic";
import { Activity, ArrowDown, ArrowUp, Zap, Navigation, HardDrive, ArrowUpCircle, Signal } from "lucide-react";
import { cn } from "../lib/utils";

const NetworkChart = dynamic(() => import("./NetworkChart").then(mod => mod.NetworkChart), {
    ssr: false,
    loading: () => <div className="h-[350px] w-full animate-pulse rounded-2xl border border-white/5 bg-zinc-900/40" />
});

// Time limits in seconds: 1m, 5m, 1h, 12h, 24h
const SAMPLE_LIMITS = [60, 300, 3600, 43200, 86400];

interface DashboardProps {
    status: StatusSnapshot | null;
    history: { timestamp: string; downlink: number; uplink: number; latency: number; power: number; packet_loss: number; obstruction: number }[];
    isConnected: boolean;
}

export const Dashboard = memo(function Dashboard({ status, history, isConnected }: DashboardProps) {
    const { health, service, network, installation, alerts } = status || {};

    const [sampleLimitSeconds, setSampleLimitSeconds] = useState(300);

    useEffect(() => {
        const saved = localStorage.getItem('starlink_sample_limit');
        if (saved) {
            const parsed = parseInt(saved);
            setTimeout(() => {
                setSampleLimitSeconds(prev => prev !== parsed ? parsed : prev);
            }, 0);
        }
    }, []);

    const handleSetLimit = (limit: number) => {
        setSampleLimitSeconds(limit);
        localStorage.setItem('starlink_sample_limit', limit.toString());
    };


    // Filter history based on time instead of point count for accuracy
    const timeFilteredHistory = useMemo(() => {
        if (history.length === 0) return [];
        
        const latestTime = new Date(history[history.length - 1].timestamp).getTime() / 1000;
        const startTime = latestTime - sampleLimitSeconds;
        
        // Find the start index using a reverse loop (optimized for recent data)
        let startIndex = history.length - 1;
        while (startIndex >= 0) {
            const pt = new Date(history[startIndex].timestamp).getTime() / 1000;
            if (pt < startTime) {
                startIndex++;
                break;
            }
            startIndex--;
        }
        if (startIndex < 0) startIndex = 0;

        const filteredLength = history.length - startIndex;
        
        // Mobile-centric optimization: Limit to ~150 points for a very clean look
        const targetPoints = 150;
        if (filteredLength <= targetPoints) {
            return startIndex === 0 ? history : history.slice(startIndex);
        }

        const step = Math.ceil(filteredLength / targetPoints);
        const result = [];
        for (let i = startIndex; i < history.length; i += step) {
            const chunkEnd = Math.min(i + step, history.length);
            let down = 0, up = 0, lat = 0, loss = 0, pwr = 0, obs = 0;
            
            for (let j = i; j < chunkEnd; j++) {
                const pt = history[j];
                // Use max for throughput/obstruction to preserve visibility of spikes over long periods
                if (pt.downlink > down) down = pt.downlink;
                if (pt.uplink > up) up = pt.uplink;
                if (pt.obstruction > obs) obs = pt.obstruction;
                
                // Use sum for averaging others
                lat += pt.latency;
                loss += pt.packet_loss;
                pwr += pt.power;
            }
            
            const count = chunkEnd - i;
            result.push({
                timestamp: history[chunkEnd - 1].timestamp,
                downlink: down,
                uplink: up,
                latency: lat / count,
                packet_loss: loss / count,
                power: pwr / count,
                obstruction: obs
            });
        }
        return result;
    }, [history, sampleLimitSeconds]);

    const { avgDownlink, avgUplink, avgLatency, avgPower, maxDownlink, maxUplink } = useMemo(() => {
        const len = timeFilteredHistory.length;
        if (len === 0) return { avgDownlink: 0, avgUplink: 0, avgLatency: 0, avgPower: 0, maxDownlink: 0, maxUplink: 0 };
        
        let down = 0, up = 0, lat = 0, pwr = 0, maxD = 0, maxU = 0;
        
        for (let i = 0; i < len; i++) {
            const curr = timeFilteredHistory[i];
            down += curr.downlink;
            up += curr.uplink;
            lat += curr.latency;
            pwr += curr.power;
            if (curr.downlink > maxD) maxD = curr.downlink;
            if (curr.uplink > maxU) maxU = curr.uplink;
        }

        return {
            avgDownlink: down / len,
            avgUplink: up / len,
            avgLatency: lat / len,
            avgPower: pwr / len,
            maxDownlink: maxD,
            maxUplink: maxU
        };
    }, [timeFilteredHistory]);

    // Quality Score Calculation
    const qualityScore = useMemo(() => {
        let score = 100;
        if (!network || !service) return score;

        // Minor tolerances for normal Starlink micro-variance
        if (network.packet_loss > 0.005) score -= (network.packet_loss * 100) * 5;
        if (network.latency_ms > 65) score -= (network.latency_ms - 65) / 2;
        if (!network.snr_valid) score -= 15;
        if (service.obstruction_fraction > 0.001) score -= service.obstruction_fraction * 200;

        return Math.round(Math.max(0, Math.min(100, score)));
    }, [network, service]);

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

    if (!service || !network || !health || !installation) return null;

    return (
        <div className="min-h-screen bg-[#050505] p-4 sm:p-6 text-zinc-100 selection:bg-blue-500/30">
            <div className="mx-auto max-w-7xl space-y-8 relative z-10">
                {/* Header */}
                <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-4">
                    <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-black tracking-tighter text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500 text-center sm:text-left">
                                Starlink <span className="text-blue-500">Dashboard</span>
                            </h1>
                        </div>
                        <div className="flex sm:ml-4 items-center bg-white/[0.03] border border-white/5 rounded-full p-1 self-stretch sm:self-center justify-between sm:justify-center">
                            {SAMPLE_LIMITS.map((limit) => (
                                <button
                                    key={limit}
                                    onClick={() => handleSetLimit(limit)}
                                    aria-label={`Ver historial de ${limit === 60 ? "1 minuto" : limit === 300 ? "5 minutos" : limit === 3600 ? "1 hora" : limit === 43200 ? "12 horas" : "24 horas"}`}
                                    className={cn(
                                        "px-3 py-1 text-[10px] font-bold rounded-full transition-[background-color,color,box-shadow] duration-200",
                                        sampleLimitSeconds === limit
                                            ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40"
                                            : "text-zinc-500 hover:text-white"
                                    )}
                                >
                                    {limit === 60 ? "1m" : limit === 300 ? "5m" : limit === 3600 ? "1h" : limit === 43200 ? "12h" : "24h"}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 sm:gap-4">
                        <div className="flex items-center gap-2 sm:gap-3 bg-white/[0.03] border border-white/5 px-3 sm:px-4 py-1.5 rounded-full">
                            <span className="text-[10px] sm:text-xs font-bold tracking-widest text-zinc-400 uppercase">Calidad</span>
                            <div className="flex items-center gap-2">
                                <div className="h-1.5 w-12 sm:w-16 bg-zinc-800 rounded-full overflow-hidden">
                                    <div
                                        className={cn(
                                            "h-full transition-[width] duration-500",
                                            qualityScore > 80 ? "bg-green-500" : qualityScore > 50 ? "bg-yellow-500" : "bg-red-500"
                                        )}
                                        style={{ width: `${qualityScore}%` }}
                                    />
                                </div>
                                <span className={cn(
                                    "text-[10px] sm:text-xs font-black font-mono",
                                    qualityScore > 80 ? "text-green-400" : qualityScore > 50 ? "text-yellow-400" : "text-red-400"
                                )}>{qualityScore}%</span>
                            </div>
                        </div>
                        {service.update_ready ? (
                            <div className="flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-400 animate-pulse">
                                <ArrowUpCircle className="h-3 w-3" />
                                Actualización Lista
                            </div>
                        ) : null}
                        <div className={cn(
                            "flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold border transition-[border-color,background-color,color,shadow] duration-500",
                            isConnected
                                ? 'border-green-500/20 bg-green-500/5 text-green-400 shadow-[0_0_15px_-5px_rgba(34,197,94,0.3)]'
                                : status
                                    ? 'border-yellow-500/20 bg-yellow-500/5 text-yellow-400 shadow-[0_0_15px_-5px_rgba(234,179,8,0.3)]'
                                    : 'border-red-500/20 bg-red-500/5 text-red-400 shadow-[0_0_15px_-5px_rgba(239,68,68,0.3)]'
                        )}>
                            <div className={cn(
                                "h-2 w-2 rounded-full",
                                isConnected
                                    ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]'
                                    : status
                                        ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.8)]'
                                        : 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]'
                            )} />
                            {isConnected ? 'Sistema Live' : status ? 'Sincronizando Live...' : 'Sistema Offline'}
                        </div>
                    </div>
                </header>

                <AlertBanner alerts={alerts || []} />
                <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
                    <div className="col-span-2 lg:col-span-1">
                        <StatusCard
                            label="Estado del Sistema"
                            value={service?.state === "En Línea" ? "Activo" : service?.state || "Offline"}
                            icon={<Activity className="h-4 w-4" />}
                            className={service?.state === "En Línea" ? "border-green-500/10 shadow-[0_0_20px_-10px_rgba(34,197,94,0.1)]" : "border-red-500/10"}
                        />
                    </div>

                    <StatusCard
                        label="Obstrucciones"
                        value={((service?.obstruction_fraction || 0) * 100).toFixed(2)}
                        unit="%"
                        icon={<Zap className="h-4 w-4" />}
                    >
                        <div className="mt-2 flex items-center justify-between">
                            <span className="text-[10px] text-zinc-500 uppercase font-bold">Estabilidad</span>
                            <span className={cn(
                                "text-[10px] font-bold uppercase",
                                (service?.obstruction_fraction || 0) > 0.05 ? "text-red-400" : "text-green-400"
                            )}>
                                {(service?.obstruction_fraction || 0) < 0.01 ? "Óptima" : "Crítica"}
                            </span>
                        </div>
                    </StatusCard>

                    <StatusCard
                        label="Descarga"
                        value={network?.downlink_mbps ? network.downlink_mbps.toFixed(1) : "0.0"}
                        unit="Mbps"
                        icon={<ArrowDown className="h-4 w-4" />}
                    >
                        <div className="mt-2 space-y-1">
                            <div className="flex items-center justify-between text-[10px]">
                                <span className="text-zinc-600 uppercase font-bold">Pico Máximo</span>
                                <span className="text-blue-400 font-bold">{maxDownlink.toFixed(1)} Mbps</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px]">
                                <span className="text-zinc-600 uppercase font-bold">Promedio Hist.</span>
                                <span className="text-zinc-400 font-bold">{avgDownlink.toFixed(1)} Mbps</span>
                            </div>
                        </div>
                    </StatusCard>

                    <StatusCard
                        label="Subida"
                        value={network?.uplink_mbps ? network.uplink_mbps.toFixed(1) : "0.0"}
                        unit="Mbps"
                        icon={<ArrowUp className="h-4 w-4" />}
                    >
                        <div className="mt-2 space-y-1">
                            <div className="flex items-center justify-between text-[10px]">
                                <span className="text-zinc-600 uppercase font-bold">Pico Máximo</span>
                                <span className="text-purple-400 font-bold">{maxUplink.toFixed(1)} Mbps</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px]">
                                <span className="text-zinc-600 uppercase font-bold">Promedio Hist.</span>
                                <span className="text-zinc-400 font-bold">{avgUplink.toFixed(1)} Mbps</span>
                            </div>
                        </div>
                    </StatusCard>

                    <StatusCard
                        label="Latencia"
                        value={network?.latency_ms ? Math.round(network.latency_ms) : "--"}
                        unit="ms"
                        icon={<Activity className="h-4 w-4" />}
                    >
                        <div className="mt-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-zinc-600 uppercase font-bold">Pérdida</span>
                                <span className={cn(
                                    "text-[10px] font-bold",
                                    (network?.packet_loss || 0) > 0 ? "text-red-400" : "text-green-400"
                                )}>{((network?.packet_loss || 0) * 100).toFixed(1)}%</span>
                            </div>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                            <span className="text-[10px] text-zinc-600 uppercase font-bold">Promedio hist.</span>
                            <span className="text-[10px] text-zinc-400 font-bold">{Math.round(avgLatency)} ms</span>
                        </div>
                    </StatusCard>
                </div>

                {/* Charts & Details */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <NetworkChart data={timeFilteredHistory} />
                    </div>

                    <div className="space-y-4">
                        {/* Health Panel */}
                        <div className="group relative rounded-2xl border border-white/5 bg-zinc-900/40 p-6 backdrop-blur-xl transition-[border-color] duration-300 hover:border-white/10">
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
                                    <span className="font-mono text-zinc-100 italic [font-variant-numeric:tabular-nums]">
                                        {new Intl.NumberFormat('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(service.uptime_seconds / 3600)} h
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-500">Obstruido (24h)</span>
                                    <span className="font-mono text-zinc-300 [font-variant-numeric:tabular-nums]">
                                        {new Intl.NumberFormat('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(service.obstructed_seconds_24h / 60)} min
                                    </span>
                                </div>
                                <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-2">
                                    <div className="flex flex-col">
                                        <span className="text-zinc-500 uppercase text-[10px] tracking-tighter">Potencia Actual</span>
                                        <span className="font-mono text-blue-400 font-bold [font-variant-numeric:tabular-nums]">{health.power_w.toFixed(1)} W</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-zinc-500 uppercase text-[10px] tracking-tighter">Promedio ({sampleLimitSeconds === 86400 ? '24h' : sampleLimitSeconds === 43200 ? '12h' : sampleLimitSeconds === 3600 ? '1h' : sampleLimitSeconds === 300 ? '5m' : '1m'})</span>
                                        <span className="font-mono text-zinc-300 font-bold [font-variant-numeric:tabular-nums] mt-1">{avgPower.toFixed(1)} W</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Installation Panel */}
                        <div className="group relative rounded-2xl border border-white/5 bg-zinc-900/40 p-6 backdrop-blur-xl transition-[border-color] duration-300 hover:border-white/10">
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
                                    <span className="font-mono text-zinc-100 [font-variant-numeric:tabular-nums]">
                                        {new Intl.NumberFormat('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(installation.tilt_current)}° / <span className="text-blue-500">{new Intl.NumberFormat('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(installation.tilt_target)}°</span>
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-zinc-500">Azimuth (Act / Op)</span>
                                    <span className="font-mono text-zinc-100 [font-variant-numeric:tabular-nums]">
                                        {new Intl.NumberFormat('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(installation.azimuth_current)}° / <span className="text-blue-500">{new Intl.NumberFormat('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(installation.azimuth_target)}°</span>
                                    </span>
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

                                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-center gap-6">
                                    <div className="relative w-24 h-24 rounded-full border-2 border-white/10 bg-black/40 flex items-center justify-center">
                                        <div className="absolute top-1 text-[8px] font-bold text-zinc-500">N</div>
                                        <div className="absolute right-1 text-[8px] font-bold text-zinc-500">E</div>
                                        <div className="absolute bottom-1 text-[8px] font-bold text-zinc-500">S</div>
                                        <div className="absolute left-1 text-[8px] font-bold text-zinc-500">O</div>

                                        {/* Target Direction */}
                                        <div
                                            className="absolute w-full h-full transition-transform duration-1000"
                                            style={{ transform: `rotate(${installation.azimuth_target}deg)` }}
                                        >
                                            <div className="mx-auto w-1 h-2 bg-blue-500/50 rounded-full" />
                                        </div>

                                        {/* Current Direction (Antenna) */}
                                        <div
                                            className="absolute w-full h-full transition-transform duration-1000 z-10"
                                            style={{ transform: `rotate(${installation.azimuth_current}deg)` }}
                                        >
                                            <div className="mx-auto mt-2 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[12px] border-transparent border-b-white" />
                                        </div>

                                        <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full z-20" />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-white flex-shrink-0" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
                                            <span className="text-[10px] text-zinc-400">Apuntando ({installation.azimuth_current.toFixed(0)}°)</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-blue-500/50 flex-shrink-0" />
                                            <span className="text-[10px] text-zinc-400">Objetivo ({installation.azimuth_target.toFixed(0)}°)</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/5 mt-4">
                                    <span className="text-[10px] uppercase tracking-widest text-zinc-500 text-center">Datos de ubicación precisa</span>
                                    <div className="flex justify-between items-center bg-black/40 p-2 rounded-lg font-mono text-[11px] [font-variant-numeric:tabular-nums]">
                                        <span className="text-zinc-600">LAT:</span>
                                        <span className="text-zinc-200">{new Intl.NumberFormat('es-AR', { minimumFractionDigits: 5, maximumFractionDigits: 5 }).format(installation.latitude)}°</span>
                                        <span className="w-1 h-1 rounded-full bg-white/10" />
                                        <span className="text-zinc-600">LON:</span>
                                        <span className="text-zinc-200">{new Intl.NumberFormat('es-AR', { minimumFractionDigits: 5, maximumFractionDigits: 5 }).format(installation.longitude)}°</span>
                                    </div>
                                    <div className="flex justify-between items-center px-2">
                                        <span className="text-zinc-600 text-[11px]">ALTITUD:</span>
                                        <span className="text-zinc-100 font-mono font-bold [font-variant-numeric:tabular-nums]">{new Intl.NumberFormat('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(installation.altitude_m)} m</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Consumption Panel */}
                        <div className="group relative rounded-2xl border border-white/5 bg-zinc-900/40 p-6 backdrop-blur-xl transition-[border-color] duration-300 hover:border-white/10">
                            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent rounded-2xl pointer-events-none" />
                            <h3 className="mb-6 text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <HardDrive aria-hidden="true" className="h-4 w-4 text-purple-500" /> Uso de Datos
                                </div>
                                <div className="h-[1px] flex-grow ml-4 bg-white/5" />
                            </h3>
                            <div className="space-y-4">
                                <div className="group relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/5 p-5 transition-[background-color] duration-300 hover:bg-white/[0.06]">
                                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-[background-color] duration-700" />
                                    <p className="text-[10px] items-center mb-1 flex gap-2 font-black uppercase tracking-widest text-zinc-500">
                                        Sesión Actual
                                        <span className="h-1 w-1 rounded-full bg-purple-500" />
                                    </p>
                                    <div className="flex items-baseline gap-2">
                                        <p className="font-mono text-4xl font-black text-white leading-none [font-variant-numeric:tabular-nums]">
                                            {(status.consumption?.session_gb || 0).toFixed(2)}
                                        </p>
                                        <span className="text-xs font-bold text-zinc-500 uppercase">GB</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-[background-color] duration-300 hover:bg-white/[0.04]">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">Hoy</p>
                                        <p className="font-mono text-xl font-bold text-zinc-100 flex items-baseline gap-1 [font-variant-numeric:tabular-nums]">
                                            {(status.consumption?.day_gb || 0).toFixed(2)}
                                            <span className="text-[10px] text-zinc-600">GB</span>
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-[background-color] duration-300 hover:bg-white/[0.04]">
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
