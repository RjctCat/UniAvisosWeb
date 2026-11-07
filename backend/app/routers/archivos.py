from fastapi import APIRouter, Depends, File, UploadFile

from app.models.usuario import Usuario
from app.services.auth import requiere_roles
from app.services.storage import (
    MAX_IMAGEN,
    MAX_PDF,
    TIPOS_IMAGEN,
    TIPOS_PDF,
    subir_archivo,
)

router = APIRouter(prefix="/api/archivos", tags=["Archivos"])

puede_publicar = requiere_roles("publicador", "administrador")


@router.post("/imagen")
async def subir_imagen(
    archivo: UploadFile = File(...),
    _: Usuario = Depends(puede_publicar),
):
    url = await subir_archivo(archivo, "imagenes", TIPOS_IMAGEN, MAX_IMAGEN)
    return {"url": url}


@router.post("/pdf")
async def subir_pdf(
    archivo: UploadFile = File(...),
    _: Usuario = Depends(puede_publicar),
):
    url = await subir_archivo(archivo, "documentos", TIPOS_PDF, MAX_PDF)
    return {"url": url}