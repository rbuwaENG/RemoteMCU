# Testing Guide for RemoteMCU Phases 1-10

## Prerequisites

1. **Firebase Project**: Set up a Firebase project at https://console.firebase.google.com
2. **Firestore**: Enable Firestore in test mode
3. **Environment Variables**: Create `.env.local` with your Firebase config:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

## Seeding Test Data

Run the seed script to populate Firestore with test data:

```bash
cd src
npx ts-node -T ../lib/seed.ts
```

Or create a simple API route to seed data:

```bash
# Create a temporary seed API route
# Visit: http://localhost:3000/api/seed (you'll need to create this)
```

**Alternative: Manual Seeding via Firebase Console**

1. Create document `plans/default` with field `plans` (array):
```json
{
  "plans": [
    {"id": "free", "name": "Free Tier", "price": 0, "credits": 10, "nodes": 3, "features": ["Public Access"], "active": true},
    {"id": "starter", "name": "Starter Tier", "price": 2.99, "credits": 50, "nodes": 10, "features": ["Basic OTA"], "popular": false, "active": true},
    {"id": "popular", "name": "Pro Tier", "price": 9.99, "credits": 200, "nodes": -1, "features": ["Fast OTA", "Priority Support"], "popular": true, "active": true},
    {"id": "pro", "name": "Enterprise Tier", "price": 19.99, "credits": 500, "nodes": -1, "features": ["All Features"], "active": true}
  ]
}
```

2. Create document `siteContent/main`:
```json
{
  "hero": {"title": "Debug Your Hardware. From Anywhere.", "subtext": "Remote MCU - Upload, monitor, debug."},
  "about": {"story": "Founded in 2024", "mission": "Democratizing hardware management"},
  "socialLinks": {"discord": "https://discord.gg/remotemcu", "buymeacoffee": ""},
  "architects": []
}
```

3. Create document `stats/global`:
```json
{"totalUsers": 42, "activeDevices": 28, "totalDevices": 56, "monthlyRevenue": 1250}
```

## Testing Each Phase

### Phase 1: Firebase Data Layer
- [ ] Services exist at `src/lib/firestore/*.ts`
- [ ] Hooks exist at `src/lib/hooks/*.ts`
- [ ] Build passes without errors

### Phase 2: Device Onboarding Flow
1. Go to `/dashboard/devices`
2. Click **Add Device** → redirects to `/dashboard/devices/onboard`
3. Onboarding wizard shows 4 steps:
   - Download Agent + Setup Token
   - Wait for connection (or skip)
   - Select device
   - Confirm registration

### Phase 3: Host Agent Upgrades
- [ ] `host-agent/src/firestore_client.py` exists
- [ ] `host-agent/src/share_key_handler.py` exists
- [ ] Agent can write status to Firestore

### Phase 4: Device Control Panel
1. Register a device first
2. Go to `/dashboard/device/[id]`
3. Verify:
   - Device info loads from Firestore
   - Tabs work (Workspace, Debugger, Compiler, Flasher)
   - ShareKeyPanel shows (if owner)

### Phase 5: Admin Panel
1. Create user with `role: "admin"` in Firestore
2. Go to `/dashboard/admin`
3. Verify:
   - Stats load from Firestore
   - User management shows real users
   - Can change role/status/credits

### Phase 6: User Dashboard
1. Register/Login as regular user
2. Go to `/dashboard`
3. Verify:
   - Device count from Firestore
   - Credits from Firestore
   - Devices list shows real data

### Phase 7: Real-time Content Sync
1. Go to home page `/`
2. Verify hero text loads from `siteContent/main`
3. Admin: Go to `/dashboard/admin/content`
4. Edit and publish → homepage updates live

### Phase 8: Security Rules
- [ ] `firestore.rules` created
- Test: Non-owners cannot read/write devices

### Phase 9: Onboarding Token Flow
1. Click Add Device → Onboarding Wizard
2. Get setup token
3. (Simulated) Agent connects with token
4. Device appears in dashboard

### Phase 10: Share Key Flow
1. Go to `/dashboard/devices`
2. Click **Link Device** button
3. Enter a valid share key
4. Device shared with you appears

## Quick Test Checklist

```
[ ] npm run dev - starts without errors
[ ] /auth - can register/login
[ ] /dashboard - shows user data from Firestore
[ ] /dashboard/devices - can add device (onboard flow)
[ ] /dashboard/device/[id] - device detail page works
[ ] /dashboard/admin - admin stats load (if admin user)
[ ] / - homepage loads site content from Firestore
[ ] Build passes: npm run build
```

## Troubleshooting

**"Loading..." forever:**
- Check browser console for errors
- Verify Firestore has data
- Check `.env.local` config

**"Device not found":**
- Device must exist in Firestore
- Check device ID matches

**Admin pages not loading:**
- User must have `role: "admin"` in Firestore users collection
- Manually add to Firestore: `users/{uid}` with `{role: "admin"}`