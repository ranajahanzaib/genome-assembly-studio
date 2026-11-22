# Troubleshooting & Diagnostic Guide — Genome Assembly Studio

---

## 1. Common Diagnostics

### Checking Rust Engine Availability

Ensure the Rust binary is compiled and accessible:

```bash
./target/debug/genome-studio --version
# or
./target/release/genome-studio --version
```

If the backend logs `genome-studio binary not found`, specify `GENOME_STUDIO_BIN` in your environment or `.env`:

```bash
export GENOME_STUDIO_BIN=$(pwd)/target/debug/genome-studio
```

### Checking Backend API Health

```bash
curl -s http://localhost:8000/api/v1/health | jq .
```

Expected output:

```json
{
  "status": "ok",
  "version": "0.1.0",
  "database": "connected",
  "rust_engine": "available"
}
```

---

## 2. macOS Build Quirks

### Issue: `xcode-select: error: unable to read data link at /var/db/xcode_select_link`

**Cause**: On certain macOS versions running under restricted sandbox environments, `xcrun` cannot resolve the default developer directory.  
**Resolution**: Explicitly specify the Command Line Tools path:

```bash
DEVELOPER_DIR=/Library/Developer/CommandLineTools CC=/Library/Developer/CommandLineTools/usr/bin/clang cargo build
```

---

## 3. Web & Next.js Build Quirks

### Issue: `EPERM: operation not permitted, stat '/path/to/parent/package.json'`

**Cause**: Next.js uses `browserslist` which traverses upward through parent directories looking for `package.json` until filesystem boundaries are hit.  
**Resolution**: Set the environment variable:

```bash
export BROWSERSLIST="defaults"
```

and ensure `.browserslistrc` containing `defaults` exists in `apps/web/`.

### Issue: Missing Suspense Boundary for `useSearchParams()`

**Cause**: Next.js 15 requires client components using `useSearchParams()` during static prerendering to be wrapped in a `<Suspense>` boundary.  
**Resolution**: Wrap the component tree invoking `useSearchParams()` in `<Suspense fallback={...}>`.

---

## 4. Scientific Executables (QUAST, BUSCO, CheckM2)

### Issue: Tool displays as "Not Installed" in Settings

Genome Assembly Studio gracefully differentiates installed from uninstalled external scientific dependencies. If a tool is not installed, core assembly metrics (N50, L50, auN, GC%, gaps, sequence slices) are still calculated via the Rust core engine.

To enable external scientific tools:

- **minimap2**: Install via brew or conda (`brew install minimap2` or `conda install -c bioconda minimap2`)
- **QUAST**: Install via pip or conda (`pip install quast`)
- **BUSCO**: Install via conda (`conda install -c bioconda busco`)
- **CheckM2**: Install via conda or pip (`pip install checkm2`)
  Verify installation status at `/settings` in the web application.
