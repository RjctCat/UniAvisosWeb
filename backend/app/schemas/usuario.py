from datetime import datetime
from typing import Literal
from uuid import UUID
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UsuarioCreate(BaseModel):
    nombre: str = Field(min_length=2, max_length=150)
    correo: EmailStr
    password: str = Field(min_length=8, max_length=72)
    facultad: str | None = None
    carrera: str | None = None


class UsuarioUpdate(BaseModel):
    nombre: str | None = Field(default=None, min_length=2, max_length=150)
    facultad: str | None = None
    carrera: str | None = None


class RolUpdate(BaseModel):
    rol: Literal["estudiante", "publicador", "administrador"]


class UsuarioOut(BaseModel):
    id: UUID
    nombre: str
    correo: EmailStr
    rol: str
    facultad: str | None
    carrera: str | None
    creado_en: datetime

    model_config = ConfigDict(from_attributes=True)