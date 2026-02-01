import { cn } from "../lib/utils";

interface StatusCardProps {
    label: string;
    value: string | number;
    unit?: string;
    icon?: React.ReactNode;
    className?: string;
    trend?: "up" | "down" | "neutral";
}

export function StatusCard({ label, value, unit, icon, className }: StatusCardProps) {
    return (
        <div className={cn("rounded-xl border border-white/5 bg-white/5 p-4 backdrop-blur-sm", className)}>
            <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">{label}</span>
                {icon && <div className="text-zinc-500">{icon}</div>}
            </div>
            <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-bold tracking-tight text-white">{value}</span>
                {unit && <span className="text-sm text-zinc-500">{unit}</span>}
            </div>
        </div>
    );
}
