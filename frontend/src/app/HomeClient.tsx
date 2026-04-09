"use client";

import { useState, useRef, useEffect } from "react";
import { Dashboard } from "../components/Dashboard";
import { useSocket } from "../hooks/useSocket";
import { StatusSnapshot } from "../types";

interface HomeClientProps {
  initialStatus: StatusSnapshot | null;
  initialHistory: { timestamp: string; downlink: number; uplink: number; latency: number; power: number; packet_loss: number; obstruction: number }[];
}

export default function HomeClient({ initialStatus, initialHistory }: HomeClientProps) {
  const { isConnected, data } = useSocket();
  const [lastProcessedData, setLastProcessedData] = useState<StatusSnapshot | null>(null);

  // Usar una referencia para el historial completo para evitar re-renders constantes
  // y copias pesadas del array en el ciclo de vida de React
  const historyRef = useRef(initialHistory);
  const [displayHistory, setDisplayHistory] = useState(initialHistory);
  const lastUpdateRef = useRef(Date.now());

  useEffect(() => {
    // Cargar historial completo en segundo plano para no bloquear el renderizado inicial
    const fetchFullHistory = async () => {
      try {
        const apiHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || `http://${apiHost}:4000`;
        const url = `${apiUrl}/api/history?limit=86400`;
        const res = await fetch(url);
        if (res.ok) {
          const fullHistory = await res.json();
          
          // Fusionar con lo que ya tenemos (pueden haber llegado puntos nuevos por socket)
          const existingTimestamps = new Set(historyRef.current.map(p => p.timestamp));
          const newPointsFromHistory = fullHistory.filter((p: any) => !existingTimestamps.has(p.timestamp));
          
          const combined = [...newPointsFromHistory, ...historyRef.current].sort((a, b) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );

          // Limitar a las últimas 24hs
          const finalHistory = combined.slice(-86400);
          historyRef.current = finalHistory;
          setDisplayHistory([...finalHistory]);
        }
      } catch (e) {
        console.error("Error al cargar historial completo:", e);
      }
    };

    fetchFullHistory();
  }, []);

  // Usar el estado inicial del servidor si no ha llegado el primer mensaje de socket
  const currentStatus = data || initialStatus;

  // Derivar historial con nuevos datos por WebSocket sin usar useEffect
  if (data && data !== lastProcessedData) {
    setLastProcessedData(data);
    
    // Evitar duplicados por timestamp
    const lastPoint = historyRef.current[historyRef.current.length - 1];
    if (!lastPoint || lastPoint.timestamp !== data.timestamp) {
      const newPoint = {
        timestamp: data.timestamp,
        downlink: data.network?.downlink_mbps || 0,
        uplink: data.network?.uplink_mbps || 0,
        latency: data.network?.latency_ms || 0,
        packet_loss: data.network?.packet_loss || 0,
        power: data.health?.power_w || 0,
        obstruction: data.service?.obstruction_fraction || 0
      };

      historyRef.current.push(newPoint);
      
      // Mantener el límite de 86400 puntos (24 horas)
      if (historyRef.current.length > 86400) {
        historyRef.current.shift();
      }

      // Throttling: Solo actualizar el estado de React cada 2 segundos
      // Esto libera al hilo principal de procesar props y charts constantemente
      const now = Date.now();
      if (now - lastUpdateRef.current > 2000) {
        setDisplayHistory([...historyRef.current]);
        lastUpdateRef.current = now;
      }
    }
  }

  return <Dashboard status={currentStatus} history={displayHistory} isConnected={isConnected} />;
}
