import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { StatusSnapshot } from "../types";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

export function useSocket() {
    const [isConnected, setIsConnected] = useState(false);
    const [data, setData] = useState<StatusSnapshot | null>(null);

    useEffect(() => {
        const socket = io(SOCKET_URL, {
            transports: ["websocket"],
            reconnectionAttempts: 5,
        });

        socket.on("connect", () => {
            setIsConnected(true);
        });

        socket.on("disconnect", () => {
            setIsConnected(false);
        });

        socket.on("status", (newData: StatusSnapshot) => {
            setData(newData);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    return { isConnected, data };
}
