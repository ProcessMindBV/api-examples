"""Minimal client for the ProcessMind External API (v1).

Documentation: https://processmind.com/resources/docs/api
Public spec:   https://api.processmind.com/v1/openapi.json

Only dependency: requests.
"""

from __future__ import annotations

import os
import time
from pathlib import Path
from typing import Any
from urllib.parse import urlencode

import requests

DEFAULT_BASE_URL = "https://api.processmind.com"


class ProcessMindError(Exception):
    """Raised for non-2xx responses from the ProcessMind API."""

    def __init__(self, status: int, body: Any, method: str, path: str) -> None:
        message = ""
        if isinstance(body, dict):
            message = str(body.get("message") or "")
        elif isinstance(body, str):
            message = body
        suffix = f": {message}" if message else ""
        super().__init__(f"{method} {path} failed with {status}{suffix}")
        self.status = status
        self.code = body.get("code") if isinstance(body, dict) else None
        self.body = body


class ProcessMindClient:
    """Thin wrapper around requests for the /v1 API."""

    def __init__(self, api_key: str | None = None, base_url: str | None = None) -> None:
        self.api_key = api_key or required_env("PROCESSMIND_API_KEY")
        self.base_url = (base_url or os.environ.get("PROCESSMIND_API_URL") or DEFAULT_BASE_URL).rstrip("/")

    def request(self, method: str, path: str, body: dict[str, Any] | None = None) -> Any:
        response = requests.request(
            method,
            f"{self.base_url}{path}",
            headers={"x-api-key": self.api_key},
            json=body,
            timeout=120,
        )
        try:
            parsed: Any = response.json() if response.text else None
        except ValueError:
            parsed = response.text
        if not response.ok:
            raise ProcessMindError(response.status_code, parsed, method, path)
        return parsed

    def get(self, path: str) -> Any:
        return self.request("GET", path)

    def post(self, path: str, body: dict[str, Any] | None = None) -> Any:
        return self.request("POST", path, body)

    def put(self, path: str, body: dict[str, Any] | None = None) -> Any:
        return self.request("PUT", path, body)

    def delete(self, path: str, body: dict[str, Any] | None = None) -> Any:
        return self.request("DELETE", path, body)


def required_env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise SystemExit(f"Missing environment variable {name}. See the README 'Configuration' section.")
    return value


def context_tenant_id() -> str:
    """The tenant a key acts on (the context tenant for organization calls)."""
    return required_env("PROCESSMIND_TENANT_ID")


def upload_content_to_datatable(
    client: ProcessMindClient,
    *,
    tenant_id: str,
    data_table_id: str,
    dataset_id: str,
    file_name: str,
    content: str | bytes,
    file_last_modified: float | None = None,
) -> dict[str, Any]:
    """Uploads content through a presigned URL (uploadData scope).

    For multi-GB files use the multipart endpoints — see docs/recipes.md.
    """
    payload = content.encode("utf-8") if isinstance(content, str) else content
    query = urlencode(
        {
            "datasetid": dataset_id,
            "filename": file_name,
            "filesize": str(len(payload)),
            "filelastmodified": str(int(file_last_modified or time.time() * 1000)),
        }
    )
    presigned = client.get(f"/v1/tenant/{tenant_id}/datatables/{data_table_id}/uploads/presigned-url?{query}")

    upload = requests.put(presigned["PreSignedUploadUrl"], data=payload, timeout=600)
    if not upload.ok:
        raise ProcessMindError(upload.status_code, upload.text, "PUT", "presigned upload")
    return {"file_name": file_name, "bytes": len(payload)}


def upload_file_to_datatable(
    client: ProcessMindClient,
    *,
    tenant_id: str,
    data_table_id: str,
    dataset_id: str,
    file_path: str | Path,
) -> dict[str, Any]:
    path = Path(file_path)
    return upload_content_to_datatable(
        client,
        tenant_id=tenant_id,
        data_table_id=data_table_id,
        dataset_id=dataset_id,
        file_name=path.name,
        content=path.read_bytes(),
        file_last_modified=path.stat().st_mtime * 1000,
    )


def wait_for_datatable_ready(
    client: ProcessMindClient,
    tenant_id: str,
    data_table_id: str,
    *,
    attempts: int = 60,
    delay_seconds: float = 2.0,
) -> dict[str, Any]:
    """Waits until the pipeline processed the upload.

    In production, prefer the ``data.ready`` webhook over polling.
    """
    for _ in range(attempts):
        datatable = client.get(f"/v1/tenant/{tenant_id}/datatables/{data_table_id}")
        meta_info = datatable.get("metaInfo") or {}
        if meta_info.get("type") == "error":
            raise SystemExit(f"Data import failed (datatable {data_table_id})")
        if datatable.get("hasDataLoaded"):
            return datatable
        time.sleep(delay_seconds)
    raise SystemExit(f"Timed out waiting for datatable {data_table_id} to process")
