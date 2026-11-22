from datetime import datetime, timezone
import json
import uuid
from sqlalchemy import Column, String, Integer, Float, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from services.api.app.core.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

class Project(Base):
    __tablename__ = "projects"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    organism = Column(String(255), nullable=False)
    taxonomy_id = Column(String(64), nullable=True)
    tags = Column(Text, default="[]")  # JSON list
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    assemblies = relationship("Assembly", back_populates="project", cascade="all, delete-orphan")

class Assembly(Base):
    __tablename__ = "assemblies"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False)
    name = Column(String(255), nullable=False)
    version = Column(String(64), nullable=False, default="v1")
    organism = Column(String(255), nullable=False)
    source = Column(String(64), nullable=False, default="Local Upload")
    source_accession = Column(String(128), nullable=True)
    filename = Column(String(255), nullable=False)
    file_path = Column(Text, nullable=False)
    file_size = Column(Integer, default=0)
    checksum = Column(String(128), nullable=True)
    input_format = Column(String(32), default="FASTA")
    assembly_type = Column(String(32), default="draft")  # draft, polished, chromosome, reference
    status = Column(String(32), default="ready")  # pending, processing, ready, failed
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    project = relationship("Project", back_populates="assemblies")
    metrics = relationship("AssemblyMetric", back_populates="assembly", uselist=False, cascade="all, delete-orphan")
    tool_results = relationship("ToolResult", back_populates="assembly", cascade="all, delete-orphan")

class AssemblyMetric(Base):
    __tablename__ = "assembly_metrics"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    assembly_id = Column(String(36), ForeignKey("assemblies.id"), unique=True, nullable=False)
    total_length = Column(Integer, nullable=False)
    sequence_count = Column(Integer, nullable=False)
    contig_count = Column(Integer, nullable=False)
    scaffold_count = Column(Integer, nullable=False)
    largest_contig = Column(Integer, nullable=False)
    smallest_contig = Column(Integer, nullable=False)
    mean_length = Column(Float, nullable=False)
    median_length = Column(Float, nullable=False)
    n50 = Column(Integer, nullable=False)
    l50 = Column(Integer, nullable=False)
    n90 = Column(Integer, nullable=False)
    l90 = Column(Integer, nullable=False)
    au_n = Column(Float, nullable=False)
    gc_percent = Column(Float, nullable=False)
    at_percent = Column(Float, nullable=False)
    n_percent = Column(Float, nullable=False)
    ambiguous_percent = Column(Float, nullable=False)
    total_gap_length = Column(Integer, default=0)
    gap_count = Column(Integer, default=0)
    raw_json = Column(Text, nullable=True)

    assembly = relationship("Assembly", back_populates="metrics")

class ToolResult(Base):
    __tablename__ = "tool_results"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    assembly_id = Column(String(36), ForeignKey("assemblies.id"), nullable=False)
    tool_name = Column(String(64), nullable=False)  # quast, busco, checkm2, minimap2
    status = Column(String(32), default="completed")
    results_json = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    assembly = relationship("Assembly", back_populates="tool_results")

class AnalysisJob(Base):
    __tablename__ = "analysis_jobs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    assembly_id = Column(String(36), nullable=False)
    project_id = Column(String(36), nullable=False)
    tool_name = Column(String(64), nullable=False)
    status = Column(String(32), default="queued")  # queued, running, completed, failed, cancelled
    stage = Column(String(128), default="Initialized")
    progress = Column(Integer, default=0)
    logs = Column(Text, default="")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    finished_at = Column(DateTime, nullable=True)

class ComparisonRecord(Base):
    __tablename__ = "comparisons"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), nullable=False)
    baseline_id = Column(String(36), nullable=False)
    compared_id = Column(String(36), nullable=False)
    summary_json = Column(Text, nullable=False)
    findings_json = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
