# Scientific Visualizations — Genome Assembly Studio

Genome Assembly Studio features an interactive visualization suite implemented with D3.js and modern HTML5 Canvas/SVG primitives in `@genome-studio/visualization`.

---

## 1. Genome Wheel (Circos Visualization) — `GenomeCircos`

The Genome Wheel provides a circular representation of entire genomes, chromosomes, or contigs.

- **Component**: `<GenomeCircos />`
- **Tracks**:
  1. **Outer Cytoband Ring**: Visualizes chromosomes/contigs with proportional arc lengths, alternating chromatic palettes, and clear coordinate labels.
  2. **GC Content Heatmap Ring**: Inner radial track mapping sliding-window GC percentage from deep blue (low GC) to teal/gold (high GC).
  3. **GC Skew Line Track**: Radial line visualizing $(G - C) / (G + C)$ shifts with a zero-baseline guide.
  4. **Synteny Ribbons (Center)**: Cubic Bezier connection bands linking query assembly coordinates to reference locations, colored green for forward matches and pink/red for inversions.
- **Interactions**:
  - Hover tooltips detailing chromosome name, size, and regional coordinates.
  - Interactive wheel rotation controls (counter-clockwise, reset, clockwise).

---

## 2. Synteny Dot Plot — `AssemblyDotPlot`

Synteny dot plots reveal structural variants, translocations, duplications, and inversions between two assemblies or an assembly and reference.

- **Component**: `<AssemblyDotPlot />`
- **Features**:
  - Forward alignments rendered in electric blue (`#2563EB`).
  - Reverse/inversion alignments rendered in vibrant rose (`#EC4899`).
  - Chromosome boundary dividing lines with axis labels.
  - Interactive hover inspector reporting Query, Reference, Start, End, Strand, and Mapping Quality (MAPQ).

---

## 3. Assembly Graph Exploration (Bandage-style) — `AssemblyGraphViewer`

Visualizes Graphical Fragment Assembly (GFA) topologies to diagnose repeat structures, unresolved bubbles, and fragmentation causes.

- **Component**: `<AssemblyGraphViewer />`
- **Capabilities**:
  - D3 force-directed physics layout with node collision detection and link attraction.
  - Node color-coding by sequence length and connected components.
  - Visual distinction of **dead ends** (nodes with in-degree 0 or out-degree 0) and **branch points** (nodes with multiple connections).
  - Zoom and pan capabilities with component reset.

---

## 4. Multi-Scale Linear Genome Browser — `GenomeTrackBrowser`

Enables continuous linear navigation from whole-chromosome scale down to individual base pairs.

- **Component**: `<GenomeTrackBrowser />`
- **Features**:
  - **Pan & Zoom Controls**: Responsive viewport controls with range indicators.
  - **Overview Minimap**: Whole-chromosome context with draggable viewport brush.
  - **Sliding-Window GC Track**: Area chart tracking GC fluctuations across the active viewport.
  - **Gap Annotations**: Red blocks representing uncalled $N$-stretches with tooltips displaying span and length.
  - **Alignment Track**: Blue (forward) and pink (reverse) synteny blocks against references.
  - **Nucleotide Sequence View**: When zoomed into $< 120$ base pairs, the actual nucleotide characters ($A, C, G, T$) are rendered in monospaced font directly on the sequence axis.

---

## 5. Comparative Continuity & Completeness Charts

- **Nx Curve (`<NxCurve />`)**: Multi-series line chart comparing the $N_{10}$ through $N_{90}$ contiguity curves of multiple assemblies simultaneously, with interactive crosshair tooltips.
- **Cumulative Length Curve (`<CumulativeLengthChart />`)**: Plots ordered contig accumulation against an optional reference line to diagnose whether an assembly is under- or over-assembled.
- **BUSCO Stacked Bar (`<BuscoStackedChart />`)**: Segmented horizontal bar highlighting Complete Single-Copy (green), Complete Duplicated (teal), Fragmented (amber), and Missing (red) ortholog proportions.
- **Quality Matrix (`<QualityMatrix />`)**: Comparative table with metric heatmap coloring, delta badges relative to reference/primary assembly, and one-click CSV export.
