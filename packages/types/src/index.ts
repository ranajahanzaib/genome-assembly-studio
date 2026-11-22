export interface AssemblySummary {
  id: string;
  projectId: string;
  name: string;
  version: string;
  organism: string;
  totalLength: number;
  sequenceCount: number;
  contigCount: number;
  scaffoldCount: number;
  largestContig: number;
  smallestContig: number;
  meanLength: number;
  medianLength: number;
  n50: number;
  l50: number;
  n90: number;
  l90: number;
  auN: number;
  gcPercent: number;
  atPercent: number;
  nPercent: number;
  ambiguousPercent: number;
  totalGapLength: number;
  gapCount: number;
  createdAt: string;
}

export interface SequenceRecord {
  id: string;
  name: string;
  length: number;
  gcPercent: number;
  ambiguousBases: number;
  nBases: number;
  gapCount: number;
  totalGapLength: number;
  isCircular?: boolean;
}

export interface NxValue {
  x: number;
  nx: number;
  lx: number;
}

export interface GCProfileBin {
  sequenceId: string;
  start: number;
  end: number;
  gcPercent: number;
  ambiguousPercent: number;
}

export interface BuscoResult {
  lineage: string;
  databaseRelease: string;
  completeSingleCopy: number;
  completeDuplicated: number;
  fragmented: number;
  missing: number;
  totalGenes: number;
  completenessPercent: number;
}

export interface CheckM2Result {
  completeness: number;
  contamination: number;
  model: string;
  qualityClass: "High Quality" | "Medium Quality" | "Low Quality";
  warnings: string[];
}

export interface QuastResult {
  genomeFraction?: number;
  duplicationRatio?: number;
  misassemblies?: number;
  mismatchesPer100k?: number;
  indelsPer100k?: number;
  largestAlignment?: number;
  totalAlignedLength?: number;
  referenceCoverage?: number;
}

export interface AlignmentBlock {
  id: string;
  querySeq: string;
  queryStart: number;
  queryEnd: number;
  targetSeq: string;
  targetStart: number;
  targetEnd: number;
  strand: "+" | "-";
  mappingQuality: number;
  matches: number;
  alignmentLength: number;
}

export interface GfaNode {
  id: string;
  length: number;
  sequencePreview?: string;
  coverage?: number;
  gcPercent?: number;
}

export interface GfaEdge {
  fromNode: string;
  fromOrientation: "+" | "-";
  toNode: string;
  toOrientation: "+" | "-";
  overlap: string;
}

export interface GfaGraph {
  nodes: GfaNode[];
  edges: GfaEdge[];
}

export interface ComparisonDelta {
  metric: string;
  baselineValue: number;
  comparedValue: number;
  absoluteDelta: number;
  percentDelta: number;
  improvementDirection: "higher_better" | "lower_better" | "neutral";
  isImprovement: boolean;
  isRegression: boolean;
}

export interface ComparisonFinding {
  id: string;
  category: "improvement" | "regression" | "tradeoff" | "neutral";
  title: string;
  description: string;
  metric?: string;
  evidence: string;
}
