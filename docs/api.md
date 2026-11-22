# API Reference — Genome Assembly Studio

The Genome Assembly Studio backend exposes a standardized OpenAPI/REST API under `/api/v1`. Interactive documentation is available via Swagger UI at `http://localhost:8000/docs` and ReDoc at `http://localhost:8000/redoc`.

---

## 1. System Health & Environment

### `GET /api/v1/health`

Checks backend responsiveness, database connectivity, and Rust binary availability.

- **Response**:

```json
{
  "status": "ok",
  "version": "0.1.0",
  "database": "connected",
  "rust_engine": "available",
  "timestamp": "2026-11-22T06:20:00Z"
}
```

### `GET /api/v1/tools`

Lists the detection status, executable paths, and versions for all integrated bioinformatics tools.

- **Response Fields**:
  - `tools`: Array of objects (`name`, `installed`, `path`, `version`, `required`).

---

## 2. Projects API

### `GET /api/v1/projects`

Retrieves all user projects with assembly counts and creation timestamps.

### `POST /api/v1/projects`

Creates a new project.

- **Payload**:

```json
{
  "name": "E. coli Benchmark Study",
  "description": "Comparative assembly analysis using Oxford Nanopore and Illumina reads",
  "organism": "Escherichia coli",
  "reference_genome_path": "/data/reference.fasta"
}
```

### `GET /api/v1/projects/{project_id}`

Fetches project details along with all nested assemblies.

### `DELETE /api/v1/projects/{project_id}`

Deletes the project and cascades deletion to associated assemblies, metrics, and jobs.

---

## 3. Assemblies API

### `GET /api/v1/assemblies?project_id={id}`

Lists assemblies belonging to a project.

### `POST /api/v1/assemblies/upload`

Uploads a new genomic assembly (multipart/form-data) and initiates immediate Rust sequence indexing and metrics calculation.

- **Form Parameters**:
  - `file`: FASTA or FASTQ file
  - `name`: Assembly designation
  - `version`: Version string (e.g., `v1`)
  - `assembly_type`: `draft`, `polished`, `scaffold`, or `reference`
  - `project_id`: Target project identifier

### `GET /api/v1/assemblies/{assembly_id}/metrics`

Returns contiguity statistics (N50, L50, auN, GC%), gap topologies, and external tool results.

### `GET /api/v1/assemblies/{assembly_id}/sequences`

Returns a list of all sequences/contigs with lengths and GC percentages.

### `GET /api/v1/assemblies/{assembly_id}/wheel`

Generates circular chromosome tracks (cytobands, sliding GC bins, synteny ribbons) for the Circos visualizer.

### `GET /api/v1/assemblies/{assembly_id}/graph`

Retrieves parsed GFA nodes (segments) and edges (links) with topological metrics.

### `GET /api/v1/assemblies/{assembly_id}/alignments`

Retrieves PAF synteny blocks between the assembly and the project reference.

### `GET /api/v1/assemblies/{assembly_id}/slice?sequence={id}&start={pos}&end={pos}`

Extracts a sub-sequence slice from indexed FASTA via Rust sub-millisecond retrieval.

---

## 4. Multi-Assembly Comparison API

### `GET /api/v1/comparisons?assembly_ids={id1},{id2}`

Computes pairwise or multi-way deltas and runs the **Automated Decision Engine** to return findings.

- **Response**:

```json
{
  "assemblies": [...],
  "metrics_matrix": [...],
  "findings": {
    "improvements": ["N50 increased by 300.0% (16,000 bp vs 4,000 bp)", "Gaps eliminated: 0 vs 1"],
    "regressions": [],
    "tradeoffs": []
  }
}
```

---

## 5. Analysis Pipeline API

### `POST /api/v1/analyses/run`

Queues a background scientific assessment job.

- **Payload**:

```json
{
  "project_id": "proj_123",
  "pipeline_type": "full-assessment",
  "assembly_ids": ["asm_v1", "asm_v2"]
}
```

### `GET /api/v1/analyses/{job_id}`

Returns job status (`pending`, `running`, `completed`, `failed`), progress percentage (0 - 100), current operation step, and console logs.

### `POST /api/v1/analyses/{job_id}/cancel`

Cancels a running analysis job.

---

## 6. Datasets & Seed API

### `GET /api/v1/datasets/repositories`

Lists connected scientific genome repositories (NCBI Assembly, GTDB, OpenGenome2).

### `POST /api/v1/datasets/seed-demo`

Pre-populates the workspace with the built-in _Escherichia coli_ benchmark dataset (reference, draft v1, polished v2, GFA assembly graph, synteny alignments, and BUSCO/CheckM2/QUAST results).
