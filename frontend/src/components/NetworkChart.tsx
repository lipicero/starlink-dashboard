"use client";

import { memo, useRef, useEffect, useMemo } from "react";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";

interface NetworkChartProps {
    data: { timestamp: string; downlink: number; uplink: number; latency: number; packet_loss: number; power: number; obstruction: number }[];
}



function makeGradient(color: string) {
    return (u: uPlot) => {
        const ctx = u.ctx;
        const { top, height } = u.bbox;
        if (!isFinite(top) || !isFinite(height)) return color;
        const gradient = ctx.createLinearGradient(0, top, 0, top + height);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, "transparent");
        return gradient;
    };
}

function buildThroughputOpts(width: number, height: number): uPlot.Options {
    const isMobile = width < 500;
    return {
        width,
        height,
        padding: [10, 10, 0, 5],
        cursor: { show: true, drag: { x: false, y: false } },
        select: { show: false, left: 0, top: 0, width: 0, height: 0 },
        legend: { show: true, live: true },
        focus: { alpha: 0.3 },
        axes: [
            {
                stroke: "#3f3f46",
                grid: { stroke: "#ffffff05", width: 1 },
                ticks: { show: false },
                font: "10px system-ui",
                space: 60,
                values: (u: uPlot, vals: number[]) =>
                    vals.map(v => {
                        const d = new Date(v * 1000);
                        return d.toLocaleTimeString("es-AR", { hour12: false, hour: "2-digit", minute: "2-digit" });
                    }),
            },
            {
                stroke: "#3f3f46",
                grid: { stroke: "#ffffff03", width: 1 },
                ticks: { show: false },
                font: "10px system-ui",
                incrs: [1, 2, 5, 10, 20, 25, 40, 50, 60, 80, 100, 120, 150, 200, 250, 300, 500],
                values: (u: uPlot, vals: number[]) => vals.map(v => Math.round(v) + (isMobile ? "" : " mbps")),
                size: isMobile ? 40 : 65,
                space: 15,
            },
        ],
        scales: {
            y: { auto: true, range: (u, min, max) => [0, Math.max(30, Math.ceil(max / 10) * 10 + 10)] },
        },
        series: [
            {
                label: "time",
                value: (u: uPlot, v: number | null) => v == null ? "--" : new Date(v * 1000).toLocaleTimeString("es-AR", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }),
            },
            {
                label: "down",
                stroke: "#3b82f6",
                width: 1,
                fill: makeGradient("rgba(59, 130, 246, 0.4)"),
                points: { show: false },
                paths: uPlot.paths.bars!({ size: [0.4, 100], align: -1 }),
                value: (u: uPlot, v: number | null) => (v == null || isNaN(v)) ? "--" : Math.round(v) + " mbps",
            },
            {
                label: "up",
                stroke: "#8b5cf6",
                width: 1,
                fill: makeGradient("rgba(139, 92, 246, 0.4)"), // Slightly more opaque for visibility
                points: { show: false },
                paths: uPlot.paths.bars!({ size: [0.4, 100], align: 1 }),
                value: (u: uPlot, v: number | null) => (v == null || isNaN(v)) ? "--" : Math.round(v) + " mbps",
            },
        ],
    };
}

