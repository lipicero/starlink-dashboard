import { Alert } from "../types";
import { cn } from "../lib/utils";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";

interface AlertBannerProps {
    alerts: Alert[];
}

export function AlertBanner({ alerts }: AlertBannerProps) {
    if (!alerts || alerts.length === 0) return null;

    return (
        <div className="flex w-full flex-col gap-3" aria-live="polite">
            {alerts.map((alert) => (
                <div
                    key={alert.id}
                    className={cn(
                        "relative group flex items-center gap-3 rounded-2xl border p-4 text-sm font-bold tracking-tight overflow-hidden transition-all duration-300",
                        {
                            "border-red-500/20 bg-red-500/5 text-red-100 shadow-[0_0_20px_-10px_rgba(239,68,68,0.5)]": alert.level === "error",
                            "border-yellow-500/20 bg-yellow-500/5 text-yellow-100 shadow-[0_0_20px_-10px_rgba(234,179,8,0.5)]": alert.level === "warning",
                            "border-blue-500/20 bg-blue-500/5 text-blue-100 shadow-[0_0_20px_-10px_rgba(59,130,246,0.5)]": alert.level === "info",
                        }
                    )}
                >
                    {/* Animated side accent */}
                    <div className={cn(
                        "absolute left-0 top-0 bottom-0 w-1",
                        {
                            "bg-red-500": alert.level === "error",
                            "bg-yellow-500": alert.level === "warning",
                            "bg-blue-500": alert.level === "info",
                        }
                    )} />

                    <div className={cn(
                        "rounded-full p-2",
                        {
                            "bg-red-500/10": alert.level === "error",
                            "bg-yellow-500/10": alert.level === "warning",
                            "bg-blue-500/10": alert.level === "info",
                        }
                    )}>
                        {alert.level === "error" ? <AlertCircle aria-hidden="true" className="h-4 w-4 text-red-500" /> : null}
                        {alert.level === "warning" ? <AlertTriangle aria-hidden="true" className="h-4 w-4 text-yellow-500" /> : null}
                        {alert.level === "info" ? <Info aria-hidden="true" className="h-4 w-4 text-blue-500" /> : null}
                    </div>

                    <span>{alert.message}</span>
                </div>
            ))}
        </div>
    );
}
