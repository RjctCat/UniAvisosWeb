from datetime import datetime, timezone
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.config.database import get_db
from app.models.anuncio import Anuncio
from app.models.categoria import Categoria
from app.models.usuario import Usuario
from app.schemas.anuncio import AnuncioCreate, AnuncioUpdate, AnuncioOut, Importancia
from app.services.auth import requiere_roles

router = APIRouter(prefix="/api/anuncios", tags=["Anuncios"])

puede_publicar = requiere_roles("publicador", "administrador")


def obtener_o_404(db: Session, anuncio_id: UUID) -> Anuncio:
    anuncio = db.get(Anuncio, anuncio_id)
    if not anuncio:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Anuncio no encontrado")
    return anuncio


def verificar_propiedad(anuncio: Anuncio, usuario: Usuario):
    if usuario.rol != "administrador" and anuncio.usuario_id != usuario.id:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, "Solo puedes gestionar tus propios anuncios"
        )


@router.get("", response_model=list[AnuncioOut])
def listar(
    q: str | None = Query(None, description="Buscar por título"),
    categoria_id: UUID | None = None,
    facultad: str | None = None,
    carrera: str | None = None,
    importancia: Importancia | None = None,
    solo_vigentes: bool = True,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    consulta = db.query(Anuncio).options(joinedload(Anuncio.categoria))

    if q:
        consulta = consulta.filter(Anuncio.titulo.ilike(f"%{q}%"))
    if categoria_id:
        consulta = consulta.filter(Anuncio.categoria_id == categoria_id)
    if facultad:
        consulta = consulta.filter(Anuncio.facultad == facultad)
    if carrera:
        consulta = consulta.filter(Anuncio.carrera == carrera)
    if importancia:
        consulta = consulta.filter(Anuncio.importancia == importancia)
    if solo_vigentes:
        ahora = datetime.now(timezone.utc)
        consulta = consulta.filter(
            Anuncio.fecha_publicacion <= ahora,
            or_(Anuncio.fecha_vencimiento.is_(None), Anuncio.fecha_vencimiento > ahora),
        )

    return (
        consulta.order_by(Anuncio.fecha_publicacion.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/{anuncio_id}", response_model=AnuncioOut)
def detalle(anuncio_id: UUID, db: Session = Depends(get_db)):
    return obtener_o_404(db, anuncio_id)


@router.post("", response_model=AnuncioOut, status_code=status.HTTP_201_CREATED)
def crear(
    datos: AnuncioCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(puede_publicar),
):
    if not db.get(Categoria, datos.categoria_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "La categoría no existe")

    anuncio = Anuncio(**datos.model_dump(exclude_none=True), usuario_id=usuario.id)
    db.add(anuncio)
    db.commit()
    db.refresh(anuncio)
    return anuncio


@router.put("/{anuncio_id}", response_model=AnuncioOut)
def actualizar(
    anuncio_id: UUID,
    datos: AnuncioUpdate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(puede_publicar),
):
    anuncio = obtener_o_404(db, anuncio_id)
    verificar_propiedad(anuncio, usuario)

    cambios = datos.model_dump(exclude_unset=True)
    if "categoria_id" in cambios and not db.get(Categoria, cambios["categoria_id"]):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "La categoría no existe")

    for campo, valor in cambios.items():
        setattr(anuncio, campo, valor)
    db.commit()
    db.refresh(anuncio)
    return anuncio


@router.delete("/{anuncio_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(
    anuncio_id: UUID,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(puede_publicar),
):
    anuncio = obtener_o_404(db, anuncio_id)
    verificar_propiedad(anuncio, usuario)
    db.delete(anuncio)
    db.commit()