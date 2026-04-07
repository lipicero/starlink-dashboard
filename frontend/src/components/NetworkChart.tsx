"use client";

import { memo, useRef, useEffect, useState, useMemo } from "react";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";

interface NetworkChartProps {
    data: { timestamp: string; downlink: number; uplink: number; latency: number; packet_loss: number; power: number; obstruction: number }[];
}

function makeGradient(ctx: CanvasRenderingContext2D, color: string, height: number): CanvasGradient {
    const h = Number.isFinite(height) && height > 0 ? height : 300;
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, color + "4D"); // 30% opacity
    grad.addColorStop(1, color + "00"); // 0% opacity
    return grad;
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
        axes: [
            {
                stroke: "#52525b",
                grid: { stroke: "#ffffff08", width: 1 },
                ticks: { show: false },
                font: "10px system-ui",
                space: isMobile ? 60 : 40,
                values: (u: uPlot, vals: number[]) =>
                    vals.map(v => {
                        const d = new Date(v * 1000);
                        return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
                    }),
            },
            {
                stroke: "#71717a",
                grid: { stroke: "#ffffff05", width: 1 },
                ticks: { show: false },
                font: "10px system-ui",
                incrs: [1, 2, 5, 10, 20, 25, 40, 50, 60, 80, 100, 120, 150, 200, 250, 300, 500],
                values: (u: uPlot, vals: number[]) => vals.map(v => Math.round(v) + (isMobile ? "" : " Mbps")),
                size: isMobile ? 40 : 60,
                space: 15,
            },
        ],
        scales: {
            y: { auto: true, range: (u, min, max) => [0, Math.max(30, Math.ceil(max / 10) * 10 + 10)] },
        },
        series: [
            {},
            {
                label: "Down",
                stroke: "#3b82f6",
                width: 2,
                fill: (u: uPlot) => makeGradient(u.ctx, "#3b82f6", u.height),
                value: (u: uPlot, v: number | null) => v == null ? "--" : Math.round(v) + " Mb",
            },
            {
                label: "Up",
                stroke: "#8b5cf6",
                width: 2,
                fill: (u: uPlot) => makeGradient(u.ctx, "#8b5cf6", u.height),
                value: (u: uPlot, v: number | null) => v == null ? "--" : Math.round(v) + " Mb",
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
        axes: [
            {
                stroke: "#52525b",
                grid: { stroke: "#ffffff08", width: 1 },
                ticks: { show: false },
                font: "10px system-ui",
                space: isMobile ? 60 : 40,
                values: (u: uPlot, vals: number[]) =>
                    vals.map(v => {
                        const d = new Date(v * 1000);
                        return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
                    }),
            },
            {
                stroke: "#71717a",
                grid: { stroke: "#ffffff05", width: 1 },
                ticks: { show: false },
                font: "10px system-ui",
                incrs: [1, 2, 5, 10, 15, 20, 25, 30, 40, 50, 75, 100, 150, 200, 250, 500],
                values: (u: uPlot, vals: number[]) => vals.map(v => Math.round(v) + (isMobile ? "" : " ms")),
                size: isMobile ? 35 : 55,
                space: 15,
            },
            {
                side: 1,
                stroke: "#ef4444a0",
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
            {},
            {
                label: "Ping",
                stroke: "#f59e0b",
                width: 2,
                fill: (u: uPlot) => makeGradient(u.ctx, "#f59e0b", u.height),
                scale: "y",
                value: (u: uPlot, v: number | null) => v == null ? "--" : Math.round(v) + "ms",
            },
            {
                label: "Loss",
                stroke: "#ef4444",
                width: 2,
                fill: (u: uPlot) => makeGradient(u.ctx, "#ef4444", u.height),
                scale: "loss",
                paths: uPlot.paths?.stepped?.({ align: 1 }) || undefined,
                value: (u: uPlot, v: number | null) => v == null ? "--" : Math.round(v * 100) + "%",
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
        scales: {
            y: { auto: true, range: (u, min, max) => [0, Math.max(80, Math.ceil(max / 10) * 10 + 10)] },
        },
        axes: [
            {
                stroke: "#52525b",
                grid: { stroke: "#ffffff08", width: 1 },
                ticks: { show: false },
                font: "10px system-ui",
                space: isMobile ? 60 : 40,
                values: (u: uPlot, vals: number[]) =>
                    vals.map(v => {
                        const d = new Date(v * 1000);
                        return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
                    }),
            },
            {
                stroke: "#71717a",
                grid: { stroke: "#ffffff05", width: 1 },
                ticks: { show: false },
                font: "10px system-ui",
                incrs: [1, 2, 5, 8, 10, 15, 20, 25, 30, 40, 50, 75, 100],
                values: (u: uPlot, vals: number[]) => vals.map(v => Math.round(v) + (isMobile ? "" : " W")),
                size: isMobile ? 35 : 55,
                space: 15,
            },
        ],
        series: [
            {},
            {
                label: "Pwr",
                stroke: "#ef4444",
                width: 2,
                fill: (u: uPlot) => makeGradient(u.ctx, "#ef4444", u.height),
                paths: uPlot.paths?.stepped?.({ align: 1 }) || undefined,
                value: (u: uPlot, v: number | null) => v == null ? "--" : Math.round(v) + " W",
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
        scales: {
            y: { auto: false, range: [0, 1] },
        },
        axes: [
            {
                stroke: "#52525b",
                grid: { stroke: "#ffffff08", width: 1 },
                ticks: { show: false },
                font: "10px system-ui",
                space: isMobile ? 60 : 40,
                values: (u: uPlot, vals: number[]) =>
                    vals.map(v => {
                        const d = new Date(v * 1000);
                        return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
                    }),
            },
            {
                stroke: "#71717a",
                grid: { stroke: "#ffffff05", width: 1 },
                ticks: { show: false },
                font: "10px system-ui",
                incrs: [0.01, 0.02, 0.05, 0.1, 0.2, 0.25, 0.5, 1],
                values: (u: uPlot, vals: number[]) => vals.map(v => Math.round(v * 100) + "%"),
                size: isMobile ? 35 : 55,
                space: 15,
            },
        ],
        series: [
            {},
            {
                label: "Obs",
                stroke: "#f59e0b",
                width: 2,
                fill: (u: uPlot) => makeGradient(u.ctx, "#f59e0b", u.height),
                value: (u: uPlot, v: number | null) => v == null ? "--" : (v * 100).toFixed(2) + "%",
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

        const ro = new ResizeObserver(() => {
            const w = el.clientWidth;
            const h = el.clientHeight;
            // Force recreation on significant width change to update mobile/desktop options
            if (chartRef.current) {
                chartRef.current.setSize({ width: w, height: h });
            }
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    // Chart creation & data update
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const w = el.clientWidth || 300;
        const h = el.clientHeight || 200;

        // uPlot doesn't support live option updates for axes/scales.
        // We must destroy and recreate to apply new scale logic or axis space.
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
    }, [data, opts]); // Recreates on data or opts change

    return <div ref={containerRef} className={className} />;
}

export const NetworkChart = memo(function NetworkChart({ data }: NetworkChartProps) {
    if (!data || data.length === 0) return (
        <div className="flex h-[350px] w-full items-center justify-center rounded-2xl border border-white/5 bg-zinc-900/40 text-zinc-500 backdrop-blur-xl">
            Awaiting Data Signal…
        </div>
    );

    // Convert array-of-objects to columnar format for uPlot and detect gaps
    const processed = useMemo(() => {
        const tsList = [];
        const dlList = [];
        const ulList = [];
        const latList = [];
        const lossList = [];
        const pwrList = [];
        const obsList = [];

        for (let i = 0; i < data.length; i++) {
            const currentTs = new Date(data[i].timestamp).getTime() / 1000;
            
            // If there's a gap > 10s, insert a NaN point to break the line
            if (i > 0) {
                const prevTs = new Date(data[i-1].timestamp).getTime() / 1000;
                if (currentTs - prevTs > 10) {
                    tsList.push(prevTs + 0.1); // Small offset
                    dlList.push(NaN);
                    ulList.push(NaN);
                    latList.push(NaN);
                    lossList.push(NaN);
                    pwrList.push(NaN);
                    obsList.push(NaN);
                }
            }

            tsList.push(currentTs);
            dlList.push(data[i].downlink);
            ulList.push(data[i].uplink);
            latList.push(data[i].latency);
            lossList.push(data[i].packet_loss);
            pwrList.push(data[i].power);
            obsList.push(data[i].obstruction);
        }

        return [
            new Float64Array(tsList),
            new Float64Array(dlList),
            new Float64Array(ulList),
            new Float64Array(latList),
            new Float64Array(lossList),
            new Float64Array(pwrList),
            new Float64Array(obsList)
        ];
    }, [data]);

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
                    className="w-full h-[200px]"
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
                    className="w-full h-[160px]"
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
                    className="w-full h-[150px]"
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
                    className="w-full h-[120px]"
                />
            </div>
        </div>
    );
});
