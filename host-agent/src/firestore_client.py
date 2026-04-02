"""
firestore_client.py — Thin Firestore REST API client for the host-agent.

Uses the Firestore REST API (no Admin SDK required on end-user machines).
Authentication uses a Firebase API key + the device's registered token
for reading, and a service-account JWT for writing compile job updates.

For simplicity in the initial version, we use the Firebase REST API
with an ID token obtained from the device's stored credentials.
"""

import json
import os
import time
from typing import Any, Optional

import requests

# ── Firestore REST base URL ────────────────────────────────────────────────
_FS_BASE = (
    "https://firestore.googleapis.com/v1/projects/{project}/databases/(default)/documents"
)


def _to_firestore_value(value: Any) -> dict:
    """Convert a Python value to a Firestore REST API field value."""
    if value is None:
        return {"nullValue": None}
    if isinstance(value, bool):
        return {"booleanValue": value}
    if isinstance(value, int):
        return {"integerValue": str(value)}
    if isinstance(value, float):
        return {"doubleValue": value}
    if isinstance(value, str):
        return {"stringValue": value}
    if isinstance(value, list):
        return {"arrayValue": {"values": [_to_firestore_value(v) for v in value]}}
    if isinstance(value, dict):
        return {
            "mapValue": {
                "fields": {k: _to_firestore_value(v) for k, v in value.items()}
            }
        }
    # Fallback: stringify
    return {"stringValue": str(value)}


def _from_firestore_value(fv: dict) -> Any:
    """Convert a Firestore REST API field value to a Python value."""
    if "nullValue" in fv:
        return None
    if "booleanValue" in fv:
        return fv["booleanValue"]
    if "integerValue" in fv:
        return int(fv["integerValue"])
    if "doubleValue" in fv:
        return fv["doubleValue"]
    if "stringValue" in fv:
        return fv["stringValue"]
    if "arrayValue" in fv:
        return [_from_firestore_value(v) for v in fv["arrayValue"].get("values", [])]
    if "mapValue" in fv:
        return {
            k: _from_firestore_value(v)
            for k, v in fv["mapValue"].get("fields", {}).items()
        }
    if "timestampValue" in fv:
        return fv["timestampValue"]
    return None


def _doc_to_dict(doc: dict) -> dict:
    """Convert a Firestore REST document response to a plain Python dict."""
    fields = doc.get("fields", {})
    return {k: _from_firestore_value(v) for k, v in fields.items()}


def _dict_to_fields(data: dict) -> dict:
    """Convert a plain Python dict to Firestore REST fields format."""
    return {k: _to_firestore_value(v) for k, v in data.items()}


