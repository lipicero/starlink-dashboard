"use client";

import { useEffect, useState } from "react";
import { Dashboard } from "../components/Dashboard";
import { useSocket } from "../hooks/useSocket";
import { StatusSnapshot } from "../types";

export default function Home() {
  const { isConnected, data } = useSocket();
  const [history, setHistory] = useState<{ timestamp: string; downlink: number; uplink: number; latency: number }[]>([]);



  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch(`http://${window.location.hostname}:4000/api/history`);
        const historyData: StatusSnapshot[] = await res.json();
        const formatted = historyData.map(snap => ({
          timestamp: snap.timestamp,
          downlink: snap.network.downlink_mbps,
          uplink: snap.network.uplink_mbps,
          latency: snap.network.latency_ms
        }));
        setHistory(formatted);
      } catch (e) {
        console.error("Failed to fetch history", e);
      }
    }
    fetchHistory();
  }, []); // Run once on mount

  useEffect(() => {
    if (data) {
      setHistory(prev => {
        const newPoint = {
          timestamp: data.timestamp,
          downlink: data.network.downlink_mbps,
          uplink: data.network.uplink_mbps,
          latency: data.network.latency_ms
        };
        // Keep last 60 points
        const newHistory = [...prev, newPoint];
        if (newHistory.length > 60) return newHistory.slice(newHistory.length - 60);
        return newHistory;
      });
    }
  }, [data]);

  return <Dashboard status={data} history={history} isConnected={isConnected} />;
}
