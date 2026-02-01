import { Alert } from "../types";
import { cn } from "../lib/utils";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";

interface AlertBannerProps {
    alerts: Alert[];
}

export function AlertBanner({ alerts }: AlertBannerProps) {
    if (!alerts || alerts.length === 0) return null;

    return (
        <div className="flex w-full flex-col gap-2">
            {alerts.map((alert) => (
                <div
                    key={alert.id}
                    className={cn(
                        "flex items-center gap-2 rounded-md border p-3 text-sm font-medium",
                        {
                            "border-red-900/50 bg-red-900/20 text-red-200": alert.level === "error",
                            "border-yellow-900/50 bg-yellow-900/20 text-yellow-200": alert.level === "warning",
                            "border-blue-900/50 bg-blue-900/20 text-blue-200": alert.level === "info",
                        }
                    )}
                >
                    {alert.level === "error" && <AlertCircle className="h-4 w-4" />}
                    {alert.level === "warning" && <AlertTriangle className="h-4 w-4" />}
                    {alert.level === "info" && <Info className="h-4 w-4" />}

                    <span>{alert.message}</span>
                </div>
            ))}
        </div>
    );
}