function buildLatencyOpts(width: number, height: number): uPlot.Options {
    const isMobile = width < 500;
    return {
        width,
        height,
        padding: [10, 10, 0, 5],
        cursor: { show: true, drag: { x: false, y: false } },
        select: { show: false, left: 0, top: 0, width: 0, height: 0 },
        legend: { show: true, live: true },
        focus: { alpha: 0.3 },
        axes: [
            {
                stroke: "#3f3f46",
                grid: { stroke: "#ffffff05", width: 1 },
                ticks: { show: false },
                font: "10px system-ui",
                space: 60,
                values: (u: uPlot, vals: number[]) =>
                    vals.map(v => {
                        const d = new Date(v * 1000);
                        return d.toLocaleTimeString("es-AR", { hour12: false, hour: "2-digit", minute: "2-digit" });
                    }),
            },
            {
                stroke: "#3f3f46",
                grid: { stroke: "#ffffff03", width: 1 },
                ticks: { show: false },
                font: "10px system-ui",
                incrs: [5, 10, 15, 20, 25, 30, 40, 50, 75, 100, 150, 200, 250, 500],
                values: (u: uPlot, vals: number[]) => vals.map(v => Math.round(v) + (isMobile ? "" : " ms")),
                size: isMobile ? 35 : 55,
                space: 15,
            },
            {
                side: 1,
                stroke: "#ef444480",
                grid: { show: false },
                ticks: { show: false },
                font: "10px system-ui",
                incrs: [0.01, 0.02, 0.05, 0.1, 0.25, 0.5, 1],
                values: (u: uPlot, vals: number[]) => vals.map(v => Math.round(v * 100) + "%"),
                size: isMobile ? 0 : 40,
                scale: "loss",
                space: 15,
            },
        ],
        scales: {
            y: { auto: true, range: (u, min, max) => [0, Math.max(100, Math.ceil(max / 20) * 20 + 20)] },
            loss: { auto: false, range: [0, 1] },
        },
        series: [
            {
                label: "time",
            },
            {
                label: "ping",
                stroke: "#f59e0b",
                width: 1,
                fill: makeGradient("rgba(245, 158, 11, 0.4)"),
                points: { show: false },
                paths: uPlot.paths.bars!({ size: [0.6, 100], align: 1 }),
                scale: "y",
                value: (u: uPlot, v: number | null) => (v == null || isNaN(v)) ? "--" : Math.round(v) + " ms",
            },
            {
                label: "loss",
                stroke: "#ef4444",
                width: 1,
                fill: makeGradient("rgba(239, 68, 68, 0.7)"),
                points: { show: false },
                paths: uPlot.paths.bars!({ size: [0.6, 100], align: 1 }),
                scale: "loss",
                value: (u: uPlot, v: number | null) => (v == null || isNaN(v)) ? "--" : Math.round(v * 100) + "%",
            },
        ],
    };
}

function buildPowerOpts(width: number, height: number): uPlot.Options {
    const isMobile = width < 500;
    return {
        width,
        height,
        padding: [10, 10, 0, 5],
        cursor: { show: true, drag: { x: false, y: false } },
        select: { show: false, left: 0, top: 0, width: 0, height: 0 },
        legend: { show: true, live: true },
        focus: { alpha: 0.3 },
        scales: {
            y: { auto: true, range: (u, min, max) => [0, Math.max(80, Math.ceil(max / 10) * 10 + 10)] },
        },
        axes: [
            {
                stroke: "#3f3f46",
                grid: { stroke: "#ffffff05", width: 1 },
                ticks: { show: false },
                font: "10px system-ui",
                space: 60,
                values: (u: uPlot, vals: number[]) =>
                    vals.map(v => {
                        const d = new Date(v * 1000);
                        return d.toLocaleTimeString("es-AR", { hour12: false, hour: "2-digit", minute: "2-digit" });
                    }),
            },
            {
                stroke: "#3f3f46",
                grid: { stroke: "#ffffff03", width: 1 },
                ticks: { show: false },
                font: "10px system-ui",
                incrs: [1, 2, 5, 8, 10, 15, 20, 25, 30, 40, 50, 75, 100],
                values: (u: uPlot, vals: number[]) => vals.map(v => Math.round(v) + (isMobile ? "" : " w")),
                size: isMobile ? 35 : 55,
                space: 15,
            },
        ],
        series: [
            {
                label: "time",
            },
            {
                label: "pwr",
                stroke: "#ef4444",
                width: 1,
                fill: makeGradient("rgba(239, 68, 68, 0.4)"),
                points: { show: false },
                paths: uPlot.paths.bars!({ size: [0.6, 100], align: 1 }),
                value: (u: uPlot, v: number | null) => (v == null || isNaN(v)) ? "--" : Math.round(v) + " w",
            },
        ],
    };
}

