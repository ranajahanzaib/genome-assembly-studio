use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct SequenceRecord {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub length: usize,
    pub gc_count: usize,
    pub at_count: usize,
    pub n_count: usize,
    pub ambiguous_count: usize,
    pub gap_count: usize,
    pub total_gap_length: usize,
    pub is_circular: bool,
}

impl SequenceRecord {
    pub fn gc_percent(&self) -> f64 {
        let canonical = self.gc_count + self.at_count;
        if canonical == 0 {
            0.0
        } else {
            (self.gc_count as f64 / canonical as f64) * 100.0
        }
    }

    pub fn at_percent(&self) -> f64 {
        let canonical = self.gc_count + self.at_count;
        if canonical == 0 {
            0.0
        } else {
            (self.at_count as f64 / canonical as f64) * 100.0
        }
    }

    pub fn n_percent(&self) -> f64 {
        if self.length == 0 {
            0.0
        } else {
            (self.n_count as f64 / self.length as f64) * 100.0
        }
    }

    pub fn ambiguous_percent(&self) -> f64 {
        if self.length == 0 {
            0.0
        } else {
            (self.ambiguous_count as f64 / self.length as f64) * 100.0
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ContigRecord {
    pub id: String,
    pub scaffold_id: String,
    pub start_in_scaffold: usize,
    pub end_in_scaffold: usize,
    pub length: usize,
    pub gc_count: usize,
    pub at_count: usize,
}

impl ContigRecord {
    pub fn gc_percent(&self) -> f64 {
        let canonical = self.gc_count + self.at_count;
        if canonical == 0 {
            0.0
        } else {
            (self.gc_count as f64 / canonical as f64) * 100.0
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct GapRecord {
    pub scaffold_id: String,
    pub start: usize,
    pub end: usize,
    pub length: usize,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum Strand {
    Forward,
    Reverse,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Interval {
    pub start: usize,
    pub end: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct NxEntry {
    pub x: u32,
    pub nx: usize,
    pub lx: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct LengthThreshold {
    pub threshold: usize,
    pub count: usize,
    pub total_length: usize,
    pub percentage_of_assembly: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct AssemblyStats {
    pub total_length: usize,
    pub sequence_count: usize,
    pub contig_count: usize,
    pub scaffold_count: usize,
    pub largest_contig: usize,
    pub smallest_contig: usize,
    pub mean_length: f64,
    pub median_length: f64,
    pub n50: usize,
    pub l50: usize,
    pub n90: usize,
    pub l90: usize,
    pub au_n: f64,
    pub gc_percent: f64,
    pub at_percent: f64,
    pub n_percent: f64,
    pub ambiguous_percent: f64,
    pub total_gap_length: usize,
    pub gap_count: usize,
    pub nx_values: Vec<NxEntry>,
    pub thresholds: Vec<LengthThreshold>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct GCProfileBin {
    pub sequence_id: String,
    pub start: usize,
    pub end: usize,
    pub gc_percent: f64,
    pub ambiguous_percent: f64,
    pub n_percent: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct AlignmentRecord {
    pub query_name: String,
    pub query_length: usize,
    pub query_start: usize,
    pub query_end: usize,
    pub strand: Strand,
    pub target_name: String,
    pub target_length: usize,
    pub target_start: usize,
    pub target_end: usize,
    pub matches: usize,
    pub alignment_length: usize,
    pub mapping_quality: u8,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct GfaNode {
    pub id: String,
    pub length: usize,
    pub sequence_preview: Option<String>,
    pub coverage: Option<f64>,
    pub gc_percent: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct GfaEdge {
    pub from_node: String,
    pub from_orientation: char,
    pub to_node: String,
    pub to_orientation: char,
    pub overlap: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct GfaGraph {
    pub nodes: Vec<GfaNode>,
    pub edges: Vec<GfaEdge>,
    pub total_nodes: usize,
    pub total_edges: usize,
    pub total_length: usize,
    pub dead_ends: usize,
    pub branch_points: usize,
    pub connected_components: usize,
}

#[derive(thiserror::Error, Debug)]
pub enum EngineError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("FASTA format error: {0}")]
    FastaFormat(String),
    #[error("GFA format error: {0}")]
    GfaFormat(String),
    #[error("PAF format error: {0}")]
    PafFormat(String),
    #[error("Sequence not found: {0}")]
    SequenceNotFound(String),
    #[error("Invalid coordinate interval: start {0} > end {1} or out of bounds (len {2})")]
    InvalidInterval(usize, usize, usize),
    #[error("Invalid parameter: {0}")]
    InvalidParameter(String),
}

pub type Result<T> = std::result::Result<T, EngineError>;
