"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import OnboardingWizard from "@/components/devices/OnboardingWizard";
import Link from "next/link";

export default function OnboardPage() {
  const router = useRouter();
  const [wizardOpen, setWizardOpen] = useState(true);

  const handleDeviceCreated = (deviceId: string) => {
    setTimeout(() => {
      router.push(`/device/${deviceId}`);
    }, 1500);
  };

  const handleClose = () => {
    router.push("/dashboard/devices");
  };

  return (
    <div className="min-h-screen bg-[#131313] flex items-center justify-center p-4">
      <OnboardingWizard 
        isOpen={wizardOpen} 
        onClose={handleClose}
        onDeviceCreated={handleDeviceCreated}
      />
    </div>
  );
}