import { getFirestore, collection, doc, setDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";

const db = getFirestore(app);

export async function seedTestData() {
  console.log("Seeding test data to Firestore...");
  
  // Seed Plans
  const plansData = {
    plans: [
      {
        id: "free",
        name: "Free Tier",
        price: 0,
        credits: 10,
        nodes: 3,
        features: ["Public Repository Access", "Community Support"],
        popular: false,
        active: true,
      },
      {
        id: "starter",
        name: "Starter Tier",
        price: 2.99,
        credits: 50,
        nodes: 10,
        features: ["Basic OTA Updates", "Email Support"],
        popular: false,
        active: true,
      },
      {
        id: "popular",
        name: "Pro Tier",
        price: 9.99,
        credits: 200,
        nodes: -1,
        features: ["OTA Ultra-Fast Updates", "End-to-End Encryption", "24/7 Priority Engineer Support"],
        popular: true,
        active: true,
      },
      {
        id: "pro",
        name: "Enterprise Tier",
        price: 19.99,
        credits: 500,
        nodes: -1,
        features: ["Everything in Pro", "Dedicated Server", "Custom Integrations"],
        popular: false,
        active: true,
      },
    ]
  };
  
  await setDoc(doc(db, "plans", "default"), plansData);
  console.log("✓ Seeded plans");

  // Seed Site Content
  const siteContentData = {
    hero: {
      title: "Debug Your Hardware. From Anywhere.",
      subtext: "Upload code, monitor serial output, and watch live camera feeds on your ESP32, Arduino, or any MCU — remotely."
    },
    about: {
      story: "Remote MCU was founded to make hardware development as fluid as web development.",
      mission: "Democratizing global hardware management through secure, latency-free infrastructure."
    },
    socialLinks: {
      discord: "https://discord.gg/remotemcu",
      buymeacoffee: "https://buymeacoffee.com/remotemcu"
    },
    architects: [],
    updatedAt: new Date(),
    updatedBy: "system"
  };
  
  await setDoc(doc(db, "siteContent", "main"), siteContentData);
  console.log("✓ Seeded site content");

  // Seed Promo Codes
  const promoCodes = [
    {
      code: "WELCOME20",
      discountType: "percentage",
      discountValue: 20,
      applicablePlans: ["starter", "popular", "pro"],
      maxRedemptions: 1000,
      redemptionCount: 0,
      status: "active",
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    },
    {
      code: "LAUNCH50",
      discountType: "fixed",
      discountValue: 5,
      applicablePlans: ["popular", "pro"],
      maxRedemptions: 500,
      redemptionCount: 0,
      status: "paused",
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    }
  ];
  
  for (let i = 0; i < promoCodes.length; i++) {
    await setDoc(doc(db, "promoCodes", `promo_${i + 1}`), promoCodes[i]);
  }
  console.log("✓ Seeded promo codes");

  // Seed Global Stats
  const statsData = {
    totalUsers: 42,
    activeDevices: 28,
    totalDevices: 56,
    monthlyRevenue: 1250.00,
    dailySessions: 156,
    totalTransactions: 1240,
    totalCreditsIssued: 5000
  };
  
  await setDoc(doc(db, "stats", "global"), statsData);
  console.log("✓ Seeded global stats");

  console.log("\n✅ All test data seeded successfully!");
  console.log("\nTo test the app:");
  console.log("1. Run 'npm run dev' to start the development server");
  console.log("2. Create a user via /auth (register)");
  console.log("3. The user will have default credits from user profile");
  console.log("4. Test adding devices via /dashboard/devices/onboard");
  console.log("5. Test share keys via /dashboard/devices (Link Device button)");
  console.log("6. Test admin features via /dashboard/admin (if role = admin)");
}

// Run this function to seed data
// import { seedTestData } from './seed';
// seedTestData();