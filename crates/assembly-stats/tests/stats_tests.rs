use assembly_core::SequenceRecord;
use assembly_stats::{
    calculate_assembly_stats, calculate_cumulative_curve, calculate_length_histogram,
};

#[test]
fn test_n50_and_l50_exact_calculation() {
    // Standard canonical example: sequences of lengths 10, 20, 30, 40 (total = 100)
    // Sorted descending: 40, 30, 20, 10
    // Half total = 50
    // 40 < 50
    // 40 + 30 = 70 >= 50
    // Therefore N50 = 30, L50 = 2
    let seqs = vec![
        SequenceRecord {
            id: "s1".into(),
            name: "s1".into(),
            description: None,
            length: 10,
            gc_count: 5,
            at_count: 5,
            n_count: 0,
            ambiguous_count: 0,
            gap_count: 0,
            total_gap_length: 0,
            is_circular: false,
        },
        SequenceRecord {
            id: "s2".into(),
            name: "s2".into(),
            description: None,
            length: 20,
            gc_count: 10,
            at_count: 10,
            n_count: 0,
            ambiguous_count: 0,
            gap_count: 0,
            total_gap_length: 0,
            is_circular: false,
        },
        SequenceRecord {
            id: "s3".into(),
            name: "s3".into(),
            description: None,
            length: 30,
            gc_count: 15,
            at_count: 15,
            n_count: 0,
            ambiguous_count: 0,
            gap_count: 0,
            total_gap_length: 0,
            is_circular: false,
        },
        SequenceRecord {
            id: "s4".into(),
            name: "s4".into(),
            description: None,
            length: 40,
            gc_count: 20,
            at_count: 20,
            n_count: 0,
            ambiguous_count: 0,
            gap_count: 0,
            total_gap_length: 0,
            is_circular: false,
        },
    ];

    let stats = calculate_assembly_stats(&seqs, &[]);
    assert_eq!(stats.total_length, 100);
    assert_eq!(stats.sequence_count, 4);
    assert_eq!(stats.n50, 30);
    assert_eq!(stats.l50, 2);
    assert_eq!(stats.largest_contig, 40);
    assert_eq!(stats.smallest_contig, 10);
    assert_eq!(stats.mean_length, 25.0);
    assert_eq!(stats.median_length, 25.0);
    assert!((stats.gc_percent - 50.0).abs() < 1e-6);

    // auN = (40^2 + 30^2 + 20^2 + 10^2) / 100 = (1600 + 900 + 400 + 100) / 100 = 3000 / 100 = 30.0
    assert!((stats.au_n - 30.0).abs() < 1e-6);
}

#[test]
fn test_empty_assembly() {
    let stats = calculate_assembly_stats(&[], &[]);
    assert_eq!(stats.total_length, 0);
    assert_eq!(stats.sequence_count, 0);
    assert_eq!(stats.n50, 0);
    assert_eq!(stats.l50, 0);
    assert_eq!(stats.gc_percent, 0.0);
}

#[test]
fn test_gc_and_ambiguity_calculation() {
    let seq = SequenceRecord {
        id: "ambig".into(),
        name: "ambig".into(),
        description: None,
        length: 100,
        gc_count: 40,
        at_count: 40,
        n_count: 10,
        ambiguous_count: 10,
        gap_count: 1,
        total_gap_length: 10,
        is_circular: false,
    };
    // GC% is 40 / (40 + 40) = 50.0%
    assert!((seq.gc_percent() - 50.0).abs() < 1e-6);
    // N% is 10 / 100 = 10.0%
    assert!((seq.n_percent() - 10.0).abs() < 1e-6);
    // Ambiguous% is 10 / 100 = 10.0%
    assert!((seq.ambiguous_percent() - 10.0).abs() < 1e-6);
}

#[test]
fn test_cumulative_curve_and_histogram() {
    let lengths = vec![50, 30, 20];
    let curve = calculate_cumulative_curve(&lengths, 100);
    assert_eq!(curve.len(), 3);
    assert_eq!(curve[0].cumulative_length, 50);
    assert_eq!(curve[1].cumulative_length, 80);
    assert_eq!(curve[2].cumulative_length, 100);

    let hist = calculate_length_histogram(&lengths, 3);
    assert_eq!(hist.len(), 3);
    let total_count: usize = hist.iter().map(|b| b.count).sum();
    assert_eq!(total_count, 3);
}
