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


class UsuarioAdminCreate(UsuarioCreate):
    rol: Literal["estudiante", "publicador", "administrador"] = "estudiante"


class UsuarioUpdate(BaseModel):
    nombre: str | None = Field(default=None, min_length=2, max_length=150)
    correo: EmailStr | None = None
    facultad: str | None = None
    carrera: str | None = None


class UsuarioAdminUpdate(UsuarioUpdate):
    password: str | None = Field(default=None, min_length=8, max_length=72)
    rol: Literal["estudiante", "publicador", "administrador"] = "estudiante"


class RolUpdate(BaseModel):
    rol: Literal["estudiante", "publicador", "administrador"]


class CambiarPassword(BaseModel):
    password_actual: str = Field(min_length=1, max_length=72)
    password_nueva: str = Field(min_length=8, max_length=72)


class UsuarioOut(BaseModel):
    id: UUID
    nombre: str
    correo: EmailStr
    rol: str
    facultad: str | None
    carrera: str | None
    creado_en: datetime

    model_config = ConfigDict(from_attributes=True)