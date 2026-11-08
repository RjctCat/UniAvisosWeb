import uuid
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, func, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.config.database import Base


class Anuncio(Base):
    __tablename__ = "anuncios"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    titulo = Column(String(200), nullable=False)
    resumen = Column(Text)
    contenido = Column(Text, nullable=False)
    categoria_id = Column(UUID(as_uuid=True), ForeignKey("categorias.id"), nullable=False)
    usuario_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=False)
    facultad = Column(String(150))
    carrera = Column(String(150))
    importancia = Column(String(20), default="normal")
    imagen_url = Column(Text)
    archivo_url = Column(Text)
    fecha_publicacion = Column(DateTime(timezone=True), server_default=func.now())
    fecha_vencimiento = Column(DateTime(timezone=True))
    creado_en = Column(DateTime(timezone=True), server_default=func.now())
    tipo = Column(String(20), nullable=False, default="note", server_default="note")
    pin = Column(String(20), nullable=False, default="pin-red", server_default="pin-red")
    pos_x = Column(Integer)
    pos_y = Column(Integer)
    rotacion = Column(Integer, nullable=False, default=0, server_default="0")
    z_index = Column(Integer, nullable=False, default=1, server_default="1")

    usuario = relationship("Usuario", back_populates="anuncios")
    categoria = relationship("Categoria", back_populates="anuncios")
