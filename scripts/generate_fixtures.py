#!/usr/bin/env python3
"""
Generate scientifically sound synthetic genomic fixtures for Genome Assembly Studio demonstrations.
"""

import os
import random
import json

random.seed(42)

FIXTURES_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "datasets", "fixtures"))
os.makedirs(FIXTURES_DIR, exist_ok=True)

BASES = ["A", "C", "G", "T"]
# E. coli typical GC is ~50.8%
def generate_random_seq(length, gc_target=0.508):
    seq = []
    for _ in range(length):
        if random.random() < gc_target:
            seq.append(random.choice(["G", "C"]))
        else:
            seq.append(random.choice(["A", "T"]))
    return "".join(seq)

def write_fasta(path, records):
    with open(path, "w") as f:
        for header, seq in records:
            f.write(f">{header}\n")
            for i in range(0, len(seq), 60):
                f.write(seq[i:i+60] + "\n")

print("1. Generating Reference Genome (50,000 bp)...")
ref_seq = generate_random_seq(50000, 0.508)
ref_path = os.path.join(FIXTURES_DIR, "reference.fasta")
write_fasta(ref_path, [("chr1 synthetic Escherichia coli K-12 MG1655 chromosome circular", ref_seq)])

print("2. Generating Draft v1 Assembly (12 fragmented contigs, total 46,500 bp with 2 gaps)...")
# Contig 1: 0..8000
# Contig 2: 8000..12000 (with gap)
# Contig 3: 13000..18000 (missing 12000..13000 -> 1000 bp missing region!)
# Contig 4: Inverted region 18000..24000
# etc.
draft_records = []
draft_records.append(("contig_01", ref_seq[0:8000]))
draft_records.append(("scaffold_02", ref_seq[8000:10000] + ("N" * 50) + ref_seq[10050:12000]))
# Notice: region 12000..13500 is missing in v1!
draft_records.append(("contig_03", ref_seq[13500:18000]))
# Inverted segment in v1:
def revcomp(s):
    trans = str.maketrans("ACGTacgt", "TGCAtgca")
    return s.translate(trans)[::-1]
draft_records.append(("contig_04_inv", revcomp(ref_seq[18000:23000])))
draft_records.append(("contig_05", ref_seq[23000:28000]))
draft_records.append(("contig_06", ref_seq[28000:32000]))
draft_records.append(("contig_07", ref_seq[32000:35000]))
draft_records.append(("contig_08", ref_seq[35000:38500]))
draft_records.append(("contig_09", ref_seq[38500:41500]))
draft_records.append(("contig_10", ref_seq[41500:44000]))
draft_records.append(("contig_11", ref_seq[44000:47000]))
draft_records.append(("contig_12", ref_seq[47000:50000]))

draft_path = os.path.join(FIXTURES_DIR, "draft_v1.fasta")
write_fasta(draft_path, draft_records)

print("3. Generating Polished v2 Assembly (3 long contiguous scaffolds, 49,800 bp)...")
polished_records = []
polished_records.append(("scaffold_A", ref_seq[0:22000]))
polished_records.append(("scaffold_B", ref_seq[22000:38000]))
polished_records.append(("scaffold_C", ref_seq[38000:49800]))

polished_path = os.path.join(FIXTURES_DIR, "polished_v2.fasta")
write_fasta(polished_path, polished_records)

print("4. Generating GFA Assembly Graph...")
gfa_path = os.path.join(FIXTURES_DIR, "assembly_graph.gfa")
with open(gfa_path, "w") as f:
    f.write("H\tVN:Z:1.0\n")
    # Segments
    f.write(f"S\ts1\t{ref_seq[0:500]}\tLN:i:500\tDP:f:28.4\n")
    f.write(f"S\ts2\t{ref_seq[500:1500]}\tLN:i:1000\tDP:f:31.2\n")
    f.write(f"S\ts3\t{ref_seq[1500:2200]}\tLN:i:700\tDP:f:15.1\n") # Branch bubble
    f.write(f"S\ts4\t{ref_seq[1500:2200]}\tLN:i:700\tDP:f:14.8\n") # Bubble alternative
    f.write(f"S\ts5\t{ref_seq[2200:3500]}\tLN:i:1300\tDP:f:30.0\n")
    f.write(f"S\ts6\t{ref_seq[3500:4200]}\tLN:i:700\tDP:f:29.5\n")
    f.write(f"S\ts7_repeat\t{ref_seq[4200:4800]}\tLN:i:600\tDP:f:58.2\n") # High-depth repeat
    f.write(f"S\ts8\t{ref_seq[4800:6000]}\tLN:i:1200\tDP:f:30.5\n")
    f.write(f"S\ts9_deadend\t{ref_seq[6000:6400]}\tLN:i:400\tDP:f:10.2\n")
    # Links
    f.write("L\ts1\t+\ts2\t+\t40M\n")
    f.write("L\ts2\t+\ts3\t+\t25M\n")
    f.write("L\ts2\t+\ts4\t+\t25M\n")
    f.write("L\ts3\t+\ts5\t+\t30M\n")
    f.write("L\ts4\t+\ts5\t+\t30M\n")
    f.write("L\ts5\t+\ts6\t+\t50M\n")
    f.write("L\ts6\t+\ts7_repeat\t+\t20M\n")
    f.write("L\ts7_repeat\t+\ts8\t+\t20M\n")
    f.write("L\ts8\t+\ts9_deadend\t+\t15M\n")

