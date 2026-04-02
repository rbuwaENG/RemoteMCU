"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";

export default function CameraPage() {
  const params = useParams();
  const deviceId = params.id as string;
  
  const [cameraOn, setCameraOn] = useState(false);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    async function getCameras() {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === "videoinput");
        setCameras(videoDevices);
        if (videoDevices.length > 0) {
          setSelectedCamera(videoDevices[0].deviceId);
        }
      } catch (error) {
        console.error("Failed to get cameras:", error);
      }
    }
    getCameras();
  }, []);

  const startCamera = async () => {
    try {
      const constraints: MediaStreamConstraints = {
        video: selectedCamera 
          ? { deviceId: { exact: selectedCamera } }
          : { facingMode: 'environment' }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setVideoStream(stream);
      setCameraOn(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Failed to access camera:", error);
    }
  };

  const stopCamera = () => {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      setVideoStream(null);
    }
    setCameraOn(false);
  };

  useEffect(() => {
    return () => {
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="h-screen w-screen bg-black flex flex-col">
      {/* Header */}
      <div className="h-14 bg-[#1b1b1c] flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary" style={{ fontSize: 24 }}>videocam</span>
          <span className="text-sm font-bold text-white tracking-wide">Camera Feed</span>
          <span className="text-xs text-white/40 font-mono">|</span>
          <span className="text-xs text-white/60 font-mono">{deviceId}</span>
        </div>
        <div className="flex items-center gap-3">
          {cameraOn && (
            <div className="flex items-center gap-2 px-3 py-1 bg-error/20 rounded-full">
              <span className="w-2 h-2 bg-error rounded-full animate-pulse"></span>
              <span className="text-xs text-error font-bold">LIVE</span>
            </div>
          )}
          {cameras.length > 1 && (
            <select
              value={selectedCamera}
              onChange={(e) => {
                if (cameraOn) {
                  stopCamera();
                  setSelectedCamera(e.target.value);
                  setTimeout(() => startCamera(), 100);
                } else {
                  setSelectedCamera(e.target.value);
                }
              }}
              className="bg-[#2a2a2a] text-white text-xs px-3 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-primary"
            >
              {cameras.map((cam, i) => (
                <option key={cam.deviceId} value={cam.deviceId}>
                  {cam.label || `Camera ${i + 1}`}
                </option>
              ))}
            </select>
          )}
          <button 
            onClick={cameraOn ? stopCamera : startCamera}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${cameraOn ? 'bg-error text-white hover:bg-error/80' : 'bg-primary text-white hover:brightness-110'}`}
          >
            {cameraOn ? 'Stop Camera' : 'Start Camera'}
          </button>
        </div>
      </div>
      
      {/* Video Area */}
      <div className="flex-1 flex items-center justify-center bg-[#0e0e0e]">
        {cameraOn ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-contain bg-black"
          />
        ) : (
          <div className="text-center">
            <span className="material-symbols-outlined text-[120px] text-primary/20">videocam_off</span>
            <p className="text-on-surface-variant text-xl mt-4">Camera is off</p>
            <p className="text-white/40 text-sm mt-2">Click "Start Camera" to begin streaming</p>
            <button 
              onClick={startCamera}
              className="mt-6 px-6 py-3 bg-primary text-on-primary rounded-lg font-bold text-sm hover:brightness-110 transition-all"
            >
              Start Camera
            </button>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="h-8 bg-[#1b1b1c] flex items-center justify-between px-4 text-[10px] font-mono text-white/40 shrink-0">
        <div className="flex items-center gap-4">
          <span>Device: {deviceId}</span>
        </div>
        <div className="flex items-center gap-4">
          <span>{new Date().toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
