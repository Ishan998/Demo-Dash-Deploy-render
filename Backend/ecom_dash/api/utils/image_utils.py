"""
Utilities for normalizing incoming product images and converting JPG/PNG inputs
to AVIF files saved under MEDIA_ROOT.
"""
import base64
import uuid
from io import BytesIO
from typing import Iterable, List

from django.core.files.base import ContentFile
from django.core.files.storage import default_storage

# Register AVIF support if available; fails gracefully when the plugin is missing.
try:
    import pillow_avif  # type: ignore  # noqa: F401
except Exception:
    pass
from PIL import Image  # noqa: E402  (import after plugin registration)


def _is_data_uri(value: str) -> bool:
    return isinstance(value, str) and value.startswith("data:image/")


def _extract_mime(data_uri: str) -> str:
    try:
        header = data_uri.split(",", 1)[0]
        return header.split(";")[0].split(":")[1]
    except Exception:
        return ""


def _decode_data_uri(data_uri: str) -> bytes:
    try:
        return base64.b64decode(data_uri.split(",", 1)[1])
    except Exception:
        return b""


def _save_avif(image_bytes: bytes, folder: str = "products", quality: int = 70) -> str:
    img = Image.open(BytesIO(image_bytes)).convert("RGB")
    buffer = BytesIO()
    img.save(buffer, format="AVIF", quality=quality)
    filename = f"{folder}/{uuid.uuid4().hex}.avif"
    path = default_storage.save(filename, ContentFile(buffer.getvalue()))
    return default_storage.url(path)


def convert_list_to_avif(values: Iterable[str]) -> List[str]:
    """
    Convert a list of image strings to AVIF URLs when they are data URIs for JPG/PNG.
    Existing URLs or non-supported formats are returned unchanged.
    """
    output: List[str] = []
    for val in values or []:
        if not _is_data_uri(val):
            output.append(val)
            continue

        mime = _extract_mime(val)
        if mime not in ("image/jpeg", "image/png"):
            output.append(val)
            continue

        decoded = _decode_data_uri(val)
        if not decoded:
            output.append(val)
            continue

        try:
            avif_url = _save_avif(decoded)
            output.append(avif_url)
        except Exception:
            # In case conversion fails, keep the original to avoid data loss.
            output.append(val)
    return output
