# Firebase Firestore Data Schema

## Collections

### users/{uid}
```json
{
  "uid": "string",
  "email": "string",
  "displayName": "string",
  "photoURL": "string | null",
  "role": "user" | "admin",
  "credits": number,
  "plan": "string",
  "deviceQuota": number,
  "status": "active" | "suspended",
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "lastActiveAt": "timestamp"
}
```

### devices/{deviceId}
```json
{
  "id": "string",
  "name": "string",
  "board": "string",
  "ownerId": "string",
  "status": "online" | "offline" | "error",
  "port": "string",
  "ip": "string | null",
  "agentVersion": "string",
  "lastSeen": "timestamp",
  "createdAt": "timestamp",
  "sharedWith": ["uid1", "uid2"]
}
```

### shareKeys/{shareKeyId}
```json
{
  "key": "string (6 char)",
  "deviceId": "string",
  "ownerId": "string",
  "grantedTo": "string | null",
  "expiresAt": "timestamp",
  "createdAt": "timestamp",
  "revoked": boolean
}
```

### plans/default
```json
{
  "plans": [
    {
      "id": "string",
      "name": "string",
      "price": number,
      "credits": number,
      "nodes": number,
      "features": ["string"],
      "popular": boolean,
      "active": boolean
    }
  ]
}
```

### siteContent/main
```json
{
  "hero": {
    "title": "string",
    "subtext": "string"
  },
  "about": {
    "story": "string",
    "mission": "string"
  },
  "socialLinks": {
    "discord": "string",
    "buymeacoffee": "string"
  },
  "architects": [
    {
      "name": "string",
      "title": "string",
      "bio": "string"
    }
  ],
  "updatedAt": "timestamp",
  "updatedBy": "string"
}
```

### promoCodes/{promoId}
```json
{
  "code": "string",
  "discountType": "percentage" | "fixed",
  "discountValue": number,
  "applicablePlans": ["string"],
  "maxRedemptions": number,
  "redemptionCount": number,
  "status": "active" | "paused" | "expired",
  "expiresAt": "timestamp"
}
```

### stats/global
```json
{
  "totalUsers": number,
  "activeDevices": number,
  "totalDevices": number,
  "monthlyRevenue": number,
  "dailySessions": number,
  "totalTransactions": number,
  "totalCreditsIssued": number
}
```

### stats/hourly/{hourlyId}
```json
{
  "date": "string (YYYY-MM-DD)",
  "hour": number,
  "connectedDevices": number,
  "serialSessions": number,
  "flashUploads": number,
  "updatedAt": "timestamp"
}
```

### adminLogs/{logId}
```json
{
  "adminId": "string",
  "adminName": "string",
  "action": "string",
  "entity": "string",
  "entityId": "string",
  "description": "string",
  "status": "committed" | "failed",
  "timestamp": "timestamp"
}
```

### pendingDevices/{pendingId}
```json
{
  "setupToken": "string",
  "ownerId": "string",
  "name": "string",
  "board": "string",
  "status": "pending" | "registered",
  "createdAt": "timestamp"
}
```

## Indexes (firestore.indexes.json)
```json
{
  "indexes": [
    {
      "collectionGroup": "devices",
      "queryScope": "collection",
      "fields": [
        { "fieldPath": "ownerId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "shareKeys",
      "queryScope": "collection",
      "fields": [
        { "fieldPath": "deviceId", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "adminLogs",
      "queryScope": "collection",
      "fields": [
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    }
  ]
}
```