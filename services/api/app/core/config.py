import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Genome Assembly Studio"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./genome_studio.db")
    STORAGE_DIR: str = os.getenv("STORAGE_DIR", os.path.abspath("./data/storage"))
    FIXTURES_DIR: str = os.getenv("FIXTURES_DIR", os.path.abspath("./datasets/fixtures"))
    RUST_CLI_PATH: str = os.getenv("RUST_CLI_PATH", os.path.abspath("./target/debug/genome-studio"))
    
    # Tool executables
    QUAST_BIN: str = os.getenv("QUAST_BIN", "quast")
    BUSCO_BIN: str = os.getenv("BUSCO_BIN", "busco")
    CHECKM2_BIN: str = os.getenv("CHECKM2_BIN", "checkm2")
    MINIMAP2_BIN: str = os.getenv("MINIMAP2_BIN", "minimap2")

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
os.makedirs(settings.STORAGE_DIR, exist_ok=True)

