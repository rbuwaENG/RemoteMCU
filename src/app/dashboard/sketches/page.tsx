"use client";

import { useState } from "react";
import Link from "next/link";

interface Sketch {
  id: string;
  name: string;
  board: string;
  lastModified: string;
}

const mockSketches: Sketch[] = [];

export default function SketchesPage() {
  const [sketches, setSketches] = useState<Sketch[]>(mockSketches);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newSketch, setNewSketch] = useState({ name: "", board: "esp32" });

  const handleNewSketch = () => {
    if (!newSketch.name.trim()) return;
    
    const sketch: Sketch = {
      id: Date.now().toString(),
      name: newSketch.name,
      board: newSketch.board,
      lastModified: "Just now",
    };
    
    setSketches([...sketches, sketch]);
    setShowNewModal(false);
    setNewSketch({ name: "", board: "esp32" });
  };

  const boards = [
    { value: "esp32", label: "ESP32" },
    { value: "esp8266", label: "ESP8266" },
    { value: "arduino-uno", label: "Arduino Uno" },
    { value: "arduino-nano", label: "Arduino Nano" },
    { value: "stm32", label: "STM32" },
    { value: "raspberry-pi-pico", label: "Raspberry Pi Pico" },
  ];

  return (
    <div>
      <div className="flex flex-between" style={{ marginBottom: "var(--space-8)" }}>
        <div>
          <h1 style={{ fontSize: "var(--headline-md)", marginBottom: "var(--space-2)" }}>Sketches</h1>
          <p style={{ color: "var(--on-surface-variant)" }}>
            Manage your Arduino sketches
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNewModal(true)}>
          ➕ New Sketch
        </button>
      </div>

      {sketches.length === 0 ? (
        <div className="card text-center" style={{ padding: "var(--space-16)" }}>
          <div style={{ fontSize: "48px", marginBottom: "var(--space-4)" }}>📝</div>
          <h2 style={{ fontSize: "var(--title-lg)", marginBottom: "var(--space-3)" }}>No sketches yet</h2>
          <p style={{ color: "var(--on-surface-variant)", marginBottom: "var(--space-6)", maxWidth: "400px", margin: "0 auto var(--space-6)" }}>
            Create your first sketch to start coding and flashing your MCU boards.
          </p>
          <button className="btn btn-primary" onClick={() => setShowNewModal(true)}>
            Create Your First Sketch
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Board</th>
                <th>Last Modified</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sketches.map((sketch) => (
                <tr key={sketch.id}>
                  <td>
                    <Link href={`/dashboard/editor/${sketch.id}`} style={{ fontWeight: 600 }}>
                      {sketch.name}
                    </Link>
                  </td>
                  <td>{sketch.board}</td>
                  <td>{sketch.lastModified}</td>
                  <td>
                    <div className="flex gap-2">
                      <Link href={`/dashboard/editor/${sketch.id}`} className="btn btn-ghost btn-sm">
                        Open
                      </Link>
                      <button className="btn btn-ghost btn-sm">Duplicate</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showNewModal && (
        <div className="modal-backdrop" onClick={() => setShowNewModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "var(--title-lg)", marginBottom: "var(--space-6)" }}>New Sketch</h2>
            
            <div style={{ marginBottom: "var(--space-5)" }}>
              <label className="label">Sketch Name</label>
              <input
                type="text"
                className="input"
                placeholder="My Project"
                value={newSketch.name}
                onChange={(e) => setNewSketch({ ...newSketch, name: e.target.value })}
              />
            </div>

            <div style={{ marginBottom: "var(--space-6)" }}>
              <label className="label">Board Type</label>
              <select 
                className="input select"
                value={newSketch.board}
                onChange={(e) => setNewSketch({ ...newSketch, board: e.target.value })}
              >
                {boards.map((board) => (
                  <option key={board.value} value={board.value}>{board.label}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowNewModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleNewSketch}>
                Create Sketch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
