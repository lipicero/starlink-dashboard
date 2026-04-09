import HomeClient from "./HomeClient";
import { StatusSnapshot } from "../types";

export const dynamic = 'force-dynamic';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Esta función se ejecuta en el SERVIDOR (SSR)
async function getInitialData() {
  try {
    const [statusRes, historyRes] = await Promise.all([
      fetch(`${API_BASE_URL}/api/status`, { cache: 'no-store' }),
      fetch(`${API_BASE_URL}/api/history?limit=600`, { cache: 'no-store' })
    ]);

    let initialStatus: StatusSnapshot | null = null;
    let initialHistory: { timestamp: string; downlink: number; uplink: number; latency: number; power: number; packet_loss: number; obstruction: number }[] = [];

    if (statusRes.ok) {
      initialStatus = await statusRes.json();
    }

    if (historyRes.ok) {
      initialHistory = await historyRes.json();
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