function buildObstructionOpts(width: number, height: number): uPlot.Options {
    const isMobile = width < 500;
    return {
        width,
        height,
        padding: [10, 10, 0, 5],
        cursor: { show: true, drag: { x: false, y: false } },
        select: { show: false, left: 0, top: 0, width: 0, height: 0 },
        legend: { show: true, live: true },
        focus: { alpha: 0.3 },
        scales: {
            y: { auto: true, range: (u, min, max) => [0, Math.max(0.001, max * 1.5)] },
        },
        axes: [
            {
                stroke: "#3f3f46",
                grid: { stroke: "#ffffff05", width: 1 },
                ticks: { show: false },
                font: "10px system-ui",
                space: 60,
                values: (u: uPlot, vals: number[]) =>
                    vals.map(v => {
                        const d = new Date(v * 1000);
                        return d.toLocaleTimeString("es-AR", { hour12: false, hour: "2-digit", minute: "2-digit" });
                    }),
            },
            {
                stroke: "#3f3f46",
                grid: { stroke: "#ffffff03", width: 1 },
                ticks: { show: false },
                font: "10px system-ui",
                incrs: [0.01, 0.02, 0.05, 0.1, 0.2, 0.25, 0.5, 1],
                values: (u: uPlot, vals: number[]) => vals.map(v => Math.round(v * 100) + "%"),
                size: isMobile ? 35 : 55,
                space: 15,
            },
        ],
        series: [
            {
                label: "time",
            },
            {
                label: "obs",
                stroke: "#f59e0b",
                width: 1,
                fill: makeGradient("rgba(245, 158, 11, 0.4)"),
                points: { show: false },
                paths: uPlot.paths.bars!({ size: [0.6, 100], align: 1 }),
                value: (u: uPlot, v: number | null) => (v == null || isNaN(v)) ? "--" : (v * 100).toFixed(2) + "%",
            },
        ],
    };
}

