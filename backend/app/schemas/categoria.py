from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class CategoriaCreate(BaseModel):
    nombre: str = Field(min_length=2, max_length=100)
    descripcion: str | None = None


class CategoriaUpdate(BaseModel):
    nombre: str | None = Field(default=None, min_length=2, max_length=100)
    descripcion: str | None = None


class CategoriaOut(BaseModel):
    id: UUID
    nombre: str
    descripcion: str | None
    creado_en: datetime

    model_config = ConfigDict(from_attributes=True)