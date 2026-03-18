"use client";

import { useState } from "react";
import { Dashboard } from "../components/Dashboard";
import { useSocket } from "../hooks/useSocket";
import { StatusSnapshot } from "../types";

interface HomeClientProps {
  initialStatus: StatusSnapshot | null;
  initialHistory: { timestamp: string; downlink: number; uplink: number; latency: number; power: number }[];
}

export default function HomeClient({ initialStatus, initialHistory }: HomeClientProps) {
  const { isConnected, data } = useSocket();
  const [history, setHistory] = useState(initialHistory);
  const [lastProcessedData, setLastProcessedData] = useState<StatusSnapshot | null>(null);
  
  // Usar el estado inicial del servidor si no ha llegado el primer mensaje de socket
  const currentStatus = data || initialStatus;

  // Derivar historial con nuevos datos por WebSocket sin usar useEffect
  if (data && data !== lastProcessedData) {
      setLastProcessedData(data);
      setHistory(prev => {
        // Evitar duplicados por timestamp
        if (prev.length > 0 && prev[prev.length - 1].timestamp === data.timestamp) {
          return prev;
        }

        const newPoint = {
          timestamp: data.timestamp,
          downlink: data.network?.downlink_mbps || 0,
          uplink: data.network?.uplink_mbps || 0,
          latency: data.network?.latency_ms || 0,
          power: data.health?.power_w || 0
        };

        const newHistory = [...prev, newPoint];
        // Mantener el límite de 720 puntos
        return newHistory.length > 720 ? newHistory.slice(-720) : newHistory;
      });
  }

  return <Dashboard status={currentStatus} history={history} isConnected={isConnected} />;
}
