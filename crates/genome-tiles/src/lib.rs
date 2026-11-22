use assembly_core::{AlignmentRecord, GCProfileBin, SequenceRecord, Strand};

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct WheelChromosome {
    pub id: String,
    pub name: String,
    pub length: usize,
    pub start_bp: usize,
    pub end_bp: usize,
    pub gc_percent: f64,
    pub is_circular: bool,
    pub color: String,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct WheelRibbon {
    pub id: String,
    pub source_chr: String,
    pub source_start: usize,
    pub source_end: usize,
    pub target_chr: String,
    pub target_start: usize,
    pub target_end: usize,
    pub strand: char,
    pub color: String,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct GenomeWheelPayload {
    pub total_length: usize,
    pub chromosomes: Vec<WheelChromosome>,
    pub gc_bins: Vec<GCProfileBin>,
    pub ribbons: Vec<WheelRibbon>,
}

const SCIENTIFIC_PALETTE: &[&str] = &[
    "#2563EB", // blue-600
    "#0D9488", // teal-600
    "#7C3AED", // violet-600
    "#D97706", // amber-600
    "#059669", // emerald-600
    "#DC2626", // red-600
    "#4F46E5", // indigo-600
    "#EA580C", // orange-600
    "#0284C7", // sky-600
    "#9333EA", // purple-600
    "#16A34A", // green-600
    "#CA8A04", // yellow-600
];

pub fn generate_genome_wheel_payload(
    sequences: &[SequenceRecord],
    gc_bins: &[GCProfileBin],
    alignments: &[AlignmentRecord],
    max_chromosomes: usize,
) -> GenomeWheelPayload {
    let mut sorted_seqs = sequences.to_vec();
    sorted_seqs.sort_by(|a, b| b.length.cmp(&a.length));

    let display_seqs = if sorted_seqs.len() > max_chromosomes {
        &sorted_seqs[..max_chromosomes]
    } else {
        &sorted_seqs[..]
    };

    let total_length: usize = display_seqs.iter().map(|s| s.length).sum();

    let mut chromosomes = Vec::new();
    let mut cum_bp = 0;
    for (i, seq) in display_seqs.iter().enumerate() {
        let color = SCIENTIFIC_PALETTE[i % SCIENTIFIC_PALETTE.len()].to_string();
        chromosomes.push(WheelChromosome {
            id: seq.id.clone(),
            name: seq.name.clone(),
            length: seq.length,
            start_bp: cum_bp,
            end_bp: cum_bp + seq.length,
            gc_percent: (seq.gc_percent() * 10.0).round() / 10.0,
            is_circular: seq.is_circular,
            color,
        });
        cum_bp += seq.length;
    }

    let chr_ids: std::collections::HashSet<&str> =
        chromosomes.iter().map(|c| c.id.as_str()).collect();

    // Filter relevant GC bins
    let relevant_gc: Vec<GCProfileBin> = gc_bins
        .iter()
        .filter(|b| chr_ids.contains(b.sequence_id.as_str()))
        .cloned()
        .collect();

    // Generate ribbons from alignments
    let mut ribbons = Vec::new();
    for (idx, aln) in alignments.iter().enumerate() {
        if chr_ids.contains(aln.query_name.as_str()) && chr_ids.contains(aln.target_name.as_str()) {
            let strand_char = match aln.strand {
                Strand::Forward => '+',
                Strand::Reverse => '-',
            };
            let color = if strand_char == '+' {
                "#3B82F6".to_string() // blue
            } else {
                "#EC4899".to_string() // pink/magenta for inverted
            };
            ribbons.push(WheelRibbon {
                id: format!("ribbon_{}", idx + 1),
                source_chr: aln.query_name.clone(),
                source_start: aln.query_start,
                source_end: aln.query_end,
                target_chr: aln.target_name.clone(),
                target_start: aln.target_start,
                target_end: aln.target_end,
                strand: strand_char,
                color,
            });
        }
    }

    GenomeWheelPayload {
        total_length,
        chromosomes,
        gc_bins: relevant_gc,
        ribbons,
    }
}
