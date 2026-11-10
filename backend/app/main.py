from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config.database import Base, engine, get_db
from app import models
from app.routers import auth, categorias, usuarios, anuncios, archivos

Base.metadata.create_all(bind=engine)

app = FastAPI(title="UniAvisos API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:3000",
    "http://localhost:5173",
    "https://uni-avisos-web.vercel.app",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router)
app.include_router(categorias.router)
app.include_router(usuarios.router)
app.include_router(anuncios.router)
app.include_router(archivos.router)

@app.get("/")
def inicio():
    return {"mensaje": "UniAvisos API funcionando"}


@app.get("/api/health/db")
def probar_conexion(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"estado": "Conexión exitosa con Supabase"}