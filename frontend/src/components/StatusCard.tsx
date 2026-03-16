import { memo } from "react";
import { cn } from "../lib/utils";

interface StatusCardProps {
    label: string;
    value: string | number;
    unit?: string;
    icon?: React.ReactNode;
    className?: string;
    trend?: "up" | "down" | "neutral";
    children?: React.ReactNode;
}

export const StatusCard = memo(function StatusCard({ label, value, unit, icon, className, children }: StatusCardProps) {
    return (
        <div className={cn(
            "group relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/40 p-5 backdrop-blur-md transition-[border-color,background-color,box-shadow] duration-300 hover:border-white/20 hover:bg-zinc-900/60 hover:shadow-[0_0_30px_-10px_rgba(255,255,255,0.1)]",
            className
        )}>
            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 group-hover:text-zinc-400 transition-colors">{label}</span>
                    {icon ? (
                        <div aria-hidden="true" className="rounded-lg bg-white/5 p-2 text-zinc-400 group-hover:bg-white/10 group-hover:text-white transition-all duration-300">
                            {icon}
                        </div>
                    ) : null}
                </div>
                <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black tracking-tighter text-white group-hover:scale-[1.02] transition-transform origin-left duration-300 [font-variant-numeric:tabular-nums]">{value}</span>
                    {unit ? <span className="text-sm font-medium text-zinc-600 group-hover:text-zinc-500 transition-colors">{unit}</span> : null}
                </div>
                {children}
            </div>
        </div>
    );
});
