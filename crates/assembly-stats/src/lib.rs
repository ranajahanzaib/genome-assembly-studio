use assembly_core::{AssemblyStats, ContigRecord, LengthThreshold, NxEntry, SequenceRecord};

pub fn calculate_assembly_stats(
    sequences: &[SequenceRecord],
    contigs: &[ContigRecord],
) -> AssemblyStats {
    let sequence_count = sequences.len();
    let scaffold_count = sequence_count;
    let contig_count = if contigs.is_empty() {
        sequence_count
    } else {
        contigs.len()
    };

    let total_length: usize = sequences.iter().map(|s| s.length).sum();
    let total_gc: usize = sequences.iter().map(|s| s.gc_count).sum();
    let total_at: usize = sequences.iter().map(|s| s.at_count).sum();
    let total_n: usize = sequences.iter().map(|s| s.n_count).sum();
    let total_amb: usize = sequences.iter().map(|s| s.ambiguous_count).sum();
    let total_gap_length: usize = sequences.iter().map(|s| s.total_gap_length).sum();
    let gap_count: usize = sequences.iter().map(|s| s.gap_count).sum();

    let canonical = total_gc + total_at;
    let gc_percent = if canonical > 0 {
        (total_gc as f64 / canonical as f64) * 100.0
    } else {
        0.0
    };
    let at_percent = if canonical > 0 {
        (total_at as f64 / canonical as f64) * 100.0
    } else {
        0.0
    };
    let n_percent = if total_length > 0 {
        (total_n as f64 / total_length as f64) * 100.0
    } else {
        0.0
    };
    let ambiguous_percent = if total_length > 0 {
        (total_amb as f64 / total_length as f64) * 100.0
    } else {
        0.0
    };

    let target_lengths: Vec<usize> = if !contigs.is_empty() {
        contigs.iter().map(|c| c.length).collect()
    } else {
        sequences.iter().map(|s| s.length).collect()
    };

    let mut sorted_lengths = target_lengths.clone();
    sorted_lengths.sort_unstable_by(|a, b| b.cmp(a)); // Descending order

    let largest_contig = sorted_lengths.first().copied().unwrap_or(0);
    let smallest_contig = sorted_lengths.last().copied().unwrap_or(0);

    let mean_length = if !sorted_lengths.is_empty() {
        total_length as f64 / sorted_lengths.len() as f64
    } else {
        0.0
    };

    let median_length = if sorted_lengths.is_empty() {
        0.0
    } else {
        let mid = sorted_lengths.len() / 2;
        if sorted_lengths.len() % 2 == 0 {
            (sorted_lengths[mid - 1] + sorted_lengths[mid]) as f64 / 2.0
        } else {
            sorted_lengths[mid] as f64
        }
    };

    // Calculate auN (area under Nx curve) = sum(length_i^2) / total_length
    let au_n = if total_length > 0 {
        let sum_sq: f64 = sorted_lengths
            .iter()
            .map(|&l| (l as f64) * (l as f64))
            .sum();
        sum_sq / total_length as f64
    } else {
        0.0
    };

    // Calculate Nx and Lx for x in [10, 20, 30, 40, 50, 60, 70, 80, 90]
    let mut nx_values = Vec::new();
    let mut n50 = 0;
    let mut l50 = 0;
    let mut n90 = 0;
    let mut l90 = 0;

    for x in (10..=90).step_by(10) {
        let threshold = (total_length as f64 * (x as f64 / 100.0)).ceil() as usize;
        let mut cum = 0;
        let mut cur_nx = 0;
        let mut cur_lx = 0;
        for (idx, &len) in sorted_lengths.iter().enumerate() {
            cum += len;
            if cum >= threshold {
                cur_nx = len;
                cur_lx = idx + 1;
                break;
            }
        }
        if x == 50 {
            n50 = cur_nx;
            l50 = cur_lx;
        } else if x == 90 {
            n90 = cur_nx;
            l90 = cur_lx;
        }
        nx_values.push(NxEntry {
            x,
            nx: cur_nx,
            lx: cur_lx,
        });
    }

    // Length thresholds
    let standard_thresholds = [1_000, 5_000, 10_000, 25_000, 50_000, 100_000];
    let mut thresholds = Vec::new();
    for &th in &standard_thresholds {
        let count = sorted_lengths.iter().filter(|&&l| l >= th).count();
        let th_len: usize = sorted_lengths.iter().filter(|&&l| l >= th).sum();
        let pct = if total_length > 0 {
            (th_len as f64 / total_length as f64) * 100.0
        } else {
            0.0
        };
        thresholds.push(LengthThreshold {
            threshold: th,
            count,
            total_length: th_len,
            percentage_of_assembly: pct,
        });
    }

    AssemblyStats {
        total_length,
        sequence_count,
        contig_count,
        scaffold_count,
        largest_contig,
        smallest_contig,
        mean_length,
        median_length,
        n50,
        l50,
        n90,
        l90,
        au_n,
        gc_percent,
        at_percent,
        n_percent,
        ambiguous_percent,
        total_gap_length,
        gap_count,
        nx_values,
        thresholds,
    }
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct CumulativePoint {
    pub contig_index: usize,
    pub contig_length: usize,
    pub cumulative_length: usize,
    pub cumulative_fraction: f64,
}

pub fn calculate_cumulative_curve(lengths: &[usize], total_length: usize) -> Vec<CumulativePoint> {
    let mut sorted = lengths.to_vec();
    sorted.sort_unstable_by(|a, b| b.cmp(a));

    let mut points = Vec::with_capacity(sorted.len());
    let mut cum = 0;
    for (i, &len) in sorted.iter().enumerate() {
        cum += len;
        let frac = if total_length > 0 {
            (cum as f64 / total_length as f64) * 100.0
        } else {
            0.0
        };
        points.push(CumulativePoint {
            contig_index: i + 1,
            contig_length: len,
            cumulative_length: cum,
            cumulative_fraction: frac,
        });
    }
    points
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct LengthHistogramBin {
    pub min_length: usize,
    pub max_length: usize,
    pub count: usize,
    pub total_bp: usize,
}

pub fn calculate_length_histogram(lengths: &[usize], num_bins: usize) -> Vec<LengthHistogramBin> {
    if lengths.is_empty() || num_bins == 0 {
        return Vec::new();
    }
    let max = *lengths.iter().max().unwrap_or(&0);
    let min = *lengths.iter().min().unwrap_or(&0);

    if max == min {
        return vec![LengthHistogramBin {
            min_length: min,
            max_length: max,
            count: lengths.len(),
            total_bp: lengths.iter().sum(),
        }];
    }

    let bin_width = ((max - min) as f64 / num_bins as f64).ceil() as usize;
    let mut bins = Vec::with_capacity(num_bins);
    for i in 0..num_bins {
        let b_min = min + i * bin_width;
        let b_max = if i == num_bins - 1 {
            max + 1
        } else {
            b_min + bin_width
        };
        bins.push(LengthHistogramBin {
            min_length: b_min,
            max_length: b_max,
            count: 0,
            total_bp: 0,
        });
    }

    for &len in lengths {
        let mut idx = (len - min) / bin_width;
        if idx >= num_bins {
            idx = num_bins - 1;
        }
        bins[idx].count += 1;
        bins[idx].total_bp += len;
    }

    bins
}
