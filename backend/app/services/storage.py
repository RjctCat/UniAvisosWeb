import os
import uuid

import httpx
from fastapi import HTTPException, UploadFile, status

TIPOS_IMAGEN = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
TIPOS_PDF = {"application/pdf": ".pdf"}

MAX_IMAGEN = 5 * 1024 * 1024   # 5 MB
MAX_PDF = 10 * 1024 * 1024     # 10 MB


def _firma_valida(contenido: bytes, tipo: str) -> bool:
    """Comprueba los primeros bytes del archivo, no solo lo que declara el cliente."""
    if tipo == "image/jpeg":
        return contenido[:3] == b"\xff\xd8\xff"
    if tipo == "image/png":
        return contenido[:8] == b"\x89PNG\r\n\x1a\n"
    if tipo == "image/webp":
        return contenido[:4] == b"RIFF" and contenido[8:12] == b"WEBP"
    if tipo == "application/pdf":
        return contenido[:5] == b"%PDF-"
    return False


async def subir_archivo(
    archivo: UploadFile,
    carpeta: str,
    tipos_permitidos: dict[str, str],
    max_bytes: int,
) -> str:
    url_base = os.getenv("SUPABASE_URL", "").rstrip("/")
    clave = os.getenv("SUPABASE_SERVICE_KEY")
    bucket = os.getenv("SUPABASE_BUCKET", "anuncios")

    if not url_base or not clave:
        raise HTTPException(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "El almacenamiento de archivos no está configurado",
        )

    tipo = archivo.content_type
    if tipo not in tipos_permitidos:
        permitidos = ", ".join(tipos_permitidos)
        raise HTTPException(
            status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, f"Tipo no permitido. Usa: {permitidos}"
        )

    contenido = await archivo.read(max_bytes + 1)
    if len(contenido) > max_bytes:
        raise HTTPException(
            status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            f"El archivo supera {max_bytes // (1024 * 1024)} MB",
        )
    if not _firma_valida(contenido, tipo):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "El contenido no coincide con el tipo de archivo"
        )

    ruta = f"{carpeta}/{uuid.uuid4().hex}{tipos_permitidos[tipo]}"
    endpoint = f"{url_base}/storage/v1/object/{bucket}/{ruta}"

    headers = {"apikey": clave, "Content-Type": tipo}
    # Las claves antiguas (JWT, empiezan con "eyJ") también van como Bearer.
    # Las nuevas (sb_secret_...) solo van en apikey.
    if clave.startswith("eyJ"):
        headers["Authorization"] = f"Bearer {clave}"

    async with httpx.AsyncClient(timeout=30) as cliente:
        respuesta = await cliente.post(endpoint, content=contenido, headers=headers)

    if respuesta.status_code not in (200, 201):

        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY, "No se pudo guardar el archivo en el almacenamiento"
        )

    return f"{url_base}/storage/v1/object/public/{bucket}/{ruta}"