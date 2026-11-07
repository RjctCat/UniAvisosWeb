import os
from datetime import datetime, timedelta, timezone
from uuid import UUID

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.models.usuario import Usuario

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("Falta la variable SECRET_KEY en el archivo .env")

ALGORITMO = "HS256"
MINUTOS_EXPIRACION = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def crear_token(usuario_id: UUID) -> str:
    expira = datetime.now(timezone.utc) + timedelta(minutes=MINUTOS_EXPIRACION)
    payload = {"sub": str(usuario_id), "exp": expira}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITMO)


def get_usuario_actual(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Usuario:
    error = HTTPException(
        status.HTTP_401_UNAUTHORIZED,
        "Token inválido o expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITMO])
        usuario_id = UUID(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        raise error

    usuario = db.get(Usuario, usuario_id)
    if not usuario:
        raise error
    return usuario


def requiere_roles(*roles: str):
    def verificador(usuario: Usuario = Depends(get_usuario_actual)) -> Usuario:
        if usuario.rol not in roles:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "No tienes permisos para esta acción")
        return usuario
    return verificador