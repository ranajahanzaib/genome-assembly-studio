use flate2::read::MultiGzDecoder;
use std::fs::File;
use std::io::{BufRead, BufReader, Read};
use std::path::Path;

use assembly_core::{
    AlignmentRecord, ContigRecord, GapRecord, GfaEdge, GfaGraph, GfaNode, Result, SequenceRecord,
    Strand,
};

pub fn is_gzipped<P: AsRef<Path>>(path: P) -> Result<bool> {
    let mut file = File::open(path)?;
    let mut magic = [0u8; 2];
    let bytes_read = file.read(&mut magic)?;
    Ok(bytes_read == 2 && magic[0] == 0x1f && magic[1] == 0x8b)
}

pub fn open_reader<P: AsRef<Path>>(path: P) -> Result<Box<dyn BufRead>> {
    let file = File::open(&path)?;
    if is_gzipped(&path)? {
        let gz = MultiGzDecoder::new(file);
        Ok(Box::new(BufReader::with_capacity(64 * 1024, gz)))
    } else {
        Ok(Box::new(BufReader::with_capacity(64 * 1024, file)))
    }
}

pub struct FastaStreamSummary {
    pub sequences: Vec<SequenceRecord>,
    pub contigs: Vec<ContigRecord>,
    pub gaps: Vec<GapRecord>,
}

pub fn parse_fasta_streaming<P: AsRef<Path>>(
    path: P,
    min_gap_len: usize,
) -> Result<FastaStreamSummary> {
    let reader = open_reader(path)?;
    let mut sequences = Vec::new();
    let mut contigs = Vec::new();
    let mut gaps = Vec::new();

    let mut current_header: Option<String> = None;
    let mut current_length: usize = 0;
    let mut gc_count: usize = 0;
    let mut at_count: usize = 0;
    let mut n_count: usize = 0;
    let mut ambiguous_count: usize = 0;

    // Track gaps in current sequence
    let mut seq_gaps: Vec<(usize, usize)> = Vec::new();
    let mut current_n_run_start: Option<usize> = None;

    // Helper closure to finalize current sequence
    let mut finalize_seq = |header: &str,
                            len: usize,
                            gc: usize,
                            at: usize,
                            n: usize,
                            amb: usize,
                            gaps_list: &[(usize, usize)]| {
        let parts: Vec<&str> = header.split_whitespace().collect();
        let name = parts.first().unwrap_or(&"unknown").to_string();
        let description = if parts.len() > 1 {
            Some(parts[1..].join(" "))
        } else {
            None
        };

        let is_circular = header.to_lowercase().contains("circular");
        let gap_count = gaps_list.len();
        let total_gap_len: usize = gaps_list.iter().map(|(s, e)| e - s).sum();

        sequences.push(SequenceRecord {
            id: name.clone(),
            name: name.clone(),
            description,
            length: len,
            gc_count: gc,
            at_count: at,
            n_count: n,
            ambiguous_count: amb,
            gap_count,
            total_gap_length: total_gap_len,
            is_circular,
        });

        // Generate contigs split by gaps
        if gaps_list.is_empty() {
            if len > 0 {
                contigs.push(ContigRecord {
                    id: format!("{}_ctg1", name),
                    scaffold_id: name.clone(),
                    start_in_scaffold: 0,
                    end_in_scaffold: len,
                    length: len,
                    gc_count: gc,
                    at_count: at,
                });
            }
        } else {
            let mut last_end = 0;
            let mut ctg_idx = 1;
            for &(gap_start, gap_end) in gaps_list {
                if gap_start > last_end {
                    let ctg_len = gap_start - last_end;
                    contigs.push(ContigRecord {
                        id: format!("{}_ctg{}", name, ctg_idx),
                        scaffold_id: name.clone(),
                        start_in_scaffold: last_end,
                        end_in_scaffold: gap_start,
                        length: ctg_len,
                        gc_count: 0, // In streaming mode, contig base counts can be approximated or computed in detail
                        at_count: 0,
                    });
                    ctg_idx += 1;
                }
                gaps.push(GapRecord {
                    scaffold_id: name.clone(),
                    start: gap_start,
                    end: gap_end,
                    length: gap_end - gap_start,
                });
                last_end = gap_end;
            }
            if last_end < len {
                let ctg_len = len - last_end;
                contigs.push(ContigRecord {
                    id: format!("{}_ctg{}", name, ctg_idx),
                    scaffold_id: name.clone(),
                    start_in_scaffold: last_end,
                    end_in_scaffold: len,
                    length: ctg_len,
                    gc_count: 0,
                    at_count: 0,
                });
            }
        }
    };

    for line_result in reader.lines() {
        let line = line_result?;
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }

        if trimmed.starts_with('>') {
            if let Some(ref header) = current_header {
                if let Some(start) = current_n_run_start {
                    if current_length - start >= min_gap_len {
                        seq_gaps.push((start, current_length));
                    }
                }
                finalize_seq(
                    header,
                    current_length,
                    gc_count,
                    at_count,
                    n_count,
                    ambiguous_count,
                    &seq_gaps,
                );
            }

            current_header = Some(trimmed[1..].to_string());
            current_length = 0;
            gc_count = 0;
            at_count = 0;
            n_count = 0;
            ambiguous_count = 0;
            seq_gaps.clear();
            current_n_run_start = None;
        } else if current_header.is_some() {
            for b in trimmed.bytes() {
                match b {
                    b'G' | b'g' | b'C' | b'c' => {
                        gc_count += 1;
                        if let Some(start) = current_n_run_start {
                            if current_length - start >= min_gap_len {
                                seq_gaps.push((start, current_length));
                            }
                            current_n_run_start = None;
                        }
                    }
                    b'A' | b'a' | b'T' | b't' => {
                        at_count += 1;
                        if let Some(start) = current_n_run_start {
                            if current_length - start >= min_gap_len {
                                seq_gaps.push((start, current_length));
                            }
                            current_n_run_start = None;
                        }
                    }
                    b'N' | b'n' => {
                        n_count += 1;
                        if current_n_run_start.is_none() {
                            current_n_run_start = Some(current_length);
                        }
                    }
                    b'R' | b'r' | b'Y' | b'y' | b'S' | b's' | b'W' | b'w' | b'K' | b'k' | b'M'
                    | b'm' | b'B' | b'b' | b'D' | b'd' | b'H' | b'h' | b'V' | b'v' => {
                        ambiguous_count += 1;
                        if let Some(start) = current_n_run_start {
                            if current_length - start >= min_gap_len {
                                seq_gaps.push((start, current_length));
                            }
                            current_n_run_start = None;
                        }
                    }
                    _ => {}
                }
                current_length += 1;
            }
        }
    }

    if let Some(ref header) = current_header {
        if let Some(start) = current_n_run_start {
            if current_length - start >= min_gap_len {
                seq_gaps.push((start, current_length));
            }
        }
        finalize_seq(
            header,
            current_length,
            gc_count,
            at_count,
            n_count,
            ambiguous_count,
            &seq_gaps,
        );
    }

    Ok(FastaStreamSummary {
        sequences,
        contigs,
        gaps,
    })
}

