import json
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

from services.api.app.core.database import get_db
from services.api.app.models.entities import Assembly, ComparisonRecord, Project
from services.api.app.schemas.dto import ComparisonResponse, MetricDelta, ComparisonFinding
from services.api.app.integrations.comparison_engine import compute_metric_deltas, generate_comparison_findings

router = APIRouter()

class ComparisonCreate(BaseModel):
    project_id: str
    baseline_id: str
    compared_id: str

@router.post("", response_model=ComparisonResponse, status_code=status.HTTP_201_CREATED)
def create_comparison(data: ComparisonCreate, db: Session = Depends(get_db)):
    baseline = db.query(Assembly).filter(Assembly.id == data.baseline_id).first()
    compared = db.query(Assembly).filter(Assembly.id == data.compared_id).first()
    if not baseline or not compared:
        raise HTTPException(status_code=404, detail="One or both assemblies not found")

    if not baseline.metrics or not compared.metrics:
        raise HTTPException(status_code=400, detail="Both assemblies must have completed metrics")

    base_raw = json.loads(baseline.metrics.raw_json).get("stats", {}) if baseline.metrics.raw_json else {}
    comp_raw = json.loads(compared.metrics.raw_json).get("stats", {}) if compared.metrics.raw_json else {}

    # Extract tool results if present
    base_quast = None
    comp_quast = None
    base_busco = None
    comp_busco = None
    base_checkm2 = None
    comp_checkm2 = None

    for tr in baseline.tool_results:
        res = json.loads(tr.results_json)
        if tr.tool_name == "quast": base_quast = res
        elif tr.tool_name == "busco": base_busco = res
        elif tr.tool_name == "checkm2": base_checkm2 = res

    for tr in compared.tool_results:
        res = json.loads(tr.results_json)
        if tr.tool_name == "quast": comp_quast = res
        elif tr.tool_name == "busco": comp_busco = res
        elif tr.tool_name == "checkm2": comp_checkm2 = res

    deltas = compute_metric_deltas(base_raw, comp_raw)
    findings = generate_comparison_findings(
        base_raw, comp_raw,
        baseline.name, compared.name,
        base_quast, comp_quast,
        base_busco, comp_busco,
        base_checkm2, comp_checkm2
    )

    rec = ComparisonRecord(
        project_id=data.project_id,
        baseline_id=data.baseline_id,
        compared_id=data.compared_id,
        summary_json=json.dumps([d for d in deltas]),
        findings_json=json.dumps([f for f in findings]),
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)

    return ComparisonResponse(
        id=rec.id,
        project_id=rec.project_id,
        baseline_id=rec.baseline_id,
        compared_id=rec.compared_id,
        baseline_name=f"{baseline.name} ({baseline.version})",
        compared_name=f"{compared.name} ({compared.version})",
        deltas=[MetricDelta(**d) for d in deltas],
        findings=[ComparisonFinding(**f) for f in findings],
        created_at=rec.created_at
    )

