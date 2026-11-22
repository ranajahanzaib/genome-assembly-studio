use flate2::write::GzEncoder;
use flate2::Compression;
use std::io::Write;
use tempfile::NamedTempFile;

use sequence_io::{parse_fasta_streaming, parse_gfa, parse_paf};

#[test]
fn test_plain_fasta_parsing_with_gaps() {
    let mut file = NamedTempFile::new().unwrap();
    writeln!(
        file,
        ">chr1 test chromosome circular\n\
        GCATGCATGC\n\
        NNNNNNNNNNNN\n\
        ATGCATGCAT"
    )
    .unwrap();

    let summary = parse_fasta_streaming(file.path(), 10).unwrap();
    assert_eq!(summary.sequences.len(), 1);
    let s = &summary.sequences[0];
    assert_eq!(s.id, "chr1");
    assert_eq!(s.length, 32); // 10 + 12 + 10
    assert_eq!(s.gc_count, 10);
    assert_eq!(s.at_count, 10);
    assert_eq!(s.n_count, 12);
    assert!(s.is_circular);
    assert_eq!(s.gap_count, 1);
    assert_eq!(s.total_gap_length, 12);

    // Contigs split at the 12-N gap
    assert_eq!(summary.contigs.len(), 2);
    assert_eq!(summary.contigs[0].length, 10);
    assert_eq!(summary.contigs[1].length, 10);
}

#[test]
fn test_gzipped_fasta_parsing() {
    let file = NamedTempFile::new().unwrap();
    let gz_file = std::fs::File::create(file.path()).unwrap();
    let mut encoder = GzEncoder::new(gz_file, Compression::default());
    writeln!(encoder, ">seq_gz compressed sequence\nACGTACGTACGT").unwrap();
    encoder.finish().unwrap();

    let summary = parse_fasta_streaming(file.path(), 10).unwrap();
    assert_eq!(summary.sequences.len(), 1);
    assert_eq!(summary.sequences[0].id, "seq_gz");
    assert_eq!(summary.sequences[0].length, 12);
    assert_eq!(summary.sequences[0].gc_count, 6);
    assert_eq!(summary.sequences[0].at_count, 6);
}

#[test]
fn test_gfa_parsing() {
    let mut file = NamedTempFile::new().unwrap();
    writeln!(file, "H\tVN:Z:1.0").unwrap();
    writeln!(file, "S\ts1\tACGT\tLN:i:4\tDP:f:12.5").unwrap();
    writeln!(file, "S\ts2\tTGCA\tLN:i:4\tDP:f:10.0").unwrap();
    writeln!(file, "L\ts1\t+\ts2\t+\t0M").unwrap();

    let graph = parse_gfa(file.path()).unwrap();
    assert_eq!(graph.total_nodes, 2);
    assert_eq!(graph.total_edges, 1);
    assert_eq!(graph.total_length, 8);
    assert_eq!(graph.connected_components, 1);
}

#[test]
fn test_paf_parsing() {
    let mut file = NamedTempFile::new().unwrap();
    writeln!(
        file,
        "contig1\t1000\t100\t900\t+\tchr1\t5000\t1100\t1900\t790\t800\t60"
    )
    .unwrap();

    let alns = parse_paf(file.path()).unwrap();
    assert_eq!(alns.len(), 1);
    assert_eq!(alns[0].query_name, "contig1");
    assert_eq!(alns[0].target_name, "chr1");
    assert_eq!(alns[0].matches, 790);
    assert_eq!(alns[0].mapping_quality, 60);
}
