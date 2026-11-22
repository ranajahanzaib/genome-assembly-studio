from typing import Dict, Any, List
import uuid

def compute_metric_deltas(baseline: Dict[str, Any], compared: Dict[str, Any]) -> List[Dict[str, Any]]:
    metric_defs = [
        ("n50", "N50 (bp)", "higher_better"),
        ("l50", "L50", "lower_better"),
        ("total_length", "Total Length (bp)", "neutral"),
        ("contig_count", "Contig Count", "lower_better"),
        ("au_n", "auN (bp)", "higher_better"),
        ("gc_percent", "GC Content (%)", "neutral"),
        ("n_percent", "N Base Content (%)", "lower_better"),
        ("total_gap_length", "Total Gap Length (bp)", "lower_better"),
        ("gap_count", "Gap Count", "lower_better"),
    ]

    deltas = []
    for key, label, direction in metric_defs:
        v1 = float(baseline.get(key, 0) or 0)
        v2 = float(compared.get(key, 0) or 0)
        abs_diff = v2 - v1
        pct_diff = (abs_diff / v1 * 100.0) if v1 > 0 else (0.0 if abs_diff == 0 else 100.0)

        is_imp = False
        is_reg = False
        if direction == "higher_better":
            if abs_diff > 0:
                is_imp = True
            elif abs_diff < 0:
                is_reg = True
        elif direction == "lower_better":
            if abs_diff < 0:
                is_imp = True
            elif abs_diff > 0:
                is_reg = True

        deltas.append({
            "metric": label,
            "baseline_value": v1,
            "compared_value": v2,
            "absolute_delta": round(abs_diff, 2),
            "percent_delta": round(pct_diff, 2),
            "improvement_direction": direction,
            "is_improvement": is_imp,
            "is_regression": is_reg,
        })

    return deltas

