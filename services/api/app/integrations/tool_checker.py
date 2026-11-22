import shutil
import subprocess
from typing import List, Dict, Any
from services.api.app.core.config import settings
from services.api.app.integrations.rust_engine import RustEngineIntegration

def check_all_tools() -> List[Dict[str, Any]]:
    tools = []

    # 1. Rust engine (genome-studio)
    rust_avail = RustEngineIntegration.is_available()
    rust_path = RustEngineIntegration.get_binary_path() if rust_avail else None
    rust_ver = "0.1.0" if rust_avail else None
    tools.append({
        "tool": "genome-studio",
        "name": "Rust High-Performance Sequence Engine",
        "available": rust_avail,
        "version": rust_ver,
        "path": rust_path,
        "description": "Native streaming engine for N50/L50, GC content, GFA parsing, and genome tiling.",
        "database_status": "Built-in (No external database required)",
        "instructions": "Built automatically with `cargo build` in the crates directory."
    })

    # 2. QUAST
    quast_path = shutil.which(settings.QUAST_BIN)
    quast_ver = None
    if quast_path:
        try:
            res = subprocess.run([quast_path, "--version"], capture_output=True, text=True, timeout=5)
            quast_ver = res.stdout.strip() or res.stderr.strip()
        except Exception:
            quast_ver = "Detected"
    tools.append({
        "tool": "quast",
        "name": "QUAST (Quality Assessment Tool for Genome Assemblies)",
        "available": quast_path is not None,
        "version": quast_ver,
        "path": quast_path,
        "description": "Evaluates genome assemblies by computing contiguity, structural misassemblies, and reference genome fractions.",
        "database_status": "Not required",
        "instructions": "Install via bioconda: `conda install -c bioconda quast` or `pip install quast`."
    })

    # 3. BUSCO
    busco_path = shutil.which(settings.BUSCO_BIN)
    busco_ver = None
    if busco_path:
        try:
            res = subprocess.run([busco_path, "--version"], capture_output=True, text=True, timeout=5)
            busco_ver = res.stdout.strip() or res.stderr.strip()
        except Exception:
            busco_ver = "Detected"
    tools.append({
        "tool": "busco",
        "name": "BUSCO (Benchmarking Universal Single-Copy Orthologs)",
        "available": busco_path is not None,
        "version": busco_ver,
        "path": busco_path,
        "description": "Assesses genome assembly and annotation completeness with evolutionarily-informed expectations.",
        "database_status": "Requires lineage datasets (e.g. enterobacterales_odb10, bacteria_odb10)",
        "instructions": "Install via bioconda: `conda install -c bioconda busco` and download target lineages."
    })

    # 4. CheckM2
    checkm2_path = shutil.which(settings.CHECKM2_BIN)
    checkm2_ver = None
    if checkm2_path:
        try:
            res = subprocess.run([checkm2_path, "--version"], capture_output=True, text=True, timeout=5)
            checkm2_ver = res.stdout.strip() or res.stderr.strip()
        except Exception:
            checkm2_ver = "Detected"
    tools.append({
        "tool": "checkm2",
        "name": "CheckM2 (Rapid Assessment of Microbial Genomes)",
        "available": checkm2_path is not None,
        "version": checkm2_ver,
        "path": checkm2_path,
        "description": "Machine learning prediction of completeness and contamination in prokaryotic and metagenome-assembled genomes.",
        "database_status": "Requires CheckM2 diamond database (~2.8 GB)",
        "instructions": "Install via bioconda: `conda install -c bioconda checkm2` and run `checkm2 database --download`."
    })

    # 5. minimap2
    mm2_path = shutil.which(settings.MINIMAP2_BIN)
    mm2_ver = None
    if mm2_path:
        try:
            res = subprocess.run([mm2_path, "--version"], capture_output=True, text=True, timeout=5)
            mm2_ver = res.stdout.strip() or res.stderr.strip()
        except Exception:
            mm2_ver = "Detected"
    tools.append({
        "tool": "minimap2",
        "name": "minimap2 (Pairwise Sequence Aligner)",
        "available": mm2_path is not None,
        "version": mm2_ver,
        "path": mm2_path,
        "description": "Fast pairwise aligner for assembly-to-reference whole-genome alignment and dot plots.",
        "database_status": "Not required",
        "instructions": "Install via brew or bioconda: `brew install minimap2` or `conda install -c bioconda minimap2`."
    })

    return tools
