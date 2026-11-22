# Data Model & Storage Specifications — Genome Assembly Studio

Genome Assembly Studio maintains relational persistence for project hierarchies and metadata, alongside high-speed binary and flat-file indices for fast sequence slicing and track queries.

---

## 1. Relational Entities (SQLAlchemy & Database)

### `projects`

Organizes multi-assembly investigations, clinical isolates, or benchmark studies.

- `id` (String, Primary Key): Unique UUID or slug identifier.
- `name` (String, Non-null): Human-readable project title.
- `description` (Text): Project background, organism details, sequencing technology notes.
- `organism` (String): Scientific name (e.g., _Escherichia coli_, _Homo sapiens_).
- `reference_genome_path` (String, Nullable): Local path to FASTA reference genome.
- `created_at` (DateTime): Creation timestamp.
- `updated_at` (DateTime): Last modification timestamp.

### `assemblies`

Represents an individual genome assembly version (e.g., Canu draft, Flye polished, Medaka consensus).

- `id` (String, Primary Key): Unique identifier.
- `project_id` (String, Foreign Key -> `projects.id`): Parent project.
- `name` (String, Non-null): Assembly designation (e.g., `ecoli_draft_v1`).
- `version` (String): Version label (e.g., `v1.0.0`).
- `assembly_type` (String): `draft`, `polished`, `scaffold`, `chromosome`, or `reference`.
- `fasta_path` (String, Non-null): Absolute file path to assembly FASTA.
- `gfa_path` (String, Nullable): Optional assembly graph path.
- `paf_path` (String, Nullable): Optional pairwise alignment against project reference.
- `created_at` (DateTime): Ingestion timestamp.

### `assembly_metrics`

Analytical metrics calculated by the Rust core engine and external integrations.

- `id` (String, Primary Key): Unique identifier.
- `assembly_id` (String, Foreign Key -> `assemblies.id`, Unique): Associated assembly.
- `total_length` (BigInteger): Total assembled base pairs.
- `sequence_count` (Integer): Total fasta records.
- `contig_count` (Integer): Total contiguous sequences broken by gaps.
- `n50` (Integer): N50 metric length.
- `l50` (Integer): L50 sequence count.
- `n90` (Integer): N90 metric length.
- `l90` (Integer): L90 sequence count.
- `aun` (Float): Area under the Nx curve.
- `gc_percent` (Float): Base GC percentage.
- `gap_count` (Integer): Number of uncalled scaffold gaps.
- `total_gap_length` (BigInteger): Total 'N' bases in gaps.
- `largest_contig` (BigInteger): Length of the longest contig.
- `busco_complete` (Float, Nullable): BUSCO completeness score.
- `checkm2_completeness` (Float, Nullable): CheckM2 completeness score.
- `checkm2_contamination` (Float, Nullable): CheckM2 contamination score.
- `genome_fraction` (Float, Nullable): QUAST aligned reference fraction.
- `raw_json` (Text, JSON): Complete metrics payload including base distribution ($A, C, G, T, N$), Nx spectrums, and gap lists.

### `analysis_jobs`

Lifecycle tracking for asynchronous analysis executions.

- `id` (String, Primary Key): Unique job identifier.
- `project_id` (String, Foreign Key -> `projects.id`): Target project.
- `pipeline_type` (String): `core-metrics`, `quast`, `busco`, `checkm2`, `minimap2-align`, `full-assessment`.
- `status` (String): `pending`, `running`, `completed`, `failed`, `cancelled`.
- `progress` (Integer): Progress percentage (0 - 100).
- `current_step` (String): Human-readable current operation description.
- `logs` (Text): Timestamped execution stdout/stderr logs.
- `created_at` (DateTime): Job creation timestamp.
- `started_at` (DateTime, Nullable): Execution start timestamp.
- `completed_at` (DateTime, Nullable): Completion timestamp.

---

## 2. Genomic File Formats Supported

| Format  | Extension               | Engine Parser        | Description                                                             |
| ------- | ----------------------- | -------------------- | ----------------------------------------------------------------------- |
| FASTA   | `.fasta`, `.fa`, `.fna` | `sequence-io::fasta` | Nucleotide sequence records with headers.                               |
| FASTQ   | `.fastq`, `.fq`         | `sequence-io::fastq` | Sequence reads with quality scores.                                     |
| GFA 1.0 | `.gfa`                  | `sequence-io::gfa`   | Graphical Fragment Assembly (Segment `S` & Link `L` records).           |
| PAF     | `.paf`                  | `sequence-io::paf`   | Pairwise mappers output (minimap2) coordinate blocks.                   |
| FAI     | `.fai`                  | `genome-index::fai`  | Samtools-compatible linear sequence index (length, offset, line bases). |
