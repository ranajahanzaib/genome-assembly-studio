import os
import json
import hashlib
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from services.api.app.core.config import settings
from services.api.app.core.database import get_db
from services.api.app.models.entities import Project, Assembly, AssemblyMetric, ToolResult, ComparisonRecord
from services.api.app.integrations.rust_engine import RustEngineIntegration
from services.api.app.integrations.comparison_engine import compute_metric_deltas, generate_comparison_findings

router = APIRouter()

SUPPORTED_SOURCES = [
    {
        "id": "ncbi_refseq",
        "name": "NCBI RefSeq",
        "description": "Curated, non-redundant genomic reference sequences and assemblies from the National Center for Biotechnology Information.",
        "supported_accessions": "GCF_*, RefSeq accessions",
        "documentation": "https://www.ncbi.nlm.nih.gov/refseq/"
    },
    {
        "id": "ncbi_genbank",
        "name": "NCBI GenBank",
        "description": "Comprehensive public database of nucleotide sequences and assembly submissions.",
        "supported_accessions": "GCA_*, GenBank accessions",
        "documentation": "https://www.ncbi.nlm.nih.gov/genbank/"
    },
    {
        "id": "gtdb",
        "name": "Genome Taxonomy Database (GTDB)",
        "description": "Standardized microbial taxonomy based on genome phylogeny across bacteria and archaea.",
        "supported_accessions": "GB_*, RS_* genome IDs",
        "documentation": "https://gtdb.ecogenomic.org/"
    },
    {
        "id": "opengenome2",
        "name": "OpenGenome2 Subsets",
        "description": "Openly available genomic dataset from Arc Institute, supporting explicit user selection of manageable FASTA subsets.",
        "supported_accessions": "Individual partitioned fasta subsets",
        "documentation": "https://huggingface.co/datasets/arcinstitute/opengenome2"
    }
]

@router.get("", response_model=List[Dict[str, Any]])
def list_data_sources():
    return SUPPORTED_SOURCES

@router.post("/seed-demo")
def seed_demo_project(db: Session = Depends(get_db)):
    # Check if demo project already exists
    demo_name = "Escherichia coli Assembly Evaluation"
    existing = db.query(Project).filter(Project.name == demo_name).first()
    if existing:
        return {"status": "already_exists", "project_id": existing.id}

    # 1. Create Demo Project
    project = Project(
        name=demo_name,
        description="Comprehensive evaluation comparing draft and polished genome assemblies of Escherichia coli against a reference chromosome.",
        organism="synthetic Escherichia coli K-12 MG1655",
        taxonomy_id="562",
        tags=json.dumps(["demonstration", "bacterial", "comparison", "ecoli"]),
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    fixtures = [
        {
            "name": "E. coli Reference Genome",
            "version": "ref",
            "file": "reference.fasta",
            "type": "reference",
        },
        {
            "name": "E. coli Draft Assembly",
            "version": "v1",
            "file": "draft_v1.fasta",
            "type": "draft",
            "busco": "busco_v1.json",
            "checkm2": "checkm2_v1.json",
            "quast": "quast_v1.json",
        },
        {
            "name": "E. coli Polished Assembly",
            "version": "v2",
            "file": "polished_v2.fasta",
            "type": "polished",
            "busco": "busco_v2.json",
            "checkm2": "checkm2_v2.json",
            "quast": "quast_v2.json",
        }
    ]

    created_assemblies = {}

    for item in fixtures:
        path = os.path.join(settings.FIXTURES_DIR, item["file"])
        if not os.path.isfile(path):
            continue

        file_size = os.path.getsize(path)
        with open(path, "rb") as f:
            checksum = hashlib.sha256(f.read()).hexdigest()

        asm = Assembly(
            project_id=project.id,
            name=item["name"],
            version=item["version"],
            organism=project.organism,
            source="Bundled Demonstration Fixture",
            filename=item["file"],
            file_path=path,
            file_size=file_size,
            checksum=checksum,
            input_format="FASTA",
            assembly_type=item["type"],
            status="ready",
        )
        db.add(asm)
        db.commit()
        db.refresh(asm)
        created_assemblies[item["version"]] = asm

        # Run Rust engine to compute real metrics from file
        out_dir = os.path.join(settings.STORAGE_DIR, f"demo_{asm.id}")
        raw_result = RustEngineIntegration.analyze_assembly(path, out_dir)
        stats = raw_result["stats"]

        metric = AssemblyMetric(
            assembly_id=asm.id,
            total_length=stats["total_length"],
            sequence_count=stats["sequence_count"],
            contig_count=stats["contig_count"],
            scaffold_count=stats["scaffold_count"],
            largest_contig=stats["largest_contig"],
            smallest_contig=stats["smallest_contig"],
            mean_length=stats["mean_length"],
            median_length=stats["median_length"],
            n50=stats["n50"],
            l50=stats["l50"],
            n90=stats["n90"],
            l90=stats["l90"],
            au_n=stats["au_n"],
            gc_percent=stats["gc_percent"],
            at_percent=stats["at_percent"],
            n_percent=stats["n_percent"],
            ambiguous_percent=stats["ambiguous_percent"],
            total_gap_length=stats["total_gap_length"],
            gap_count=stats["gap_count"],
            raw_json=json.dumps(raw_result),
        )
        db.add(metric)

        # Add scientific tool results
        for tool in ["busco", "checkm2", "quast"]:
            if tool in item:
                report_path = os.path.join(settings.FIXTURES_DIR, item[tool])
                if os.path.isfile(report_path):
                    with open(report_path) as rf:
                        r_data = json.load(rf)
                    tr = ToolResult(
                        assembly_id=asm.id,
                        tool_name=tool,
                        status="completed",
                        results_json=json.dumps(r_data),
                    )
                    db.add(tr)

        db.commit()

    # Preconfigure comparison: draft_v1 -> polished_v2
    if "v1" in created_assemblies and "v2" in created_assemblies:
        a1 = created_assemblies["v1"]
        a2 = created_assemblies["v2"]

        r1 = json.loads(a1.metrics.raw_json)["stats"]
        r2 = json.loads(a2.metrics.raw_json)["stats"]

        deltas = compute_metric_deltas(r1, r2)

        # Tool reports
        b1 = None
        b2 = None
        c1 = None
        c2 = None
        q1 = None
        q2 = None
        for tr in a1.tool_results:
            if tr.tool_name == "busco": b1 = json.loads(tr.results_json)
            elif tr.tool_name == "checkm2": c1 = json.loads(tr.results_json)
            elif tr.tool_name == "quast": q1 = json.loads(tr.results_json)
        for tr in a2.tool_results:
            if tr.tool_name == "busco": b2 = json.loads(tr.results_json)
            elif tr.tool_name == "checkm2": c2 = json.loads(tr.results_json)
            elif tr.tool_name == "quast": q2 = json.loads(tr.results_json)

        findings = generate_comparison_findings(
            r1, r2,
            a1.name, a2.name,
            q1, q2, b1, b2, c1, c2
        )

        comp = ComparisonRecord(
            project_id=project.id,
            baseline_id=a1.id,
            compared_id=a2.id,
            summary_json=json.dumps(deltas),
            findings_json=json.dumps(findings),
        )
        db.add(comp)
        db.commit()

    return {"status": "seeded", "project_id": project.id}
