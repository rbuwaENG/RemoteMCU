"use client";

import { useEffect, useRef, useState } from "react";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";

interface SerialPlotterProps {
  isConnected: boolean;
}

export default function SerialPlotter({ isConnected }: SerialPlotterProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const uplotRef = useRef<uPlot | null>(null);
  const [dataPoints, setDataPoints] = useState<number[]>([]);
  const [maxPoints, setMaxPoints] = useState(500);

  useEffect(() => {
    if (!chartRef.current) return;

    const opts: uPlot.Options = {
      width: chartRef.current.clientWidth,
      height: chartRef.current.clientHeight - 40,
      title: "Serial Data Plotter",
      cursor: {
        points: {
          size: 5,
          fill: (self: uPlot, i: number) => self.data[1]?.[i] ? "#B4C5FF" : "#4EDEA3",
        },
      },
      series: [
        {},
        {
          label: "Value",
          stroke: "#B4C5FF",
          width: 2,
          fill: "rgba(180, 197, 255, 0.1)",
          points: { show: false },
        },
      ],
      axes: [
        {
          stroke: "#8d90a0",
          grid: { show: true, stroke: "rgba(67, 70, 85, 0.3)" },
        },
        {
          stroke: "#8d90a0",
          grid: { show: true, stroke: "rgba(67, 70, 85, 0.3)" },
        },
      ],
      scales: {
        x: {
          time: false,
        },
      },
    };

    const data: uPlot.AlignedData = [
      Array.from({ length: maxPoints }, (_, i) => i),
      Array(maxPoints).fill(0),
    ];

    uplotRef.current = new uPlot(opts, data, chartRef.current);

    const handleResize = () => {
      if (chartRef.current && uplotRef.current) {
        uplotRef.current.setSize({
          width: chartRef.current.clientWidth,
          height: chartRef.current.clientHeight - 40,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (uplotRef.current) {
        uplotRef.current.destroy();
      }
    };
  }, [maxPoints]);

  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(() => {
        const newValue = Math.sin(Date.now() / 1000) * 100 + Math.random() * 20;
        
        setDataPoints(prev => {
          const updated = [...prev, newValue];
          if (updated.length > maxPoints) {
            return updated.slice(-maxPoints);
          }
          return updated;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [isConnected, maxPoints]);

  useEffect(() => {
    if (uplotRef.current && dataPoints.length > 0) {
      const xData = dataPoints.map((_, i) => i);
      uplotRef.current.setData([xData, dataPoints], true);
    }
  }, [dataPoints]);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Toolbar */}
      <div className="flex flex-between" style={{ padding: "var(--space-3)", borderBottom: "1px solid var(--outline-variant)" }}>
        <div className="flex gap-3" style={{ alignItems: "center" }}>
          <span className={`status-dot ${isConnected ? "status-dot-online" : "status-dot-offline"}`}></span>
          <span style={{ fontSize: "var(--body-sm)" }}>
            {isConnected ? "Live" : "Disconnected"}
          </span>
        </div>
        <div className="flex gap-2">
          <button 
            className="btn btn-ghost btn-sm"
            onClick={() => setDataPoints([])}
          >
            Clear
          </button>
          <select 
            className="input select" 
            style={{ width: "120px", padding: "var(--space-2)" }}
            value={maxPoints}
            onChange={(e) => setMaxPoints(Number(e.target.value))}
          >
            <option value={100}>100 pts</option>
            <option value={250}>250 pts</option>
            <option value={500}>500 pts</option>
            <option value={1000}>1000 pts</option>
          </select>
        </div>
      </div>
      
      {/* Chart */}
      <div 
        ref={chartRef}
        style={{ 
          flex: 1, 
          background: "var(--surface-container-lowest)",
          padding: "var(--space-2)",
        }}
      >
        {!isConnected && (
          <div style={{ 
            color: "var(--outline)", 
            textAlign: "center", 
            paddingTop: "var(--space-12)",
          }}>
            Connect to a device to see real-time data
          </div>
        )}
      </div>
    </div>
  );
}
