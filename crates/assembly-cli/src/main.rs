use anyhow::{Context, Result};
use clap::{Parser, Subcommand};
use std::fs::{self, File};
use std::io::Write;
use std::path::PathBuf;

use assembly_core::{AssemblyStats, SequenceRecord};
use assembly_stats::{
    calculate_assembly_stats, calculate_cumulative_curve, calculate_length_histogram,
};
use genome_index::GenomeIndex;
use genome_tiles::generate_genome_wheel_payload;
use sequence_io::{parse_fasta_streaming, parse_gfa, parse_paf};

#[derive(Parser)]
#[command(
    name = "genome-studio",
    author = "Genome Assembly Studio Contributors",
    version = "0.1.0",
    about = "High-performance sequence processing engine for Genome Assembly Studio"
)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Perform full assembly analysis and generate stats, GC profiles, and tiles
    Analyze {
        /// Input FASTA / FNA / FA file (plain or gzip-compressed)
        fasta: PathBuf,
        /// Output directory for JSON and report artifacts
        #[arg(short, long, default_value = "results")]
        output: PathBuf,
        /// Output machine-readable JSON to stdout
        #[arg(long)]
        json: bool,
        /// Minimum gap length in bp to split contigs from scaffolds
        #[arg(long, default_value_t = 10)]
        min_gap: usize,
        /// Sliding window size for GC profiling
        #[arg(long, visible_alias = "window", default_value_t = 5000)]
        window_size: usize,
        /// Sliding window step for GC profiling
        #[arg(long, default_value_t = 2500)]
        step: usize,
    },
    /// Generate sequence index and slice lookups
    Index {
        /// Input FASTA / FNA / FA file
        fasta: PathBuf,
        /// Output directory for index files
        #[arg(short, long, default_value = "index")]
        output: PathBuf,
        /// Print index JSON to stdout
        #[arg(long)]
        json: bool,
    },
    /// Quick summary statistics of an assembly
    Stats {
        /// Input FASTA / FNA / FA file
        fasta: PathBuf,
        /// Output machine-readable JSON to stdout
        #[arg(long)]
        json: bool,
    },
    /// Compute sliding-window GC profile across sequences
    Profile {
        /// Input FASTA / FNA / FA file
        fasta: PathBuf,
        /// Window size in base pairs
        #[arg(long, visible_alias = "window", default_value_t = 5000)]
        window_size: usize,
        /// Step size in base pairs
        #[arg(long, default_value_t = 2500)]
        step: usize,
        /// Output machine-readable JSON to stdout
        #[arg(long)]
        json: bool,
    },
    /// Inspect a specific sequence or interval
    Inspect {
        /// Input FASTA / FNA / FA file
        fasta: PathBuf,
        /// Target sequence identifier
        #[arg(long)]
        sequence: String,
        /// Zero-based start coordinate
        #[arg(long, default_value_t = 0)]
        start: usize,
        /// Zero-based end coordinate (0 for full sequence)
        #[arg(long, default_value_t = 0)]
        end: usize,
    },
    /// Parse and compute metrics for a GFA assembly graph
    GraphStats {
        /// Input GFA file
        gfa: PathBuf,
        /// Output machine-readable JSON to stdout
        #[arg(long)]
        json: bool,
    },
    /// Parse and compute metrics for a PAF alignment
    AlignStats {
        /// Input PAF file
        paf: PathBuf,
        /// Output machine-readable JSON to stdout
        #[arg(long)]
        json: bool,
    },
}

#[derive(serde::Serialize)]
struct FullAnalysisOutput {
    stats: AssemblyStats,
    sequences: Vec<SequenceRecord>,
    cumulative_curve: Vec<assembly_stats::CumulativePoint>,
    length_histogram: Vec<assembly_stats::LengthHistogramBin>,
    genome_wheel: genome_tiles::GenomeWheelPayload,
}

