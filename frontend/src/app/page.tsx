import HomeClient from "./HomeClient";
import { StatusSnapshot } from "../types";

// Esta función se ejecuta en el SERVIDOR (SSR)
async function getInitialData() {
  try {
    const [statusRes, historyRes] = await Promise.all([
      fetch("http://localhost:4000/api/status", { cache: 'no-store' }),
      fetch("http://localhost:4000/api/history", { cache: 'no-store' })
    ]);
    
    let initialStatus: StatusSnapshot | null = null;
    let initialHistory: { timestamp: string; downlink: number; uplink: number; latency: number; power: number }[] = [];

    if (statusRes.ok) {
      initialStatus = await statusRes.json();
    }

    if (historyRes.ok) {
      const historyData: StatusSnapshot[] = await historyRes.json();
      initialHistory = historyData.map(snap => ({
        timestamp: snap.timestamp,
        downlink: snap.network.downlink_mbps,
        uplink: snap.network.uplink_mbps,
        latency: snap.network.latency_ms,
        power: snap.health.power_w
      }));
    }
    
    return { initialStatus, initialHistory };
  } catch (e) {
    console.error("Error fetching initial data on server:", e);
    return { initialStatus: null, initialHistory: [] };
  }
}

export default async function Home() {
  const { initialStatus, initialHistory } = await getInitialData();

  return (
    <main>
      <HomeClient initialStatus={initialStatus} initialHistory={initialHistory} />
    </main>
  );
}
