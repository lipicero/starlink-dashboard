"use client";

import { memo, useState, useEffect, useRef } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import type { ValueType } from "recharts/types/component/DefaultTooltipContent";

interface NetworkChartProps {
    data: { timestamp: string; downlink: number; uplink: number; latency: number }[];
}

const CHART_MARGINS = { top: 5, right: 0, left: -20, bottom: 0 };

export const NetworkChart = memo(function NetworkChart({ data }: NetworkChartProps) {
    const [isHovering, setIsHovering] = useState(false);
    const [prevData, setPrevData] = useState(data);
    const [displayData, setDisplayData] = useState(data);
    const chartRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            if (chartRef.current && !chartRef.current.contains(event.target as Node)) {
                setIsHovering(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, []);

    // deriving state during render ("You might not need an effect" tip)
    if (data !== prevData) {
        setPrevData(data);
        if (!isHovering) {
            setDisplayData(data);
        }
    }

    if (!displayData || displayData.length === 0) return (
        <div className="flex h-[350px] w-full items-center justify-center rounded-2xl border border-white/5 bg-zinc-900/40 text-zinc-500 backdrop-blur-xl">
            Awaiting Data Signal…
        </div>
    );

    return (
        <div 
            ref={chartRef}
            className="flex w-full flex-col gap-4 touch-pan-y"
            style={{ touchAction: 'pan-y' }}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onTouchStart={() => setIsHovering(true)}
        >
            {/* Throughput Chart */}
            <div className="group relative h-[280px] w-full rounded-2xl border border-white/5 bg-zinc-900/40 p-6 backdrop-blur-xl transition-[border-color] duration-300 hover:border-white/10">
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent rounded-2xl pointer-events-none" />
                <h3 className="mb-6 text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center justify-between">
                    Ancho de Banda en Tiempo Real
                    <div className="h-[1px] flex-grow ml-4 bg-white/5" />
                </h3>
                <div className="h-[180px] w-full">
                    <ResponsiveContainer width="100%" height="100%" debounce={150}>
                        <AreaChart data={displayData} margin={CHART_MARGINS}>
                            <defs>
                                <linearGradient id="colorDownlink" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorUplink" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="0" stroke="#ffffff03" vertical={false} />
                            <XAxis dataKey="timestamp" hide />
                            <YAxis
                                stroke="#52525b"
                                fontSize={10}
                                style={{ fontVariantNumeric: 'tabular-nums' }}
                                tickFormatter={(val) => `${val.toFixed(0)}`}
                                domain={[0, (dataMax: number) => Math.max(50, Math.ceil(dataMax / 50) * 50)]}
                                axisLine={false}
                                tickLine={false}
                                width={55}
                            />
                            {isHovering && (
                                <Tooltip
                                    contentStyle={{ backgroundColor: "#09090b", borderColor: "rgba(255,255,255,0.1)", borderRadius: "12px", fontSize: "12px", backdropFilter: "blur(8px)" }}
                                    cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }}
                                    itemStyle={{ color: "#e4e4e7" }}
                                    formatter={(value: ValueType | undefined) => {
                                        if (value == null) return ["No data"];
                                        return [`${typeof value === 'number' ? value.toFixed(1) : value} Mbps`];
                                    }}
                                />
                            )}
                            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "10px", fontWeight: "bold", color: "#71717a", textTransform: "uppercase", letterSpacing: "0.1em", paddingTop: "15px" }} />
                            <Area
                                type="linear"
                                dataKey="downlink"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorDownlink)"
                                name="Downlink"
                                isAnimationActive={false}
                            />
                            <Area
                                type="linear"
                                dataKey="uplink"
                                stroke="#8b5cf6"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorUplink)"
                                name="Uplink"
                                isAnimationActive={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Latency Chart */}
            <div className="group relative h-[220px] w-full rounded-2xl border border-white/5 bg-zinc-900/40 p-6 backdrop-blur-xl transition-[border-color] duration-300 hover:border-white/10">
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent rounded-2xl pointer-events-none" />
                <h3 className="mb-6 text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center justify-between">
                    Latencia
                    <div className="h-[1px] flex-grow ml-4 bg-white/5" />
                </h3>
                <div className="h-[130px] w-full">
                    <ResponsiveContainer width="100%" height="100%" debounce={150}>
                        <AreaChart data={displayData} margin={CHART_MARGINS}>
                            <defs>
                                <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="0" stroke="#ffffff03" vertical={false} />
                            <XAxis dataKey="timestamp" hide />
                            <YAxis
                                stroke="#52525b"
                                fontSize={10}
                                style={{ fontVariantNumeric: 'tabular-nums' }}
                                tickFormatter={(val) => `${val.toFixed(0)}`}
                                domain={[0, (dataMax: number) => Math.max(100, Math.ceil(dataMax / 20) * 20)]}
                                axisLine={false}
                                tickLine={false}
                                width={55}
                            />
                            {isHovering && (
                                <Tooltip
                                    contentStyle={{ backgroundColor: "#09090b", borderColor: "rgba(255,255,255,0.1)", borderRadius: "12px", fontSize: "12px", backdropFilter: "blur(8px)" }}
                                    cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }}
                                    itemStyle={{ color: "#e4e4e7" }}
                                    formatter={(value: ValueType | undefined) => {
                                        if (value == null) return ["No data"];
                                        return [`${typeof value === 'number' ? value.toFixed(0) : value} ms`];
                                    }}
                                />
                            )}
                            <Area
                                type="linear"
                                dataKey="latency"
                                stroke="#f59e0b"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorLatency)"
                                name="Ping"
                                isAnimationActive={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Power Chart */}
            <div className="group relative h-[180px] w-full rounded-2xl border border-white/5 bg-zinc-900/40 p-6 backdrop-blur-xl transition-[border-color] duration-300 hover:border-white/10">
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent rounded-2xl pointer-events-none" />
                <h3 className="mb-6 text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center justify-between">
                    Consumo Eléctrico
                    <div className="h-[1px] flex-grow ml-4 bg-white/5" />
                </h3>
                <div className="h-[90px] w-full">
                    <ResponsiveContainer width="100%" height="100%" debounce={150}>
                        <AreaChart data={displayData} margin={CHART_MARGINS}>
                            <defs>
                                <linearGradient id="colorPower" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="0" stroke="#ffffff03" vertical={false} />
                            <XAxis dataKey="timestamp" hide />
                            <YAxis
                                stroke="#52525b"
                                fontSize={10}
                                style={{ fontVariantNumeric: 'tabular-nums' }}
                                tickFormatter={(val) => `${val.toFixed(0)}`}
                                domain={[0, (dataMax: number) => Math.max(70, Math.ceil(dataMax / 10) * 10)]}
                                axisLine={false}
                                tickLine={false}
                                width={55}
                            />
                            {isHovering && (
                                <Tooltip
                                    contentStyle={{ backgroundColor: "#09090b", borderColor: "rgba(255,255,255,0.1)", borderRadius: "12px", fontSize: "12px", backdropFilter: "blur(8px)" }}
                                    cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }}
                                    itemStyle={{ color: "#e4e4e7" }}
                                    formatter={(value: ValueType | undefined) => {
                                        if (value == null) return ["No data"];
                                        return [`${typeof value === 'number' ? value.toFixed(1) : value} W`];
                                    }}
                                />
                            )}
                            <Area
                                type="stepAfter"
                                dataKey="power"
                                stroke="#ef4444"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorPower)"
                                name="Potencia"
                                isAnimationActive={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
});
