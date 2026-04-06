"use client";

import { memo, useRef, useEffect, useState } from "react";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";

interface NetworkChartProps {
    data: { timestamp: string; downlink: number; uplink: number; latency: number; packet_loss: number; power: number }[];
}

function makeGradient(ctx: CanvasRenderingContext2D, color: string, height: number): CanvasGradient {
    const h = Number.isFinite(height) && height > 0 ? height : 300;
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, color + "4D"); // 30% opacity
    grad.addColorStop(1, color + "00"); // 0% opacity
    return grad;
}

function buildThroughputOpts(width: number, height: number): uPlot.Options {
    return {
        width,
        height,
        cursor: { show: true, drag: { x: false, y: false } },
        select: { show: false, left: 0, top: 0, width: 0, height: 0 },
        legend: { show: true, live: true },
        axes: [
            {
                stroke: "#52525b",
                grid: { stroke: "#ffffff08", width: 1 },
                ticks: { show: false },
                font: "10px system-ui",
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
                incrs: [10, 20, 50, 100, 150, 200, 250, 300, 500],
                values: (u: uPlot, vals: number[]) => vals.map(v => Math.round(v) + " Mbps"),
                size: 55,
                space: 30,
            },
        ],
        scales: {
            y: { auto: true, range: (u: uPlot, min: number, max: number) => [0, Math.max(20, max * 1.1)] },
        },
        series: [
            {},
            {
                label: "Downlink",
                stroke: "#3b82f6",
                width: 2,
                fill: (u: uPlot) => makeGradient(u.ctx, "#3b82f6", u.height),
                value: (u: uPlot, v: number | null) => v == null ? "--" : Math.round(v) + " Mbps",
            },
            {
                label: "Uplink",
                stroke: "#8b5cf6",
                width: 2,
                fill: (u: uPlot) => makeGradient(u.ctx, "#8b5cf6", u.height),
                value: (u: uPlot, v: number | null) => v == null ? "--" : Math.round(v) + " Mbps",
            },
        ],
    };
}

function buildLatencyOpts(width: number, height: number): uPlot.Options {
    return {
        width,
        height,
        cursor: { show: true, drag: { x: false, y: false } },
        select: { show: false, left: 0, top: 0, width: 0, height: 0 },
        legend: { show: true, live: true },
        axes: [
            {
                stroke: "#52525b",
                grid: { stroke: "#ffffff08", width: 1 },
                ticks: { show: false },
                font: "10px system-ui",
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
                incrs: [1, 5, 10, 20, 50, 100, 150, 200],
                values: (u: uPlot, vals: number[]) => vals.map(v => Math.round(v) + " ms"),
                size: 50,
                space: 30,
            },
            {
                side: 1,
                stroke: "#ef4444a0",
                grid: { show: false },
                ticks: { show: false },
                font: "10px system-ui",
                incrs: [0.1, 0.25, 0.5, 1],
                values: (u: uPlot, vals: number[]) => vals.map(v => Math.round(v * 100) + "%"),
                size: 40,
                scale: "loss",
                space: 20,
            },
        ],
        scales: {
            y: { auto: true, range: (u: uPlot, min: number, max: number) => [0, Math.max(100, max * 1.1)] },
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
                value: (u: uPlot, v: number | null) => v == null ? "--" : Math.round(v) + " ms",
            },
            {
                label: "Pérdida",
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
    return {
        width,
        height,
        cursor: { show: true, drag: { x: false, y: false } },
        select: { show: false, left: 0, top: 0, width: 0, height: 0 },
        legend: { show: true, live: true },
        scales: {
            y: { auto: true, range: (u, min, max) => [0, Math.max(80, max * 1.1)] },
        },
        axes: [
            {
                stroke: "#52525b",
                grid: { stroke: "#ffffff08", width: 1 },
                ticks: { show: false },
                font: "10px system-ui",
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
                incrs: [10, 20, 50, 100],
                values: (u: uPlot, vals: number[]) => vals.map(v => Math.round(v) + " W"),
                size: 55,
                space: 30,
            },
        ],
        series: [
            {},
            {
                label: "Potencia",
                stroke: "#ef4444",
                width: 2,
                fill: (u: uPlot) => makeGradient(u.ctx, "#ef4444", u.height),
                paths: uPlot.paths?.stepped?.({ align: 1 }) || undefined,
                value: (u: uPlot, v: number | null) => v == null ? "--" : Math.round(v) + " W",
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

        if (chartRef.current) {
            chartRef.current.setData(data);
        } else {
            const options = opts(w, h);
            chartRef.current = new uPlot(options, data, el);
        }
    }, [data, opts]);

    // Cleanup
    useEffect(() => {
        return () => {
            chartRef.current?.destroy();
            chartRef.current = null;
        };
    }, []);

    return <div ref={containerRef} className={className} />;
}

export const NetworkChart = memo(function NetworkChart({ data }: NetworkChartProps) {
    if (!data || data.length === 0) return (
        <div className="flex h-[350px] w-full items-center justify-center rounded-2xl border border-white/5 bg-zinc-900/40 text-zinc-500 backdrop-blur-xl">
            Awaiting Data Signal…
        </div>
    );

    // Convert array-of-objects to columnar format for uPlot
    const timestamps = new Float64Array(data.length);
    const downlink = new Float64Array(data.length);
    const uplink = new Float64Array(data.length);
    const latency = new Float64Array(data.length);
    const packetLoss = new Float64Array(data.length);
    const power = new Float64Array(data.length);

    for (let i = 0; i < data.length; i++) {
        timestamps[i] = new Date(data[i].timestamp).getTime() / 1000; // uPlot uses seconds
        downlink[i] = data[i].downlink;
        uplink[i] = data[i].uplink;
        latency[i] = data[i].latency;
        packetLoss[i] = data[i].packet_loss;
        power[i] = data[i].power;
    }

    const throughputData: uPlot.AlignedData = [timestamps, downlink, uplink];
    const latencyData: uPlot.AlignedData = [timestamps, latency, packetLoss];
    const powerData: uPlot.AlignedData = [timestamps, power];

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
                    className="w-full h-[180px]"
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
                    className="w-full h-[140px]"
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
                    className="w-full h-[140px]"
                />
            </div>
        </div>
    );
});
