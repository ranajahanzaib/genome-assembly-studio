# Installation Guide — Genome Assembly Studio

Genome Assembly Studio can be run locally using native runtimes or deployed using Docker.

---

## 1. Prerequisites

- **Rust**: Version 1.80+ (`cargo` and `rustc`)
- **Python**: Version 3.11 or 3.12 (`python3` and `pip` / `uv`)
- **Node.js**: Version 20+ or 22+ (`node`) and `pnpm` (version 9 or 10)
- **External Bioinformatics Tools (Optional for extended pipelines)**:
  - `minimap2` (Sequence alignment)
  - `quast` (Assembly assessment)
  - `busco` (Ortholog completeness)
  - `checkm2` (Microbial quality)

---

## 2. Local Native Setup

### Step 1: Clone Repository

```bash
git clone https://github.com/ranajahanzaib/genome-assembly-studio.git
cd genome-assembly-studio
```

### Step 2: Build Rust Core Engine

```bash
cargo build --release
```

Verify the Rust binary:

```bash
./target/release/genome-studio --help
```

### Step 3: Setup Python Backend

Create a virtual environment and install dependencies:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Or using `uv`:

```bash
uv venv
uv pip install -r requirements.txt
```

### Step 4: Setup Web Frontend

```bash
pnpm install
pnpm --filter @genome-studio/ui build
pnpm --filter @genome-studio/visualization build
```

---

## 3. Running Development Servers

### Start FastAPI Backend:

```bash
source .venv/bin/activate
export PYTHONPATH=.
python3 -m uvicorn services.api.app.main:app --reload --port 8000
```

Backend will be live at `http://localhost:8000`.

### Start Next.js Web Application:

```bash
pnpm --filter web dev
```

Web application will be live at `http://localhost:3000`.

---

## 4. Generating Synthetic Fixtures

To generate or regenerate the built-in _E. coli_ test assemblies, GFA graphs, and alignments:

```bash
python3 scripts/generate_fixtures.py
```

This produces `datasets/fixtures/` containing:

- `reference.fasta`
- `draft_v1.fasta`
- `polished_v2.fasta`
- `assembly_graph.gfa`
- `v1_to_ref.paf` and `v2_to_ref.paf`
- Standard benchmark tool results (`quast_*.json`, `busco_*.json`, `checkm2_*.json`)
