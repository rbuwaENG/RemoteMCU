import type { Metadata } from "next";
import "@/styles/globals.css";
import "@/styles/design-system.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "RemoteMCU — Remote Hardware Debugging & Management Platform",
  description:
    "Write code, compile, flash, and debug microcontroller boards remotely from your browser. Support for ESP32, Arduino, STM32, and more. No drivers required.",
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              tailwind.config = {
                darkMode: "class",
                theme: {
                  extend: {
                    colors: {
                      "inverse-on-surface": "#303030",
                      "surface-container-lowest": "#0e0e0e",
                      "on-surface-variant": "#bcc9c9",
                      "surface-variant": "#353535",
                      "tertiary-fixed": "#ffdbc8",
                      "on-error": "#690005",
                      "primary-fixed-dim": "#67d7dd",
                      "on-secondary-container": "#95bcbe",
                      "inverse-primary": "#00696d",
                      "on-secondary-fixed-variant": "#264d4f",
                      "surface-container": "#202020",
                      "on-secondary-fixed": "#002021",
                      "background": "#131313",
                      "secondary-fixed-dim": "#a6ced0",
                      "on-tertiary": "#512300",
                      "on-primary-fixed-variant": "#004f53",
                      "error": "#ffb4ab",
                      "tertiary-container": "#ce7c45",
                      "outline-variant": "#3d494a",
                      "on-tertiary-container": "#471e00",
                      "on-error-container": "#ffdad6",
                      "on-tertiary-fixed-variant": "#743500",
                      "surface-dim": "#131313",
                      "surface": "#131313",
                      "on-surface": "#e5e2e1",
                      "surface-container-high": "#2a2a2a",
                      "primary-fixed": "#85f4fa",
                      "surface-tint": "#67d7dd",
                      "on-primary-fixed": "#002021",
                      "secondary": "#a6ced0",
                      "secondary-container": "#264d4f",
                      "surface-container-low": "#1b1b1c",
                      "tertiary": "#ffb689",
                      "on-tertiary-fixed": "#311300",
                      "inverse-surface": "#e5e2e1",
                      "error-container": "#93000a",
                      "tertiary-fixed-dim": "#ffb689",
                      "on-primary": "#003739",
                      "on-background": "#e5e2e1",
                      "outline": "#879394",
                      "surface-container-highest": "#353535",
                      "secondary-fixed": "#c1eaec",
                      "on-secondary": "#0b3638",
                      "primary-container": "#1da0a6",
                      "primary": "#67d7dd",
                      "on-primary-container": "#002f31",
                      "surface-bright": "#393939"
                    },
                    fontFamily: {
                      "headline": ["Inter"],
                      "body": ["Inter"],
                      "label": ["Inter"],
                      "mono": ["JetBrains Mono"]
                    },
                    borderRadius: {"DEFAULT": "0.125rem", "lg": "0.25rem", "xl": "0.5rem", "full": "0.75rem"},
                  },
                },
              }
            `,
          }}
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              .material-symbols-outlined {
                font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
              }
              .dot-grid {
                background-image: radial-gradient(circle, #ffffff 1px, transparent 1px);
                background-size: 24px 24px;
              }
              .mockup-glow {
                box-shadow: 0 0 60px rgba(0, 151, 157, 0.15);
              }
              .glitch-text {
                text-shadow: 0.05em 0 0 rgba(255, 0, 0, 0.75),
                    -0.025em -0.05em 0 rgba(0, 255, 0, 0.75),
                    0.025em 0.05em 0 rgba(0, 0, 255, 0.75);
                animation: glitch 500ms infinite;
              }
              @keyframes glitch {
                0% { text-shadow: 0.05em 0 0 rgba(255, 0, 0, 0.75), -0.05em -0.025em 0 rgba(0, 255, 0, 0.75), -0.025em 0.05em 0 rgba(0, 0, 255, 0.75); }
                14% { text-shadow: 0.05em 0 0 rgba(255, 0, 0, 0.75), -0.05em -0.025em 0 rgba(0, 255, 0, 0.75), -0.025em 0.05em 0 rgba(0, 0, 255, 0.75); }
                15% { text-shadow: -0.05em -0.025em 0 rgba(255, 0, 0, 0.75), 0.025em 0.025em 0 rgba(0, 255, 0, 0.75), -0.05em -0.05em 0 rgba(0, 0, 255, 0.75); }
                49% { text-shadow: -0.05em -0.025em 0 rgba(255, 0, 0, 0.75), 0.025em 0.025em 0 rgba(0, 255, 0, 0.75), -0.05em -0.05em 0 rgba(0, 0, 255, 0.75); }
                50% { text-shadow: 0.025em 0.05em 0 rgba(255, 0, 0, 0.75), 0.05em 0 0 rgba(0, 255, 0, 0.75), 0 -0.05em 0 rgba(0, 0, 255, 0.75); }
                99% { text-shadow: 0.025em 0.05em 0 rgba(255, 0, 0, 0.75), 0.05em 0 0 rgba(0, 255, 0, 0.75), 0 -0.05em 0 rgba(0, 0, 255, 0.75); }
                100% { text-shadow: -0.025em 0 0 rgba(255, 0, 0, 0.75), -0.025em -0.025em 0 rgba(0, 255, 0, 0.75), -0.025em -0.05em 0 rgba(0, 0, 255, 0.75); }
              }
              .arduino-keyword { color: #d35400; }
              .arduino-function { color: #d35400; }
              .arduino-variable { color: #00979d; }
              .arduino-literal { color: #005c5f; }
              .arduino-comment { color: #95a5a6; }
              html {
                scroll-behavior: smooth;
              }
            `,
          }}
        />
      </head>
      <body className="bg-[#1E1E1E] text-on-surface font-body selection:bg-primary selection:text-on-primary min-h-screen flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
