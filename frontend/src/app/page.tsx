"use client";

import { useEffect, useState } from "react";
import { Dashboard } from "../components/Dashboard";
import { useSocket } from "../hooks/useSocket";
import { StatusSnapshot } from "../types";

export default function Home() {
  const { isConnected, data } = useSocket();
  const [history, setHistory] = useState<{ timestamp: string; downlink: number; uplink: number; latency: number; power: number }[]>([]);



  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch(`http://${window.location.hostname}:4000/api/history`);
        const historyData: StatusSnapshot[] = await res.json();
        const formatted = historyData.map(snap => ({
          timestamp: snap.timestamp,
          downlink: snap.network.downlink_mbps,
          uplink: snap.network.uplink_mbps,
          latency: snap.network.latency_ms,
          power: snap.health.power_w
        }));
        setHistory(formatted);
      } catch (e) {
        console.error("Failed to fetch history", e);
      }
    }
    fetchHistory();
  }, []); // Run once on mount

  // Sync history with new data point
  useEffect(() => {
    if (!data) return;

    setHistory(prev => {
      // Avoid duplicate timestamps if any
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
      return newHistory.length > 720 ? newHistory.slice(-720) : newHistory;
    });
  }, [data]);

  return <Dashboard status={data} history={history} isConnected={isConnected} />;
}
