from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.models.usuario import Usuario
from app.schemas.auth import Token
from app.schemas.usuario import UsuarioOut
from app.services.auth import crear_token, get_usuario_actual
from app.services.seguridad import verificar_password

router = APIRouter(prefix="/api/auth", tags=["Autenticación"])


@router.post("/login", response_model=Token)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # En el formulario, "username" es el correo del usuario
    usuario = db.query(Usuario).filter(Usuario.correo == form.username).first()
    if not usuario or not verificar_password(form.password, usuario.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Correo o contraseña incorrectos")
    return Token(access_token=crear_token(usuario.id))


@router.get("/me", response_model=UsuarioOut)
def perfil(usuario: Usuario = Depends(get_usuario_actual)):
    return usuario