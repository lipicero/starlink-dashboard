"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface NetworkChartProps {
    data: { timestamp: string; downlink: number; latency: number }[];
}

export function NetworkChart({ data }: NetworkChartProps) {
    if (!data || data.length === 0) return (
        <div className="flex h-[200px] w-full items-center justify-center rounded-xl border border-white/5 bg-white/5 text-zinc-500">
            No Data
        </div>
    );

    return (
        <div className="h-[250px] w-full rounded-xl border border-white/5 bg-white/5 p-4 backdrop-blur-sm">
            <h3 className="mb-4 text-sm font-medium text-zinc-400">Network Performance (Real-time)</h3>
            <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorDownlink" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#eab308" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis dataKey="timestamp" hide />
                        <YAxis yAxisId="left" stroke="#888" fontSize={10} tickFormatter={(val) => `${val} Mb`} />
                        <YAxis yAxisId="right" orientation="right" stroke="#888" fontSize={10} tickFormatter={(val) => `${val} ms`} />
                        <Tooltip
                            contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "8px" }}
                            itemStyle={{ fontSize: "12px" }}
                            labelStyle={{ display: "none" }}
                        />
                        <Area
                            yAxisId="left"
                            type="monotone"
                            dataKey="downlink"
                            stroke="#0ea5e9"
                            fillOpacity={1}
                            fill="url(#colorDownlink)"
                            name="Downlink"
                            isAnimationActive={false}
                        />
                        <Area
                            yAxisId="right"
                            type="monotone"
                            dataKey="latency"
                            stroke="#eab308"
                            fillOpacity={1}
                            fill="url(#colorLatency)"
                            name="Latency"
                            isAnimationActive={false}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