pub fn parse_gfa<P: AsRef<Path>>(path: P) -> Result<GfaGraph> {
    let reader = open_reader(path)?;
    let mut nodes = Vec::new();
    let mut edges = Vec::new();
    let mut adjacency: std::collections::HashMap<String, Vec<String>> =
        std::collections::HashMap::new();

    for line_result in reader.lines() {
        let line = line_result?;
        let trimmed = line.trim();
        if trimmed.is_empty() || trimmed.starts_with('#') {
            continue;
        }

        let fields: Vec<&str> = trimmed.split('\t').collect();
        if fields.is_empty() {
            continue;
        }

        match fields[0] {
            "S" => {
                if fields.len() >= 3 {
                    let id = fields[1].to_string();
                    let seq = fields[2];
                    let length = if seq == "*" {
                        // Check LN:i: tag
                        fields
                            .iter()
                            .find(|f| f.starts_with("LN:i:"))
                            .and_then(|f| f[5..].parse::<usize>().ok())
                            .unwrap_or(0)
                    } else {
                        seq.len()
                    };

                    let sequence_preview = if seq != "*" && !seq.is_empty() {
                        let take_len = seq.len().min(60);
                        Some(seq[..take_len].to_string())
                    } else {
                        None
                    };

                    let coverage = fields
                        .iter()
                        .find(|f| {
                            f.starts_with("dp:f:")
                                || f.starts_with("DP:f:")
                                || f.starts_with("RC:i:")
                                || f.starts_with("KC:i:")
                        })
                        .and_then(|f| f[5..].parse::<f64>().ok());

                    let gc_percent = if seq != "*" && !seq.is_empty() {
                        let gc = seq
                            .bytes()
                            .filter(|b| matches!(b, b'G' | b'g' | b'C' | b'c'))
                            .count();
                        let at = seq
                            .bytes()
                            .filter(|b| matches!(b, b'A' | b'a' | b'T' | b't'))
                            .count();
                        if gc + at > 0 {
                            Some((gc as f64 / (gc + at) as f64) * 100.0)
                        } else {
                            None
                        }
                    } else {
                        None
                    };

                    adjacency.entry(id.clone()).or_default();
                    nodes.push(GfaNode {
                        id,
                        length,
                        sequence_preview,
                        coverage,
                        gc_percent,
                    });
                }
            }
            "L" => {
                if fields.len() >= 5 {
                    let from_node = fields[1].to_string();
                    let from_orientation = fields[2].chars().next().unwrap_or('+');
                    let to_node = fields[3].to_string();
                    let to_orientation = fields[4].chars().next().unwrap_or('+');
                    let overlap = if fields.len() >= 6 {
                        fields[5].to_string()
                    } else {
                        "0M".to_string()
                    };

                    adjacency
                        .entry(from_node.clone())
                        .or_default()
                        .push(to_node.clone());
                    adjacency
                        .entry(to_node.clone())
                        .or_default()
                        .push(from_node.clone());

                    edges.push(GfaEdge {
                        from_node,
                        from_orientation,
                        to_node,
                        to_orientation,
                        overlap,
                    });
                }
            }
            _ => {}
        }
    }

    let total_nodes = nodes.len();
    let total_edges = edges.len();
    let total_length: usize = nodes.iter().map(|n| n.length).sum();

    // Compute graph topology: dead ends (degree <= 1), branch points (degree > 2)
    let mut dead_ends = 0;
    let mut branch_points = 0;
    for neighbors in adjacency.values() {
        if neighbors.len() <= 1 {
            dead_ends += 1;
        } else if neighbors.len() > 2 {
            branch_points += 1;
        }
    }

    // Connected components using BFS
    let mut visited: std::collections::HashSet<String> = std::collections::HashSet::new();
    let mut connected_components = 0;
    for node in &nodes {
        if !visited.contains(&node.id) {
            connected_components += 1;
            let mut queue = std::collections::VecDeque::new();
            queue.push_back(node.id.clone());
            visited.insert(node.id.clone());
            while let Some(current) = queue.pop_front() {
                if let Some(neighbors) = adjacency.get(&current) {
                    for nbr in neighbors {
                        if !visited.contains(nbr) {
                            visited.insert(nbr.clone());
                            queue.push_back(nbr.clone());
                        }
                    }
                }
            }
        }
    }

    Ok(GfaGraph {
        nodes,
        edges,
        total_nodes,
        total_edges,
        total_length,
        dead_ends,
        branch_points,
        connected_components,
    })
}

