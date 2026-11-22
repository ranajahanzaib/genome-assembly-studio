from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from services.api.app.core.config import settings
from services.api.app.core.database import engine, Base, SessionLocal
from services.api.app.api.v1.health import router as health_router
from services.api.app.api.v1.projects import router as projects_router
from services.api.app.api.v1.assemblies import router as assemblies_router
from services.api.app.api.v1.comparisons import router as comparisons_router
from services.api.app.api.v1.analyses import router as analyses_router
from services.api.app.api.v1.tools import router as tools_router
from services.api.app.api.v1.datasets import router as datasets_router, seed_demo_project

# Create tables
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure demo project exists
    db = SessionLocal()
    try:
        seed_demo_project(db)
    except Exception as e:
        print(f"Warning: Demo seeding encountered: {e}")
    finally:
        db.close()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix=settings.API_V1_STR, tags=["Health"])
app.include_router(projects_router, prefix=f"{settings.API_V1_STR}/projects", tags=["Projects"])
app.include_router(assemblies_router, prefix=f"{settings.API_V1_STR}/assemblies", tags=["Assemblies"])
app.include_router(comparisons_router, prefix=f"{settings.API_V1_STR}/comparisons", tags=["Comparisons"])
app.include_router(analyses_router, prefix=f"{settings.API_V1_STR}/analyses", tags=["Analyses"])
app.include_router(tools_router, prefix=f"{settings.API_V1_STR}/tools", tags=["Tools"])
app.include_router(datasets_router, prefix=f"{settings.API_V1_STR}/datasets", tags=["Datasets"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("services.api.app.main:app", host="0.0.0.0", port=8000, reload=True)
