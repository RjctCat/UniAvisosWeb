from fastapi import FastAPI, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config.database import Base, engine, get_db
from app import models  # registra las tablas

# Crea las tablas en Supabase si no existen
Base.metadata.create_all(bind=engine)

app = FastAPI(title="UniAvisos API")


@app.get("/")
def inicio():
    return {"mensaje": "UniAvisos API funcionando"}


@app.get("/api/health/db")
def probar_conexion(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"estado": "Conexión exitosa con Supabase"}