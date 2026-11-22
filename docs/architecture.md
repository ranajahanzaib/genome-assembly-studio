# System Architecture — Genome Assembly Studio

Genome Assembly Studio is structured as an integrated, multi-tier genomic computing and visualization platform. It combines low-level Rust sequence processing for microsecond-scale assembly indexation and metric calculations, a high-throughput Python FastAPI backend for analytical pipelines and database persistence, and a modern Next.js 15 / React 19 web application featuring custom D3 and Canvas scientific visualizations.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Next.js 15 Web Workspace                        │
│    Overview • Projects • Assemblies • Compare • Explorer • Quality    │
│    Analysis Jobs • Data Sources • Settings • Contextual Inspector      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / JSON API
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      FastAPI Scientific Backend                        │
│  Projects • Assemblies • Comparisons • Analysis Pipeline • Tools API   │
│  Automated Findings Engine • SQLite / PostgreSQL • Background Workers  │
└──────────────┬──────────────────────────────────────────┬──────────────┘
               │ Native Subprocess Exec                   │ Process Wrappers
               ▼                                          ▼
┌───────────────────────────────────┐    ┌───────────────────────────────┐
│     Rust Core Sequence Engine     │    │  External Tool Integrations   │
│ (assembly-core, sequence-io,      │    │  QUAST • BUSCO • CheckM2      │
│  assembly-stats, genome-index,    │    │  minimap2 • Bandage GFA       │
│  genome-tiles, assembly-cli)      │    └───────────────────────────────┘
└───────────────────────────────────┘
```

---

## 1. Monorepo Organization

```text
genome-assembly-studio/
├── apps/
│   └── web/                     # Next.js 15 (App Router), React 19, Tailwind CSS, Lucide
├── packages/
│   ├── ui/                      # Accessible UI components (Button, Card, Badge, MetricCard)
│   └── visualization/           # Scientific graphics (GenomeCircos, DotPlot, GFA Graph, Linear Browser, NxCurve)
├── crates/
│   ├── assembly-core/           # Fundamental genomic traits, Contig, Gap, Alignment representations
│   ├── sequence-io/             # High-speed FASTA/FASTQ/GFA/PAF streaming and chunking parsers
│   ├── assembly-stats/          # N50, L50, auN, GC-content, Nx distribution, cumulative curves
│   ├── genome-index/            # Binary sequence indexing with FAI/2bit support and sequence slicing
│   ├── genome-tiles/            # Sliding window statistics (GC skew, coverage, tile generation)
│   └── assembly-cli/            # Unified CLI binary (`genome-studio`)
├── services/
│   ├── api/                     # FastAPI backend application with SQLAlchemy models and REST endpoints
│   └── worker/                  # Analysis pipelines, adapters, parsers, and job workers
├── datasets/
│   ├── fixtures/                # Synthetic E. coli assemblies (draft v1, polished v2, reference, GFA, PAF)
│   └── manifests/               # Dataset registry metadata (NCBI, GTDB, OpenGenome2)
├── infra/
│   ├── docker/                  # Multi-stage Dockerfiles for API and Web
│   └── compose/                 # Docker Compose development and production overlays
├── docs/                        # Architecture, Methodology, Data Model, API, and User Guides
└── scripts/                     # Fixture generator, setup helpers, and benchmarks
```

---

## 2. Rust Performance Engine

The Rust workspace (`crates/`) delivers memory-efficient, deterministic sequence processing:

- **`sequence-io`**: Streaming buffered FASTA, GFA 1.0, and PAF parsers capable of handling gigabase-scale assemblies without out-of-memory errors.
- **`assembly-stats`**: Computes contiguous assembly statistics:
  - Total length, contig count, scaffold count, sequence count.
  - Length-weighted metrics: **N50, L50, N90, L90, auN (area under Nx curve)**.
  - Sequence composition: Exact base counts (A, C, G, T, N, IUPAC ambiguous), GC percentage.
  - Gap topology: Gap count, total uncalled bases, minimum/maximum/median gap lengths.
  - Nx distribution spectrum from $N_{10}$ to $N_{90}$ in 5% increments.
- **`genome-index`**: Rapid indexed random-access binary index for multi-gigabase genomes, providing sub-millisecond retrieval of sequence slices.
- **`genome-tiles`**: Sliding window generation for circular chromosome tracks and linear genome browsers, calculating GC percentage and GC skew (`(G - C) / (G + C)`).
- **`assembly-cli`**: High-performance CLI interface (`genome-studio`) supporting `analyze`, `index`, `slice`, `profile`, `graph-stats`, and `align-stats`.

---

## 3. Python API & Scientific Service

Built on Python 3.12, FastAPI, SQLAlchemy 2.0, and Pydantic v2:

- **RESTful Endpoints**:
  - `/api/v1/projects`: Project management and multi-assembly workspaces.
  - `/api/v1/assemblies`: FASTA/FASTQ/GFA upload, automated Rust analysis, sequence indexing, GC profiles, chromosome circular tracks, synteny alignments, and sequence slicing.
  - `/api/v1/comparisons`: Multi-assembly delta computation with the **Automated Findings Engine** (evaluating continuity, completeness, error rates, and structural trade-offs).
  - `/api/v1/analyses`: Long-running job lifecycle with step-by-step progress tracking, log capture, and cancellation support.
  - `/api/v1/tools`: System-wide tool detection and version verification for `genome-studio`, `quast`, `busco`, `checkm2`, and `minimap2`.
  - `/api/v1/datasets`: Public genomic repository catalogues (NCBI Assembly, GTDB, OpenGenome2) and synthetic fixture seeding.
- **Scientific Integrations**:
  - Direct execution of external tools (QUAST, BUSCO, CheckM2, minimap2) when available in the environment.
  - Clean error states distinguishing missing external binaries from pipeline failures.

---

## 4. Frontend & Interactive Visualization Layer

- **Next.js 15 (App Router) & React 19**: Pure client-side streaming data hydration with TanStack Query concepts and lightweight Zustand global state.
- **Scientific Visualizations**:
  - **`GenomeCircos`**: Multi-track circular chromosome wheel with cytoband layout, sliding-window GC content, and synteny ribbons.
  - **`AssemblyDotPlot`**: High-density synteny dot plot displaying forward (blue) and reverse (rose) alignment blocks with interactive hover tooltips.
  - **`AssemblyGraphViewer`**: Force-directed topological graph renderer for GFA assembly graphs, highlighting connected components, dead ends, and bubble structures.
  - **`GenomeTrackBrowser`**: Multi-scale linear chromosome browser with nucleotide-level sequence rendering when zoomed below 120 bp.
  - **`NxCurve` & `CumulativeLengthChart`**: Comparative continuity curves for N10..N90 spectrums with reference target guides.
  - **`BuscoStackedChart`**: Ortholog completeness breakdown (Single, Duplicated, Fragmented, Missing).
  - **`QualityMatrix`**: Metric heatmap matrix with dynamic delta badges and CSV export.
