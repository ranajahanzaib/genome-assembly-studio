# Contributing to Genome Assembly Studio

Thank you for your interest in contributing to **Genome Assembly Studio**! We welcome contributions ranging from bug reports and documentation enhancements to new scientific visualizations and algorithm optimizations.

---

## Code of Conduct

All contributors and participants are expected to adhere to our [Code of Conduct](CODE_OF_CONDUCT.md). Please report unacceptable behavior through GitHub Private Security Advisories.

---

## Development Setup

### 1. Prerequisites

- **Rust**: 1.80+ (`rustc` and `cargo`)
- **Python**: 3.11 or 3.12 (`python3` and `pip` or `uv`)
- **Node.js**: 20+ or 22+ and `pnpm` (version 9 or 10)

### 2. Clone the Repository

```bash
git clone https://github.com/ranajahanzaib/genome-assembly-studio.git
cd genome-assembly-studio
```

### 3. Build & Test Rust Core Engine

```bash
cargo build --release
cargo test --tests
```

### 4. Setup & Test Python Backend

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
PYTHONPATH=. pytest services/api/tests
```

### 5. Setup & Test Web Frontend

```bash
pnpm install
pnpm --filter @genome-studio/ui build
pnpm --filter @genome-studio/visualization build
pnpm --filter web build
```

---

## Making Changes

1. **Create a Topic Branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. **Follow Coding Standards**:
   - **TypeScript**: Strict type checking with clean interfaces; avoid `any`.
   - **Rust**: Idiomatic Rust formatted with `cargo fmt` and checked with `cargo clippy`.
   - **Python**: Type-annotated FastAPI routes and Pydantic v2 models.
3. **Run Test Suites**:
   - Ensure all Rust unit tests pass (`cargo test --tests`).
   - Ensure Python backend tests pass (`pytest services/api/tests`).
   - Ensure Next.js builds cleanly (`pnpm --filter web build`).
4. **Submit a Pull Request**:
   - Provide a clear summary of what changes were made.
   - Reference any related issues (`Fixes #123`).

---

## Reporting Issues

If you encounter bugs, unexpected metric behavior, or visualization glitches:

- Check existing open and closed issues first.
- Open a new issue using our [Bug Report Template](.github/ISSUE_TEMPLATE/bug_report.md).
- Include reproducible inputs, assembly formats, and terminal logs.