class FirestoreClient:
    """
    Firestore REST API client for the host-agent.

    Handles all reads/writes for compileJobs and device status updates.
    Uses the Firebase ID token stored in the agent's environment.
    """

    def __init__(self, project_id: str, id_token: str):
        """
        Args:
            project_id: Firebase project ID (e.g. "remotemcu-bfb84")
            id_token:   Firebase Auth ID token for the device's service account,
                        OR the user's ID token obtained during onboarding.
        """
        self.project_id = project_id
        self.id_token = id_token
        self._base = _FS_BASE.format(project=project_id)

    @classmethod
    def from_env(cls) -> "FirestoreClient":
        """
        Create a FirestoreClient from environment variables.

        Required env vars:
            FIREBASE_PROJECT_ID   — Firebase project ID
            FIREBASE_ID_TOKEN     — Firebase Auth ID token (set during onboarding)
        """
        project_id = os.getenv("FIREBASE_PROJECT_ID", os.getenv("NEXT_PUBLIC_FIREBASE_PROJECT_ID", ""))
        id_token = os.getenv("FIREBASE_ID_TOKEN", "")

        if not project_id:
            raise ValueError(
                "FIREBASE_PROJECT_ID environment variable is not set. "
                "Run the host-agent setup wizard to configure it."
            )

        return cls(project_id=project_id, id_token=id_token)

    def _headers(self) -> dict:
        headers = {"Content-Type": "application/json"}
        if self.id_token:
            headers["Authorization"] = f"Bearer {self.id_token}"
        return headers

    # ── compileJobs ─────────────────────────────────────────────────────────

    def get_compile_job(self, job_id: str) -> Optional[dict]:
        """Fetch a compile job document. Returns None if not found."""
        url = f"{self._base}/compileJobs/{job_id}"
        try:
            resp = requests.get(url, headers=self._headers(), timeout=15)
            if resp.status_code == 200:
                return _doc_to_dict(resp.json())
            elif resp.status_code == 404:
                print(f"[Firestore] compileJobs/{job_id} not found")
                return None
            else:
                print(f"[Firestore] GET compileJobs/{job_id} failed: {resp.status_code} {resp.text[:200]}")
                return None
        except requests.RequestException as e:
            print(f"[Firestore] Network error fetching compile job: {e}")
            return None

    def update_compile_job(self, job_id: str, fields: dict) -> bool:
        """
        Patch specific fields on a compileJobs document.
        Only the provided fields are updated (field mask PATCH).
        """
        # Add updatedAt timestamp
        fields["updatedAt"] = {"__type__": "timestamp", "value": time.time()}

        url = f"{self._base}/compileJobs/{job_id}"
        field_mask = ",".join(fields.keys())
        params = {"updateMask.fieldPaths": list(fields.keys())}

        body = {"fields": _dict_to_fields(fields)}

        try:
            resp = requests.patch(
                url,
                headers=self._headers(),
                params=params,
                json=body,
                timeout=15,
            )
            if resp.status_code in (200, 201):
                return True
            else:
                print(f"[Firestore] PATCH compileJobs/{job_id} failed: {resp.status_code} {resp.text[:300]}")
                return False
        except requests.RequestException as e:
            print(f"[Firestore] Network error updating compile job: {e}")
            return False

    # ── devices ─────────────────────────────────────────────────────────────

    def update_device_status(self, device_id: str, status: str, extra: dict = None) -> bool:
        """Update the online/offline status of this device in Firestore."""
        fields = {
            "status": status,
            "lastSeen": time.time(),
            **(extra or {}),
        }
        url = f"{self._base}/devices/{device_id}"
        params = {"updateMask.fieldPaths": list(fields.keys())}
        body = {"fields": _dict_to_fields(fields)}

        try:
            resp = requests.patch(
                url,
                headers=self._headers(),
                params=params,
                json=body,
                timeout=10,
            )
            return resp.status_code in (200, 201)
        except requests.RequestException as e:
            print(f"[Firestore] Failed to update device status: {e}")
            return False

    def get_device(self, device_id: str) -> Optional[dict]:
        """Fetch a device document."""
        url = f"{self._base}/devices/{device_id}"
        try:
            resp = requests.get(url, headers=self._headers(), timeout=10)
            if resp.status_code == 200:
                return _doc_to_dict(resp.json())
            return None
        except requests.RequestException:
            return None

    def register_device(self, device_id: str, data: dict) -> bool:
        """Create or update a device document (used during onboarding)."""
        url = f"{self._base}/devices/{device_id}"
        body = {"fields": _dict_to_fields(data)}
        try:
            resp = requests.patch(
                url, headers=self._headers(), json=body, timeout=15
            )
            return resp.status_code in (200, 201)
        except requests.RequestException as e:
            print(f"[Firestore] Failed to register device: {e}")
            return False

    # ── share keys ─────────────────────────────────────────────────────────

    def validate_setup_token(self, token: str) -> Optional[dict]:
        """
        Query pendingDevices for a matching setupToken.
        Returns the pending device data if found, else None.
        """
        url = f"{self._base}/pendingDevices"
        params = {
            "pageSize": 1,
        }
        # Use Firestore REST structured query
        query_body = {
            "structuredQuery": {
                "from": [{"collectionId": "pendingDevices"}],
                "where": {
                    "fieldFilter": {
                        "field": {"fieldPath": "setupToken"},
                        "op": "EQUAL",
                        "value": {"stringValue": token},
                    }
                },
                "limit": 1,
            }
        }
        run_url = f"https://firestore.googleapis.com/v1/projects/{self.project_id}/databases/(default)/documents:runQuery"
        try:
            resp = requests.post(
                run_url, headers=self._headers(), json=query_body, timeout=15
            )
            if resp.status_code == 200:
                results = resp.json()
                for item in results:
                    if "document" in item:
                        return _doc_to_dict(item["document"])
            return None
        except requests.RequestException as e:
            print(f"[Firestore] validate_setup_token error: {e}")
            return None