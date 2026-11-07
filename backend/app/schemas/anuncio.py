from datetime import datetime
from typing import Literal
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.categoria import CategoriaOut

Importancia = Literal["normal", "importante", "urgente"]


class AnuncioCreate(BaseModel):
    titulo: str = Field(min_length=3, max_length=200)
    resumen: str | None = None
    contenido: str = Field(min_length=1)
    categoria_id: UUID
    facultad: str | None = None
    carrera: str | None = None
    importancia: Importancia = "normal"
    imagen_url: str | None = None
    archivo_url: str | None = None
    fecha_publicacion: datetime | None = None
    fecha_vencimiento: datetime | None = None


class AnuncioUpdate(BaseModel):
    titulo: str | None = Field(default=None, min_length=3, max_length=200)
    resumen: str | None = None
    contenido: str | None = None
    categoria_id: UUID | None = None
    facultad: str | None = None
    carrera: str | None = None
    importancia: Importancia | None = None
    imagen_url: str | None = None
    archivo_url: str | None = None
    fecha_publicacion: datetime | None = None
    fecha_vencimiento: datetime | None = None


class AnuncioOut(BaseModel):
    id: UUID
    titulo: str
    resumen: str | None
    contenido: str
    categoria_id: UUID
    usuario_id: UUID
    facultad: str | None
    carrera: str | None
    importancia: str
    imagen_url: str | None
    archivo_url: str | None
    fecha_publicacion: datetime | None
    fecha_vencimiento: datetime | None
    creado_en: datetime
    categoria: CategoriaOut | None = None

    model_config = ConfigDict(from_attributes=True)