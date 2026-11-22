use genome_index::GenomeIndex;
use std::io::Write;
use tempfile::NamedTempFile;

#[test]
fn test_index_and_subsequence_slice() {
    let mut file = NamedTempFile::new().unwrap();
    writeln!(file, ">seq1\nACGTACGTACGT\n>seq2\nGGGGTTTT").unwrap();

    let index = GenomeIndex::build(file.path()).unwrap();
    assert_eq!(index.entries.len(), 2);
    assert_eq!(index.entries.get("seq1").unwrap().length, 12);
    assert_eq!(index.entries.get("seq2").unwrap().length, 8);

    // Slice seq1 [4..8] -> "ACGT"
    let slice = GenomeIndex::get_sequence_slice(file.path(), "seq1", 4, 8).unwrap();
    assert_eq!(slice, "ACGT");
}

#[test]
fn test_sliding_window_gc() {
    let mut file = NamedTempFile::new().unwrap();
    writeln!(file, ">seq1\nGCGCGCGCATATATAT").unwrap(); // 8 GC then 8 AT, len=16

    let bins = GenomeIndex::compute_sliding_window_gc(file.path(), 8, 8).unwrap();
    assert_eq!(bins.len(), 2);
    assert_eq!(bins[0].start, 0);
    assert_eq!(bins[0].end, 8);
    assert_eq!(bins[0].gc_percent, 100.0);
    assert_eq!(bins[1].start, 8);
    assert_eq!(bins[1].end, 16);
    assert_eq!(bins[1].gc_percent, 0.0);
}
