from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.models.categoria import Categoria
from app.models.usuario import Usuario
from app.schemas.categoria import CategoriaCreate, CategoriaUpdate, CategoriaOut
from app.services.auth import requiere_roles

router = APIRouter(prefix="/api/categorias", tags=["Categorías"])

solo_admin = requiere_roles("administrador")


def obtener_o_404(db: Session, categoria_id: UUID) -> Categoria:
    categoria = db.get(Categoria, categoria_id)
    if not categoria:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Categoría no encontrada")
    return categoria


@router.get("", response_model=list[CategoriaOut])
def listar(db: Session = Depends(get_db)):
    return db.query(Categoria).order_by(Categoria.nombre).all()


@router.get("/{categoria_id}", response_model=CategoriaOut)
def detalle(categoria_id: UUID, db: Session = Depends(get_db)):
    return obtener_o_404(db, categoria_id)


@router.post("", response_model=CategoriaOut, status_code=status.HTTP_201_CREATED)
def crear(
    datos: CategoriaCreate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(solo_admin),
):
    categoria = Categoria(**datos.model_dump())
    db.add(categoria)
    db.commit()
    db.refresh(categoria)
    return categoria


@router.put("/{categoria_id}", response_model=CategoriaOut)
def actualizar(
    categoria_id: UUID,
    datos: CategoriaUpdate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(solo_admin),
):
    categoria = obtener_o_404(db, categoria_id)
    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(categoria, campo, valor)
    db.commit()
    db.refresh(categoria)
    return categoria


@router.delete("/{categoria_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(
    categoria_id: UUID,
    db: Session = Depends(get_db),
    _: Usuario = Depends(solo_admin),
):
    categoria = obtener_o_404(db, categoria_id)
    if categoria.anuncios:
        raise HTTPException(status.HTTP_409_CONFLICT, "La categoría tiene anuncios asociados")
    db.delete(categoria)
    db.commit()