fn main() -> Result<()> {
    let cli = Cli::parse();

    match cli.command {
        Commands::Analyze {
            fasta,
            output,
            json,
            min_gap,
            window_size,
            step,
        } => {
            let summary = parse_fasta_streaming(&fasta, min_gap)
                .with_context(|| format!("Failed to parse FASTA file: {:?}", fasta))?;

            let stats = calculate_assembly_stats(&summary.sequences, &summary.contigs);
            let target_lengths: Vec<usize> = if !summary.contigs.is_empty() {
                summary.contigs.iter().map(|c| c.length).collect()
            } else {
                summary.sequences.iter().map(|s| s.length).collect()
            };

            let cumulative = calculate_cumulative_curve(&target_lengths, stats.total_length);
            let histogram = calculate_length_histogram(&target_lengths, 20);

            let gc_bins = GenomeIndex::compute_sliding_window_gc(&fasta, window_size, step)
                .unwrap_or_default();

            let wheel = generate_genome_wheel_payload(&summary.sequences, &gc_bins, &[], 50);

            let result = FullAnalysisOutput {
                stats: stats.clone(),
                sequences: summary.sequences.clone(),
                cumulative_curve: cumulative,
                length_histogram: histogram,
                genome_wheel: wheel,
            };

            fs::create_dir_all(&output)?;
            let json_path = output.join("analysis.json");
            let mut file = File::create(&json_path)?;
            let json_str = serde_json::to_string_pretty(&result)?;
            file.write_all(json_str.as_bytes())?;

            if json {
                println!("{}", json_str);
            } else {
                println!("=== Genome Assembly Studio Analysis ===");
                println!("File:                {:?}", fasta);
                println!("Total length:        {} bp", stats.total_length);
                println!("Sequences:           {}", stats.sequence_count);
                println!("Contigs:             {}", stats.contig_count);
                println!("N50:                 {} bp", stats.n50);
                println!("L50:                 {}", stats.l50);
                println!("N90:                 {} bp", stats.n90);
                println!("L90:                 {}", stats.l90);
                println!("auN:                 {:.1} bp", stats.au_n);
                println!("GC content:          {:.2}%", stats.gc_percent);
                println!("N content:           {:.2}%", stats.n_percent);
                println!(
                    "Gaps:                {} ({} bp total)",
                    stats.gap_count, stats.total_gap_length
                );
                println!("Artifacts saved to:  {:?}", json_path);
            }
        }
        Commands::Stats { fasta, json } => {
            let summary = parse_fasta_streaming(&fasta, 10)?;
            let stats = calculate_assembly_stats(&summary.sequences, &summary.contigs);
            if json {
                println!("{}", serde_json::to_string_pretty(&stats)?);
            } else {
                println!("Total Length:  {} bp", stats.total_length);
                println!("Sequences:     {}", stats.sequence_count);
                println!("N50:           {} bp", stats.n50);
                println!("L50:           {}", stats.l50);
                println!("GC%:           {:.2}%", stats.gc_percent);
            }
        }
        Commands::Index {
            fasta,
            output,
            json,
        } => {
            let index = GenomeIndex::build(&fasta)?;
            fs::create_dir_all(&output)?;
            let index_path = output.join("genome.idx.json");
            let json_str = serde_json::to_string_pretty(&index)?;
            fs::write(&index_path, &json_str)?;

            if json {
                println!("{}", json_str);
            } else {
                println!(
                    "Indexed {} sequences into {:?}",
                    index.entries.len(),
                    index_path
                );
            }
        }
        Commands::Profile {
            fasta,
            window_size,
            step,
            json,
        } => {
            let bins = GenomeIndex::compute_sliding_window_gc(&fasta, window_size, step)?;
            if json {
                println!("{}", serde_json::to_string_pretty(&bins)?);
            } else {
                println!("Generated {} GC profile bins across sequences.", bins.len());
            }
        }
        Commands::Inspect {
            fasta,
            sequence,
            start,
            end,
        } => {
            let effective_end = if end == 0 { usize::MAX } else { end };
            let slice = GenomeIndex::get_sequence_slice(&fasta, &sequence, start, effective_end)?;
            println!(
                ">{} {}-{} len={}",
                sequence,
                start,
                start + slice.len(),
                slice.len()
            );
            println!("{}", slice);
        }
        Commands::GraphStats { gfa, json } => {
            let graph = parse_gfa(&gfa)?;
            if json {
                println!("{}", serde_json::to_string_pretty(&graph)?);
            } else {
                println!("=== Assembly Graph Summary ===");
                println!("Nodes:                 {}", graph.total_nodes);
                println!("Edges:                 {}", graph.total_edges);
                println!("Total sequence length: {} bp", graph.total_length);
                println!("Connected components:  {}", graph.connected_components);
                println!("Dead ends:             {}", graph.dead_ends);
                println!("Branch points:         {}", graph.branch_points);
            }
        }
        Commands::AlignStats { paf, json } => {
            let alignments = parse_paf(&paf)?;
            let total_alignments = alignments.len();
            let total_aligned_len: usize = alignments.iter().map(|a| a.alignment_length).sum();
            let total_matches: usize = alignments.iter().map(|a| a.matches).sum();
            let avg_mapq = if total_alignments > 0 {
                alignments
                    .iter()
                    .map(|a| a.mapping_quality as f64)
                    .sum::<f64>()
                    / total_alignments as f64
            } else {
                0.0
            };

            #[derive(serde::Serialize)]
            struct PafSummary {
                total_alignments: usize,
                total_aligned_length: usize,
                total_matches: usize,
                average_mapping_quality: f64,
                alignments: Vec<assembly_core::AlignmentRecord>,
            }

            let summary = PafSummary {
                total_alignments,
                total_aligned_length: total_aligned_len,
                total_matches,
                average_mapping_quality: avg_mapq,
                alignments,
            };

            if json {
                println!("{}", serde_json::to_string_pretty(&summary)?);
            } else {
                println!("Total alignments:      {}", total_alignments);
                println!("Total aligned length:  {} bp", total_aligned_len);
                println!("Total matches:         {}", total_matches);
                println!("Average MAPQ:          {:.1}", avg_mapq);
            }
        }
    }

    Ok(())
}
