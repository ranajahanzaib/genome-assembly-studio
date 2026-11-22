from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    organism: str
    taxonomy_id: Optional[str] = None
    tags: List[str] = Field(default_factory=list)

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    organism: Optional[str] = None
    taxonomy_id: Optional[str] = None
    tags: Optional[List[str]] = None

class ProjectResponse(ProjectBase):
    id: str
    created_at: datetime
    updated_at: datetime
    assembly_count: int = 0

    model_config = ConfigDict(from_attributes=True)

class MetricResponse(BaseModel):
    total_length: int
    sequence_count: int
    contig_count: int
    scaffold_count: int
    largest_contig: int
    smallest_contig: int
    mean_length: float
    median_length: float
    n50: int
    l50: int
    n90: int
    l90: int
    au_n: float
    gc_percent: float
    at_percent: float
    n_percent: float
    ambiguous_percent: float
    total_gap_length: int
    gap_count: int
    nx_values: Optional[List[Dict[str, Any]]] = None
    thresholds: Optional[List[Dict[str, Any]]] = None

class ToolResultResponse(BaseModel):
    tool_name: str
    status: str
    results: Dict[str, Any]
    created_at: datetime

class AssemblyResponse(BaseModel):
    id: str
    project_id: str
    name: str
    version: str
    organism: str
    source: str
    source_accession: Optional[str] = None
    filename: str
    file_size: int
    checksum: Optional[str] = None
    input_format: str
    assembly_type: str
    status: str
    error_message: Optional[str] = None
    created_at: datetime
    metrics: Optional[MetricResponse] = None

    model_config = ConfigDict(from_attributes=True)

class SequenceInfo(BaseModel):
    id: str
    name: str
    length: int
    gc_percent: float
    ambiguous_bases: int
    n_bases: int
    gap_count: int
    total_gap_length: int
    is_circular: bool = False

class JobResponse(BaseModel):
    id: str
    assembly_id: str
    project_id: str
    tool_name: str
    status: str
    stage: str
    progress: int
    logs: str
    created_at: datetime
    finished_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class ComparisonFinding(BaseModel):
    id: str
    category: str  # improvement, regression, tradeoff, neutral
    title: str
    description: str
    metric: Optional[str] = None
    evidence: str

class MetricDelta(BaseModel):
    metric: str
    baseline_value: float
    compared_value: float
    absolute_delta: float
    percent_delta: float
    improvement_direction: str  # higher_better, lower_better, neutral
    is_improvement: bool
    is_regression: bool

class ComparisonResponse(BaseModel):
    id: str
    project_id: str
    baseline_id: str
    compared_id: str
    baseline_name: str
    compared_name: str
    deltas: List[MetricDelta]
    findings: List[ComparisonFinding]
    created_at: datetime

class ToolStatus(BaseModel):
    tool: str
    name: str
    available: bool
    version: Optional[str] = None
    path: Optional[str] = None
    description: str
    database_status: Optional[str] = None
    instructions: Optional[str] = None