@router.get("/{comparison_id}", response_model=ComparisonResponse)
def get_comparison(comparison_id: str, db: Session = Depends(get_db)):
    rec = db.query(ComparisonRecord).filter(ComparisonRecord.id == comparison_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Comparison record not found")

    baseline = db.query(Assembly).filter(Assembly.id == rec.baseline_id).first()
    compared = db.query(Assembly).filter(Assembly.id == rec.compared_id).first()
    b_name = f"{baseline.name} ({baseline.version})" if baseline else "Baseline"
    c_name = f"{compared.name} ({compared.version})" if compared else "Compared"

    deltas = json.loads(rec.summary_json)
    findings = json.loads(rec.findings_json)

    return ComparisonResponse(
        id=rec.id,
        project_id=rec.project_id,
        baseline_id=rec.baseline_id,
        compared_id=rec.compared_id,
        baseline_name=b_name,
        compared_name=c_name,
        deltas=[MetricDelta(**d) for d in deltas],
        findings=[ComparisonFinding(**f) for f in findings],
        created_at=rec.created_at
    )

@router.get("/project/{project_id}", response_model=List[ComparisonResponse])
def get_project_comparisons(project_id: str, db: Session = Depends(get_db)):
    records = db.query(ComparisonRecord).filter(ComparisonRecord.project_id == project_id).order_by(ComparisonRecord.created_at.desc()).all()
    results = []
    for rec in records:
        baseline = db.query(Assembly).filter(Assembly.id == rec.baseline_id).first()
        compared = db.query(Assembly).filter(Assembly.id == rec.compared_id).first()
        b_name = f"{baseline.name} ({baseline.version})" if baseline else "Baseline"
        c_name = f"{compared.name} ({compared.version})" if compared else "Compared"

        deltas = json.loads(rec.summary_json)
        findings = json.loads(rec.findings_json)

        results.append(ComparisonResponse(
            id=rec.id,
            project_id=rec.project_id,
            baseline_id=rec.baseline_id,
            compared_id=rec.compared_id,
            baseline_name=b_name,
            compared_name=c_name,
            deltas=[MetricDelta(**d) for d in deltas],
            findings=[ComparisonFinding(**f) for f in findings],
            created_at=rec.created_at
        ))
    return results

@router.get("/report/export")
def export_comparison_report(
    baseline_id: str = Query(...),
    compared_id: str = Query(...),
    format: str = Query("markdown", description="Format: markdown, json, or tsv"),
    db: Session = Depends(get_db)
):
    baseline = db.query(Assembly).filter(Assembly.id == baseline_id).first()
    compared = db.query(Assembly).filter(Assembly.id == compared_id).first()
    if not baseline or not compared:
        raise HTTPException(status_code=404, detail="One or both assemblies not found")

    if not baseline.metrics or not compared.metrics:
        raise HTTPException(status_code=400, detail="Both assemblies must have completed metrics")

    base_raw = json.loads(baseline.metrics.raw_json).get("stats", {}) if baseline.metrics.raw_json else {}
    comp_raw = json.loads(compared.metrics.raw_json).get("stats", {}) if compared.metrics.raw_json else {}

    deltas = compute_metric_deltas(base_raw, comp_raw)
    findings = generate_comparison_findings(
        base_raw, comp_raw,
        baseline.name, compared.name
    )

    if format == "json":
        return {
            "baseline": {"id": baseline.id, "name": baseline.name, "version": baseline.version},
            "compared": {"id": compared.id, "name": compared.name, "version": compared.version},
            "deltas": deltas,
            "findings": findings
        }

    if format == "tsv":
        lines = ["metric\tbaseline\tcompared\tabsolute_delta\tpercent_delta\tdirection"]
        for d in deltas:
            lines.append(f"{d['metric']}\t{d['baseline_value']}\t{d['compared_value']}\t{d['absolute_delta']}\t{d['percent_delta']:.2f}%\t{d['improvement_direction']}")
        return PlainTextResponse("\n".join(lines), media_type="text/tab-separated-values")

    # Default: Markdown
    delta_rows = []
    for d in deltas:
        pct = f"{d['percent_delta']:+.2f}%" if d['percent_delta'] != 0.0 else "0.0%"
        status_label = "Improvement" if d['is_improvement'] else ("Regression" if d['is_regression'] else "Neutral")
        delta_rows.append(f"| **{d['metric']}** | {d['baseline_value']} | {d['compared_value']} | {d['absolute_delta']:+} | {pct} | `{status_label}` |")

    improvements = [f"- **{item['title']}**: {item['description']}" for item in findings if item['category'] == 'improvement']
    regressions = [f"- **{item['title']}**: {item['description']}" for item in findings if item['category'] == 'regression']
    tradeoffs = [f"- **{item['title']}**: {item['description']}" for item in findings if item['category'] == 'tradeoff']

    md = f"""# Comparative Assembly Report: {baseline.name} vs. {compared.name}

## 1. Study Overview
- **Baseline Assembly**: **{baseline.name}** (`{baseline.version}`)
- **Compared Candidate**: **{compared.name}** (`{compared.version}`)
- **Generated by**: Genome Assembly Studio Automated Decision Engine

---

## 2. Automated Findings & Verdict
### Improvements
{chr(10).join(improvements) if improvements else "_No significant improvements detected._"}

### Regressions
{chr(10).join(regressions) if regressions else "_No significant regressions detected._"}

### Trade-offs & Structural Considerations
{chr(10).join(tradeoffs) if tradeoffs else "_No significant trade-offs identified._"}

---

## 3. Metric Comparison Matrix
| Metric | Baseline ({baseline.version}) | Candidate ({compared.version}) | Absolute Delta | Relative Change | Status |
|---|---|---|---|---|---|
{chr(10).join(delta_rows)}

---

## 4. Analytical Methodology
Metric comparisons and directional derivations are evaluated according to Earth BioGenome Project and GAGE benchmark guidelines.
"""
    return PlainTextResponse(md, media_type="text/markdown")