pub fn parse_paf<P: AsRef<Path>>(path: P) -> Result<Vec<AlignmentRecord>> {
    let reader = open_reader(path)?;
    let mut alignments = Vec::new();

    for line_result in reader.lines() {
        let line = line_result?;
        let trimmed = line.trim();
        if trimmed.is_empty() || trimmed.starts_with('#') {
            continue;
        }

        let fields: Vec<&str> = trimmed.split('\t').collect();
        if fields.len() < 12 {
            continue;
        }

        let query_name = fields[0].to_string();
        let query_length = fields[1].parse::<usize>().unwrap_or(0);
        let query_start = fields[2].parse::<usize>().unwrap_or(0);
        let query_end = fields[3].parse::<usize>().unwrap_or(0);
        let strand = if fields[4] == "-" {
            Strand::Reverse
        } else {
            Strand::Forward
        };
        let target_name = fields[5].to_string();
        let target_length = fields[6].parse::<usize>().unwrap_or(0);
        let target_start = fields[7].parse::<usize>().unwrap_or(0);
        let target_end = fields[8].parse::<usize>().unwrap_or(0);
        let matches = fields[9].parse::<usize>().unwrap_or(0);
        let alignment_length = fields[10].parse::<usize>().unwrap_or(0);
        let mapping_quality = fields[11].parse::<u8>().unwrap_or(0);

        alignments.push(AlignmentRecord {
            query_name,
            query_length,
            query_start,
            query_end,
            strand,
            target_name,
            target_length,
            target_start,
            target_end,
            matches,
            alignment_length,
            mapping_quality,
        });
    }

    Ok(alignments)
}