def generate_comparison_findings(
    baseline_stats: Dict[str, Any],
    compared_stats: Dict[str, Any],
    baseline_name: str,
    compared_name: str,
    baseline_quast: Dict[str, Any] = None,
    compared_quast: Dict[str, Any] = None,
    baseline_busco: Dict[str, Any] = None,
    compared_busco: Dict[str, Any] = None,
    baseline_checkm2: Dict[str, Any] = None,
    compared_checkm2: Dict[str, Any] = None,
) -> List[Dict[str, Any]]:
    findings = []

    # 1. Contiguity / N50
    n50_1 = baseline_stats.get("n50", 0)
    n50_2 = compared_stats.get("n50", 0)
    if n50_2 > n50_1:
        pct = round(((n50_2 - n50_1) / n50_1 * 100), 1) if n50_1 > 0 else 100.0
        findings.append({
            "id": str(uuid.uuid4()),
            "category": "improvement",
            "title": f"Substantial N50 Contiguity Improvement (+{pct}%)",
            "description": f"Assembly {compared_name} achieved an N50 of {n50_2:,} bp compared to {n50_1:,} bp in {baseline_name}, indicating much longer contiguous blocks.",
            "metric": "N50",
            "evidence": f"Baseline: {n50_1:,} bp -> Compared: {n50_2:,} bp (diff: +{n50_2 - n50_1:,} bp)"
        })
    elif n50_2 < n50_1:
        pct = round(((n50_1 - n50_2) / n50_1 * 100), 1) if n50_1 > 0 else 0.0
        findings.append({
            "id": str(uuid.uuid4()),
            "category": "regression",
            "title": f"Lower Assembly Contiguity (-{pct}% N50)",
            "description": f"Assembly {compared_name} has lower contiguity than {baseline_name}.",
            "metric": "N50",
            "evidence": f"Baseline: {n50_1:,} bp -> Compared: {n50_2:,} bp (diff: {n50_2 - n50_1:,} bp)"
        })

    # 2. Contig Count Fragmentation
    ctg_1 = baseline_stats.get("contig_count", 0)
    ctg_2 = compared_stats.get("contig_count", 0)
    unit_1 = "contig" if ctg_1 == 1 else "contigs"
    unit_2 = "contig" if ctg_2 == 1 else "contigs"
    if ctg_2 < ctg_1:
        diff_count = ctg_1 - ctg_2
        diff_unit = "piece" if diff_count == 1 else "pieces"
        findings.append({
            "id": str(uuid.uuid4()),
            "category": "improvement",
            "title": f"Assembly Fragmentation Reduced ({ctg_1} {unit_1} -> {ctg_2} {unit_2})",
            "description": f"Number of sequence pieces decreased by {diff_count} {diff_unit}, demonstrating successful scaffolding or gap closing.",
            "metric": "Contig Count",
            "evidence": f"Baseline contigs: {ctg_1} -> Compared contigs: {ctg_2}"
        })
    elif ctg_2 > ctg_1:
        diff_count = ctg_2 - ctg_1
        diff_unit = "fragment" if diff_count == 1 else "fragments"
        findings.append({
            "id": str(uuid.uuid4()),
            "category": "regression",
            "title": f"Higher Assembly Fragmentation ({ctg_2} {unit_2} vs {ctg_1} {unit_1})",
            "description": f"The newer assembly is split into {diff_count} additional {diff_unit}.",
            "metric": "Contig Count",
            "evidence": f"Baseline contigs: {ctg_1} -> Compared contigs: {ctg_2}"
        })

    # 3. Gaps
    gap_bp_1 = baseline_stats.get("total_gap_length", 0)
    gap_bp_2 = compared_stats.get("total_gap_length", 0)
    if gap_bp_1 > 0 and gap_bp_2 == 0:
        findings.append({
            "id": str(uuid.uuid4()),
            "category": "improvement",
            "title": "Complete Gap Closure",
            "description": f"All {gap_bp_1:,} bp of scaffold N-gaps in {baseline_name} were completely resolved and closed in {compared_name}.",
            "metric": "Gaps",
            "evidence": f"Baseline gap length: {gap_bp_1} bp -> Compared gap length: 0 bp"
        })

    # 4. QUAST findings
    if baseline_quast and compared_quast:
        mis_1 = baseline_quast.get("misassemblies", 0)
        mis_2 = compared_quast.get("misassemblies", 0)
        cov_1 = baseline_quast.get("reference_coverage", 0)
        cov_2 = compared_quast.get("reference_coverage", 0)

        if cov_2 > cov_1:
            findings.append({
                "id": str(uuid.uuid4()),
                "category": "improvement",
                "title": f"Increased Reference Genome Fraction ({cov_1}% -> {cov_2}%)",
                "description": f"{compared_name} aligns to an additional {round(cov_2 - cov_1, 2)}% of the reference chromosome.",
                "metric": "Reference Coverage",
                "evidence": f"Baseline coverage: {cov_1}% -> Compared coverage: {cov_2}%"
            })

        if mis_2 < mis_1:
            findings.append({
                "id": str(uuid.uuid4()),
                "category": "improvement",
                "title": f"Reduced Structural Misassemblies ({mis_1} -> {mis_2})",
                "description": f"Detected misassembly events decreased from {mis_1} to {mis_2}, reflecting enhanced structural fidelity.",
                "metric": "Misassemblies",
                "evidence": f"Baseline misassemblies: {mis_1} -> Compared misassemblies: {mis_2}"
            })
        elif mis_2 > mis_1 and n50_2 > n50_1:
            findings.append({
                "id": str(uuid.uuid4()),
                "category": "tradeoff",
                "title": f"Contiguity Tradeoff: Higher N50 but More Detected Misassemblies",
                "description": f"While contiguity increased substantially, {compared_name} has {mis_2 - mis_1} additional detected misassembly events.",
                "metric": "Misassemblies / N50",
                "evidence": f"N50: +{n50_2 - n50_1:,} bp, Misassemblies: +{mis_2 - mis_1}"
            })

    # 5. BUSCO findings
    if baseline_busco and compared_busco:
        b_c1 = baseline_busco.get("completeness_percent", 0)
        b_c2 = compared_busco.get("completeness_percent", 0)
        if b_c2 > b_c1:
            findings.append({
                "id": str(uuid.uuid4()),
                "category": "improvement",
                "title": f"Higher Gene Completeness ({b_c1}% -> {b_c2}% BUSCO)",
                "description": f"Evaluated under lineage {compared_busco.get('lineage')}, complete universal single-copy orthologs increased by {round(b_c2 - b_c1, 2)} percentage points.",
                "metric": "BUSCO Completeness",
                "evidence": f"Baseline complete: {b_c1}% -> Compared complete: {b_c2}%"
            })

    # 6. CheckM2 findings
    if baseline_checkm2 and compared_checkm2:
        c_contam_1 = baseline_checkm2.get("contamination", 0)
        c_contam_2 = compared_checkm2.get("contamination", 0)
        if c_contam_2 < c_contam_1:
            findings.append({
                "id": str(uuid.uuid4()),
                "category": "improvement",
                "title": f"Reduced Contamination Estimate ({c_contam_1}% -> {c_contam_2}%)",
                "description": f"CheckM2 machine-learning model predicted reduced foreign or duplicated contamination in {compared_name}.",
                "metric": "CheckM2 Contamination",
                "evidence": f"Baseline: {c_contam_1}% -> Compared: {c_contam_2}%"
            })

    return findings
