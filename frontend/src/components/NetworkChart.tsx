"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";

interface NetworkChartProps {
    data: { timestamp: string; downlink: number; uplink: number; latency: number }[];
}

export function NetworkChart({ data }: NetworkChartProps) {
    if (!data || data.length === 0) return (
        <div className="flex h-[350px] w-full items-center justify-center rounded-xl border border-white/5 bg-white/5 text-zinc-500">
            Sin Datos
        </div>
    );

    return (
        <div className="flex w-full flex-col gap-4">
            {/* Throughput Chart */}
            <div className="h-[250px] w-full rounded-xl border border-white/5 bg-white/5 p-4 backdrop-blur-sm">
                <h3 className="mb-4 text-sm font-medium text-zinc-400">Ancho de Banda</h3>
                <div className="h-[180px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorDownlink" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorUplink" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                            <XAxis dataKey="timestamp" hide />
                            <YAxis 
                                stroke="#71717a" 
                                fontSize={10} 
                                tickFormatter={(val) => `${val.toFixed(0)} Mbps`} 
                                axisLine={false}
                                tickLine={false}
                                width={55}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                                itemStyle={{ fontSize: "12px", color: "#e4e4e7" }}
                                labelStyle={{ display: "none" }}
                                formatter={(value: any) => [`${typeof value === 'number' ? value.toFixed(1) : value} Mbps`]}
                            />
                            <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", color: "#a1a1aa", paddingTop: "5px" }} />
                            <Area
                                type="monotone"
                                dataKey="downlink"
                                stroke="#0ea5e9"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorDownlink)"
                                name="Descarga"
                                isAnimationActive={false}
                            />
                            <Area
                                type="monotone"
                                dataKey="uplink"
                                stroke="#8b5cf6"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorUplink)"
                                name="Subida"
                                isAnimationActive={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Latency Chart */}
            <div className="h-[200px] w-full rounded-xl border border-white/5 bg-white/5 p-4 backdrop-blur-sm">
                <h3 className="mb-4 text-sm font-medium text-zinc-400">Latencia</h3>
                <div className="h-[130px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#eab308" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                            <XAxis dataKey="timestamp" hide />
                            <YAxis 
                                stroke="#71717a" 
                                fontSize={10} 
                                tickFormatter={(val) => `${val.toFixed(0)} ms`}
                                type="number"
                                domain={['auto', 'auto']}
                                axisLine={false}
                                tickLine={false}
                                width={55}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                                itemStyle={{ fontSize: "12px", color: "#e4e4e7" }}
                                labelStyle={{ display: "none" }}
                                formatter={(value: any) => [`${typeof value === 'number' ? value.toFixed(0) : value} ms`]}
                            />
                            <Area
                                type="monotone"
                                dataKey="latency"
                                stroke="#eab308"
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
        </div>
    );
}