function UPlotChart({
    opts,
    data,
    className,
}: {
    opts: (w: number, h: number) => uPlot.Options;
    data: uPlot.AlignedData;
    className?: string;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<uPlot | null>(null);

    // Size tracking
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        let prevIsMobile = el.clientWidth < 500;

        const ro = new ResizeObserver(() => {
            const w = el.clientWidth;
            const h = el.clientHeight;
            const isMobile = w < 500;

            if (chartRef.current) {
                // If we crossed the mobile/desktop threshold, we must rebuild the chart
                // because uPlot options (like fonts) are static after creation.
                if (isMobile !== prevIsMobile) {
                    prevIsMobile = isMobile;
                    const options = opts(w, h);
                    chartRef.current.destroy();
                    chartRef.current = new uPlot(options, data, el);
                } else {
                    chartRef.current.setSize({ width: w, height: h });
                }
            }
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, [opts, data]);

    // Chart creation
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const w = el.clientWidth || 300;
        const h = el.clientHeight || 200;

        if (chartRef.current) {
            chartRef.current.destroy();
            chartRef.current = null;
        }

        const options = opts(w, h);
        chartRef.current = new uPlot(options, data, el);
        
        return () => {
            chartRef.current?.destroy();
            chartRef.current = null;
        };
        // We INTENTIONALLY don't include `data` here so the chart isn't rebuilt on every tick.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [opts]);

    // Data updates
    useEffect(() => {
        if (chartRef.current) {
            chartRef.current.setData(data);
        }
    }, [data]);

    return <div ref={containerRef} className={className} />;
}

export const NetworkChart = memo(function NetworkChart({ data }: NetworkChartProps) {
    // Convert array-of-objects to columnar format for uPlot
    const processed = useMemo(() => {
        if (!data || data.length === 0) {
            const empty = new Float64Array(0);
            return [empty, empty, empty, empty, empty, empty, empty];
        }

        const len = data.length;
        const tsList = new Float64Array(len);
        const dlList = new Float64Array(len);
        const ulList = new Float64Array(len);
        const latList = new Float64Array(len);
        const lossList = new Float64Array(len);
        const pwrList = new Float64Array(len);
        const obsList = new Float64Array(len);

        for (let i = 0; i < len; i++) {
            const pt = data[i];
            const ts = new Date(pt.timestamp).getTime() / 1000;
            
            tsList[i] = ts || 0;
            dlList[i] = pt.downlink || 0;
            ulList[i] = pt.uplink || 0;
            latList[i] = pt.latency || 0;
            lossList[i] = pt.packet_loss || 0;
            pwrList[i] = pt.power || 0;
            obsList[i] = pt.obstruction || 0;
        }

        return [tsList, dlList, ulList, latList, lossList, pwrList, obsList];
    }, [data]);

    if (!data || data.length === 0) return (
        <div className="flex h-[350px] w-full items-center justify-center rounded-2xl border border-white/5 bg-zinc-900/40 text-zinc-500 backdrop-blur-xl">
            Awaiting Data Signal…
        </div>
    );

    const throughputData: uPlot.AlignedData = [processed[0], processed[1], processed[2]];
    const latencyData: uPlot.AlignedData = [processed[0], processed[3], processed[4]];
    const powerData: uPlot.AlignedData = [processed[0], processed[5]];
    const obstructionData: uPlot.AlignedData = [processed[0], processed[6]];

    return (
        <div className="flex w-full flex-col gap-4">
            {/* Throughput Chart */}
            <div className="group relative w-full rounded-2xl border border-white/5 bg-zinc-900/40 p-6 pb-2 backdrop-blur-xl transition-[border-color] duration-300 hover:border-white/10">
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent rounded-2xl pointer-events-none" />
                <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center justify-between">
                    Ancho de Banda en Tiempo Real
                    <div className="h-[1px] flex-grow ml-4 bg-white/5" />
                </h3>
                <UPlotChart
                    opts={buildThroughputOpts}
                    data={throughputData}
                    className="w-full h-[150px] sm:h-[200px]"
                />
            </div>

            {/* Latency / Packet Loss Chart */}
            <div className="group relative w-full rounded-2xl border border-white/5 bg-zinc-900/40 p-6 pb-2 backdrop-blur-xl transition-[border-color] duration-300 hover:border-white/10">
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent rounded-2xl pointer-events-none" />
                <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center justify-between">
                    Latencia / Pérdida de Paquetes
                    <div className="h-[1px] flex-grow ml-4 bg-white/5" />
                </h3>
                <UPlotChart
                    opts={buildLatencyOpts}
                    data={latencyData}
                    className="w-full h-[130px] sm:h-[160px]"
                />
            </div>

            {/* Power Chart */}
            <div className="group relative w-full rounded-2xl border border-white/5 bg-zinc-900/40 p-6 pb-2 backdrop-blur-xl transition-[border-color] duration-300 hover:border-white/10">
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent rounded-2xl pointer-events-none" />
                <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center justify-between">
                    Consumo Eléctrico
                    <div className="h-[1px] flex-grow ml-4 bg-white/5" />
                </h3>
                <UPlotChart
                    opts={buildPowerOpts}
                    data={powerData}
                    className="w-full h-[120px] sm:h-[150px]"
                />
            </div>

            {/* Obstruction Chart */}
            <div className="group relative w-full rounded-2xl border border-white/5 bg-zinc-900/40 p-6 pb-2 backdrop-blur-xl transition-[border-color] duration-300 hover:border-white/10">
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent rounded-2xl pointer-events-none" />
                <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center justify-between">
                    Historial de Obstrucciones
                    <div className="h-[1px] flex-grow ml-4 bg-white/5" />
                </h3>
                <UPlotChart
                    opts={buildObstructionOpts}
                    data={obstructionData}
                    className="w-full h-[100px] sm:h-[120px]"
                />
            </div>
        </div>
    );
});
