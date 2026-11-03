import uuid
from sqlalchemy import Column, String, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.config.database import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre = Column(String(150), nullable=False)
    correo = Column(String(150), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    rol = Column(String(30), nullable=False, default="estudiante")
    facultad = Column(String(150))
    carrera = Column(String(150))
    creado_en = Column(DateTime(timezone=True), server_default=func.now())

    anuncios = relationship("Anuncio", back_populates="usuario")