print("5. Generating PAF Alignments (v1 to Reference & v2 to Reference)...")
paf_v1_path = os.path.join(FIXTURES_DIR, "v1_to_ref.paf")
with open(paf_v1_path, "w") as f:
    f.write("contig_01\t8000\t0\t8000\t+\tchr1\t50000\t0\t8000\t7950\t8000\t60\n")
    f.write("scaffold_02\t3950\t0\t2000\t+\tchr1\t50000\t8000\t10000\t1980\t2000\t60\n")
    f.write("scaffold_02\t3950\t2050\t3950\t+\tchr1\t50000\t10050\t11950\t1890\t1900\t60\n")
    # Missing region 12000..13500!
    f.write("contig_03\t4500\t0\t4500\t+\tchr1\t50000\t13500\t18000\t4480\t4500\t60\n")
    # Inverted block
    f.write("contig_04_inv\t5000\t0\t5000\t-\tchr1\t50000\t18000\t23000\t4960\t5000\t60\n")
    f.write("contig_05\t5000\t0\t5000\t+\tchr1\t50000\t23000\t28000\t4970\t5000\t60\n")
    f.write("contig_06\t4000\t0\t4000\t+\tchr1\t50000\t28000\t32000\t3980\t4000\t60\n")
    f.write("contig_07\t3000\t0\t3000\t+\tchr1\t50000\t32000\t35000\t2985\t3000\t60\n")
    f.write("contig_08\t3500\t0\t3500\t+\tchr1\t50000\t35000\t38500\t3480\t3500\t60\n")
    f.write("contig_09\t3000\t0\t3000\t+\tchr1\t50000\t38500\t41500\t2980\t3000\t60\n")
    f.write("contig_10\t2500\t0\t2500\t+\tchr1\t50000\t41500\t44000\t2490\t2500\t60\n")
    f.write("contig_11\t3000\t0\t3000\t+\tchr1\t50000\t44000\t47000\t2985\t3000\t60\n")
    f.write("contig_12\t3000\t0\t3000\t+\tchr1\t50000\t47000\t50000\t2985\t3000\t60\n")

paf_v2_path = os.path.join(FIXTURES_DIR, "v2_to_ref.paf")
with open(paf_v2_path, "w") as f:
    f.write("scaffold_A\t22000\t0\t22000\t+\tchr1\t50000\t0\t22000\t21920\t22000\t60\n")
    f.write("scaffold_B\t16000\t0\t16000\t+\tchr1\t50000\t22000\t38000\t15950\t16000\t60\n")
    f.write("scaffold_C\t11800\t0\t11800\t+\tchr1\t50000\t38000\t49800\t11760\t11800\t60\n")

print("6. Generating Scientific Tool Reports (BUSCO, CheckM2, QUAST)...")
busco_v1 = {
    "lineage": "enterobacterales_odb10",
    "database_release": "2024-01-08",
    "complete_single_copy": 412,
    "complete_duplicated": 8,
    "fragmented": 14,
    "missing": 6,
    "total_genes": 440,
    "completeness_percent": 95.45
}
with open(os.path.join(FIXTURES_DIR, "busco_v1.json"), "w") as f:
    json.dump(busco_v1, f, indent=2)

busco_v2 = {
    "lineage": "enterobacterales_odb10",
    "database_release": "2024-01-08",
    "complete_single_copy": 432,
    "complete_duplicated": 3,
    "fragmented": 4,
    "missing": 1,
    "total_genes": 440,
    "completeness_percent": 98.86
}
with open(os.path.join(FIXTURES_DIR, "busco_v2.json"), "w") as f:
    json.dump(busco_v2, f, indent=2)

checkm2_v1 = {
    "completeness": 94.2,
    "contamination": 2.4,
    "model": "GradientBoost_v1.0.2",
    "quality_class": "Medium Quality",
    "warnings": ["Elevated contamination estimate in contig_04_inv"]
}
with open(os.path.join(FIXTURES_DIR, "checkm2_v1.json"), "w") as f:
    json.dump(checkm2_v1, f, indent=2)

checkm2_v2 = {
    "completeness": 99.6,
    "contamination": 0.3,
    "model": "GradientBoost_v1.0.2",
    "quality_class": "High Quality",
    "warnings": []
}
with open(os.path.join(FIXTURES_DIR, "checkm2_v2.json"), "w") as f:
    json.dump(checkm2_v2, f, indent=2)

quast_v1 = {
    "genome_fraction": 93.8,
    "duplication_ratio": 1.015,
    "misassemblies": 2,
    "mismatches_per_100k": 142.5,
    "indels_per_100k": 18.2,
    "largest_alignment": 8000,
    "total_aligned_length": 46900,
    "reference_coverage": 93.8
}
with open(os.path.join(FIXTURES_DIR, "quast_v1.json"), "w") as f:
    json.dump(quast_v1, f, indent=2)

quast_v2 = {
    "genome_fraction": 99.6,
    "duplication_ratio": 1.002,
    "misassemblies": 0,
    "mismatches_per_100k": 24.1,
    "indels_per_100k": 3.4,
    "largest_alignment": 22000,
    "total_aligned_length": 49800,
    "reference_coverage": 99.6
}
with open(os.path.join(FIXTURES_DIR, "quast_v2.json"), "w") as f:
    json.dump(quast_v2, f, indent=2)

print("Fixture generation complete!")
