from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.models.usuario import Usuario
from app.schemas.usuario import (
    CambiarPassword,
    RolUpdate,
    UsuarioAdminCreate,
    UsuarioAdminUpdate,
    UsuarioCreate,
    UsuarioOut,
    UsuarioUpdate,
)
from app.services.auth import get_usuario_actual, requiere_roles
from app.services.seguridad import hashear_password, verificar_password

router = APIRouter(prefix="/api/usuarios", tags=["Usuarios"])


def obtener_o_404(db: Session, usuario_id: UUID) -> Usuario:
    usuario = db.get(Usuario, usuario_id)
    if not usuario:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Usuario no encontrado")
    return usuario


def verificar_acceso_propio(actual: Usuario, usuario_id: UUID):
    if actual.rol != "administrador" and actual.id != usuario_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "No tienes permisos para esta acción")


@router.post("", response_model=UsuarioOut, status_code=status.HTTP_201_CREATED)
def registrar(datos: UsuarioCreate, db: Session = Depends(get_db)):
    if db.query(Usuario).filter(Usuario.correo == datos.correo).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "El correo ya está registrado")
    usuario = Usuario(
        nombre=datos.nombre,
        correo=datos.correo,
        password_hash=hashear_password(datos.password),
        rol="estudiante",
        facultad=datos.facultad,
        carrera=datos.carrera,
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario


@router.post("/admin", response_model=UsuarioOut, status_code=status.HTTP_201_CREATED)
def registrar_desde_admin(
    datos: UsuarioAdminCreate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(requiere_roles("administrador")),
):
    if db.query(Usuario).filter(Usuario.correo == datos.correo).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "El correo ya está registrado")
    usuario = Usuario(
        nombre=datos.nombre,
        correo=datos.correo,
        password_hash=hashear_password(datos.password),
        rol=datos.rol,
        facultad=datos.facultad,
        carrera=datos.carrera,
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario


@router.get("", response_model=list[UsuarioOut])
def listar(
    db: Session = Depends(get_db),
    _: Usuario = Depends(requiere_roles("administrador")),
):
    return db.query(Usuario).order_by(Usuario.nombre).all()


@router.get("/{usuario_id}", response_model=UsuarioOut)
def detalle(
    usuario_id: UUID,
    db: Session = Depends(get_db),
    actual: Usuario = Depends(get_usuario_actual),
):
    verificar_acceso_propio(actual, usuario_id)
    return obtener_o_404(db, usuario_id)


@router.put("/{usuario_id}", response_model=UsuarioOut)
def actualizar(
    usuario_id: UUID,
    datos: UsuarioUpdate,
    db: Session = Depends(get_db),
    actual: Usuario = Depends(get_usuario_actual),
):
    verificar_acceso_propio(actual, usuario_id)
    usuario = obtener_o_404(db, usuario_id)
    cambios = datos.model_dump(exclude_unset=True)
    if "correo" in cambios and cambios["correo"] is None:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "El correo no puede quedar vacío")
    if "correo" in cambios and db.query(Usuario).filter(
        Usuario.correo == cambios["correo"], Usuario.id != usuario_id
    ).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "El correo ya está registrado")
    for campo, valor in cambios.items():
        setattr(usuario, campo, valor)
    db.commit()
    db.refresh(usuario)
    return usuario


@router.put("/{usuario_id}/admin", response_model=UsuarioOut)
def actualizar_desde_admin(
    usuario_id: UUID,
    datos: UsuarioAdminUpdate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(requiere_roles("administrador")),
):
    usuario = obtener_o_404(db, usuario_id)
    cambios = datos.model_dump(exclude_unset=True)
    if "correo" in cambios and cambios["correo"] is None:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "El correo no puede quedar vacío")
    if "correo" in cambios and db.query(Usuario).filter(
        Usuario.correo == cambios["correo"], Usuario.id != usuario_id
    ).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "El correo ya está registrado")
    password = cambios.pop("password", None)
    for campo, valor in cambios.items():
        setattr(usuario, campo, valor)
    if password:
        usuario.password_hash = hashear_password(password)
    db.commit()
    db.refresh(usuario)
    return usuario


@router.put("/{usuario_id}/password", status_code=status.HTTP_204_NO_CONTENT)
def cambiar_password(
    usuario_id: UUID,
    datos: CambiarPassword,
    db: Session = Depends(get_db),
    actual: Usuario = Depends(get_usuario_actual),
):
    verificar_acceso_propio(actual, usuario_id)
    usuario = obtener_o_404(db, usuario_id)
    if not verificar_password(datos.password_actual, usuario.password_hash):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "La contraseña actual es incorrecta")
    usuario.password_hash = hashear_password(datos.password_nueva)
    db.commit()


@router.delete("/{usuario_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(
    usuario_id: UUID,
    db: Session = Depends(get_db),
    actual: Usuario = Depends(requiere_roles("administrador")),
):
    usuario = obtener_o_404(db, usuario_id)
    if usuario.id == actual.id:
        raise HTTPException(status.HTTP_409_CONFLICT, "No puedes eliminar tu propia cuenta")
    if usuario.anuncios:
        raise HTTPException(status.HTTP_409_CONFLICT, "El usuario tiene anuncios asociados")
    db.delete(usuario)
    db.commit()


@router.put("/{usuario_id}/rol", response_model=UsuarioOut)
def cambiar_rol(
    usuario_id: UUID,
    datos: RolUpdate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(requiere_roles("administrador")),
):
    usuario = obtener_o_404(db, usuario_id)
    usuario.rol = datos.rol
    db.commit()
    db.refresh(usuario)
    return usuario