import React, {useEffect, useState} from "react";

export default function Logs() {
    const [logs, setLogs] = useState<string[]>([]);

    // useEffect(() => {
    //     const socket = new WebSocket("ws://localhost:8000/ws/logs/");
    //
    //     socket.onmessage = (event) => {
    //         const data = JSON.parse(event.data);
    //         setLogs((prevLogs) => [...prevLogs, ...data.logs]);
    //     };
    //
    //     return () => socket.close();
    // }, []);

    return (
        <div className="flex h-full">
            <div className="flex-1 border-r border-white/10 h-full flex flex-col">
                <div className="border-b border-white/10 p-2">
                    <h3>Logs</h3>
                </div>
                <div className="flex-1 overflow-scroll">
                    <pre>
                        {logs.join("\n")}
                    </pre>
                </div>
            </div>
        </div>
    );
}