# Scientific Methodology — Genome Assembly Studio

Genome Assembly Studio computes rigorous, scientifically validated metrics across assembly continuity, accuracy, completeness, and structural fidelity.

---

## 1. Assembly Contiguity & Length Metrics

### N50 and L50 Definition

For a set of contigs or scaffolds sorted in descending order of length $L_1 \ge L_2 \ge \dots \ge L_k$:

- **N50** is the sequence length such that the sum of lengths of all sequences of length $\ge \text{N50}$ equals at least 50% of the total assembly length (or estimated genome size when specified):
  $$\sum_{i=1}^{m} L_i \ge 0.5 \sum_{i=1}^{k} L_i \quad \text{where } \text{N50} = L_m$$
- **L50** is the minimal number of sequences whose cumulative length reaches 50% of the assembly:
  $$L_{50} = m$$

Analogous calculations are performed for $N_{10}$ through $N_{90}$ at 5% intervals.

### auN (Area Under the Nx Curve)

Because N50 reflects only a single point along the contiguity distribution, Genome Assembly Studio calculates the length-weighted continuous continuity metric **auN** (as defined by the GAGE evaluation framework and modern assembly standards):
$$\text{auN} = \frac{1}{\sum_{i=1}^{k} L_i} \sum_{i=1}^{k} L_i^2$$
This metric is less sensitive to arbitrary contig partition boundaries and penalizes fragmented assemblies more rigorously than N50 alone.

---

## 2. Base Composition & Structural Topography

### GC Content & GC Skew

- **GC Content**:
  $$\%GC = \frac{N_G + N_C}{N_A + N_C + N_G + N_T} \times 100\%$$
  _(Ambiguous IUPAC bases and uncalled $N$ bases are excluded from the denominator)_.

- **GC Skew**:
  Sliding windows of size $W$ (default 1,000 bp or user-configured) compute the excess of guanine over cytosine:
  $$\text{Skew} = \frac{N_G - N_C}{N_G + N_C}$$
  GC skew shifts are indicative of bacterial replication origins (_oriC_) and replication termini (_ter_).

### Gap Metrics

Sequences containing contiguous stretches of $N$ bases (scaffolds) are parsed into gap coordinates. The studio reports:

- Total gap count
- Total uncalled base count
- Minimum, maximum, and median gap span lengths
- Gap frequency per megabase

---

## 3. Orthology & Single-Copy Gene Completeness

### BUSCO (Benchmarking Universal Single-Copy Orthologs)

When evaluating eukaryotic or prokaryotic assemblies against lineage-specific profile HMMs (e.g., `enterobacterales_odb10`, `eukaryota_odb10`), ortholog status is partitioned into:

- **Complete Single-Copy ($S$)**: Genes found in full without duplication.
- **Complete Duplicated ($D$)**: Genes found multiple times in the assembly (may signify unpurged heterozygous haplotypes or gene duplication).
- **Fragmented ($F$)**: Genes only partially reconstructed due to contig breaks.
- **Missing ($M$)**: Expected lineage orthologs completely undetected.

Summary score:
$$C = \frac{S + D}{N_{\text{total}}} \times 100\%$$

### CheckM2

For microbial and metagenome-assembled genomes (MAGs), CheckM2 machine learning models assess:

- **Completeness %** (predicted based on non-redundant universal single-copy genes).
- **Contamination %** (excess duplicate gene markers).
- **Strain Heterogeneity %** (indicative of chimeric or mixed strain bins).

---

## 4. Synteny & Alignment Metrics

Assemblies aligned to references via `minimap2` (yielding PAF alignments) are scored on:

- **Genome Fraction (%)**: Proportion of the reference covered by query alignments.
- **Duplication Ratio**: Total aligned query length divided by total aligned reference length.
- **Misassemblies**: Inversions, translocations, and inter-chromosomal rearrangements detected by discordant alignment coordinate blocks.
- **Structural Variant Identification**: Insertions and deletions identified through alignment gaps.

---

## 5. Automated Decision & Comparison Engine

When comparing assembly versions (e.g., `draft_v1` vs `polished_v2`), the Automated Decision Engine classifies changes into three actionable categories:

1. **Definite Improvements**:
   - Substantial increase in N50 ($\ge 20\%$) and auN.
   - Significant reduction in contig count ($\ge 15\%$).
   - Elimination or substantial reduction in assembly gaps.
   - Reduction in misassembly events without loss of reference genome fraction.
2. **Clear Regressions**:
   - Loss of total assembly size exceeding expected repeat collapse ($> 5\%$).
   - Drop in BUSCO completeness or increase in missing marker genes.
   - Introduction of artificial chimeric joins.
3. **Complex Trade-offs**:
   - Increase in contig length accompanied by an increase in duplication ratio (indicative of unpurged haplotype duplications).
   - Higher completeness accompanied by elevated contamination in microbial genomes.
