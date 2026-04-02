#!/usr/bin/env node

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');

const defaultDocs = [
  {
    title: "Getting Started",
    description: "Learn how to set up and connect your first microcontroller",
    content: `# Getting Started

Welcome to RemoteMCU! This guide will help you connect your first device.

## Prerequisites

Before you begin, you'll need:

- A microcontroller (ESP32, Arduino, STM32, etc.)
- A computer to run the Host Agent
- A RemoteMCU account

## Quick Start

1. **Create an Account** - Sign up at RemoteMCU
2. **Download the Agent** - Get the Host Agent for your OS
3. **Link Your Device** - Use your setup token to connect

## Supported Hardware

RemoteMCU supports:
- ESP32 / ESP8266
- Arduino Uno / Nano / Mega
- STM32
- Raspberry Pi Pico

## Need Help?

Open a support ticket from your dashboard if you need assistance.`,
    status: "published",
    order: 1,
  },
  {
    title: "Connecting a Device",
    description: "Step-by-step guide to connect your microcontroller",
    content: `# Connecting a Device

This guide walks you through connecting your microcontroller to RemoteMCU.

## Method 1: USB Connection

1. Connect your microcontroller to your computer via USB
2. Download and extract the Host Agent
3. Generate a setup token from your dashboard
4. Run: python host_agent.py --token YOUR_TOKEN

## Method 2: Network Connection

For network-enabled devices:

1. Configure your device with WiFi credentials
2. Enter the setup token in your firmware
3. The device will automatically connect

## Troubleshooting

- **Device not detected**: Check USB cable and drivers
- **Connection timeout**: Verify your network settings
- **Token invalid**: Generate a new token from dashboard`,
    status: "published",
    order: 2,
  },
  {
    title: "Code Upload",
    description: "How to upload code to your remote devices",
    content: `# Code Upload

Learn how to upload firmware to your connected devices.

## Using the Code Editor

1. Go to your device control panel
2. Write or paste your code in the editor
3. Click "Compile" to check for errors
4. Click "Upload" to send to device

## Supported Languages

- C / C++ (primary)
- Arduino sketches

## OTA Updates

Over-The-Air updates work when your device is connected via WiFi. USB-connected devices require a physical connection for upload.`,
    status: "published",
    order: 3,
  },
  {
    title: "Serial Monitor",
    description: "View serial output from your devices",
    content: `# Serial Monitor

The Serial Monitor shows real-time output from your microcontroller.

## Opening Serial Monitor

1. Navigate to your device control panel
2. Click on the "Terminal" or "Serial Monitor" tab
3. Set your baud rate (default: 115200)

## Features

- Real-time output streaming
- Send commands to device
- Filter by log level
- Export logs

## Common Issues

- **No output**: Check baud rate matches your code
- **Garbage characters**: Try different baud rate`,
    status: "published",
    order: 4,
  },
  {
    title: "Camera Setup",
    description: "Set up camera streaming for ESP32-CAM",
    content: `# Camera Setup

Stream video from your ESP32-CAM or USB camera.

## ESP32-CAM Setup

1. Connect camera module to ESP32
2. Upload camera firmware
3. Configure camera settings in dashboard

## USB Camera

1. Connect USB camera to computer running Host Agent
2. Agent will auto-detect camera
3. View stream in device control panel

## Troubleshooting

- **No stream**: Check camera connections
- **Laggy video**: Check network speed`,
    status: "published",
    order: 5,
  },
  {
    title: "Credits & Billing",
    description: "Understanding credits and billing",
    content: `# Credits & Billing

RemoteMCU uses a credit-based system.

## What are Credits?

Credits are used for:
- Remote debugging sessions
- Code compilation
- Data storage
- Camera streaming

## Free Plan

- 10 credits/month
- Up to 3 devices
- Community support

## Paid Plans

Upgrade for more credits and features. Check the pricing page for details.

## Viewing Usage

Track your credit usage in the Credits & Billing section of your dashboard.`,
    status: "published",
    order: 6,
  },
];

// You need to fill in your Firebase config from Firebase Console
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

async function seedDocumentation() {
  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log("Seeding documentation...");
    
    for (const doc of defaultDocs) {
      await addDoc(collection(db, "documentation"), {
        ...doc,
        author: "system",
        authorName: "RemoteMCU",
        createdAt: serverTimestamp(),
        lastEdited: serverTimestamp(),
      });
      console.log(`Added: ${doc.title}`);
    }
    
    console.log("\nDocumentation seeding complete!");
    console.log("Now go to /dashboard/admin/docs to edit these documents.");
  } catch (error) {
    console.error("Error:", error.message);
  }
}

seedDocumentation();
