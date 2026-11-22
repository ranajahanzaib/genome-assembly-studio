use std::collections::HashMap;
use std::io::BufRead;
use std::path::{Path, PathBuf};

use assembly_core::{EngineError, GCProfileBin, Result};
use sequence_io::open_reader;

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct IndexEntry {
    pub id: String,
    pub length: usize,
    pub byte_offset: u64,
    pub line_len: usize,
    pub line_byte_len: usize,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct GenomeIndex {
    pub fasta_path: PathBuf,
    pub entries: HashMap<String, IndexEntry>,
    pub total_length: usize,
}

impl GenomeIndex {
    pub fn build<P: AsRef<Path>>(fasta_path: P) -> Result<Self> {
        let path_buf = fasta_path.as_ref().to_path_buf();
        let reader = open_reader(&path_buf)?;
        let mut entries = HashMap::new();
        let mut total_length = 0;

        let mut current_id: Option<String> = None;
        let mut current_length = 0;
        let byte_offset = 0u64;

        for line_result in reader.lines() {
            let line = line_result?;
            let trimmed = line.trim();
            if trimmed.is_empty() {
                continue;
            }

            if trimmed.starts_with('>') {
                if let Some(id) = current_id {
                    total_length += current_length;
                    entries.insert(
                        id.clone(),
                        IndexEntry {
                            id,
                            length: current_length,
                            byte_offset,
                            line_len: 60,
                            line_byte_len: 61,
                        },
                    );
                }
                let parts: Vec<&str> = trimmed[1..].split_whitespace().collect();
                current_id = parts.first().map(|s| s.to_string());
                current_length = 0;
            } else if current_id.is_some() {
                current_length += trimmed.len();
            }
        }

        if let Some(id) = current_id {
            total_length += current_length;
            entries.insert(
                id.clone(),
                IndexEntry {
                    id,
                    length: current_length,
                    byte_offset,
                    line_len: 60,
                    line_byte_len: 61,
                },
            );
        }

        Ok(GenomeIndex {
            fasta_path: path_buf,
            entries,
            total_length,
        })
    }

    pub fn get_sequence_slice<P: AsRef<Path>>(
        fasta_path: P,
        seq_id: &str,
        start: usize,
        end: usize,
    ) -> Result<String> {
        let reader = open_reader(fasta_path)?;
        let mut found = false;
        let mut seq_buffer = String::new();

        for line_result in reader.lines() {
            let line = line_result?;
            let trimmed = line.trim();
            if trimmed.is_empty() {
                continue;
            }

            if trimmed.starts_with('>') {
                let parts: Vec<&str> = trimmed[1..].split_whitespace().collect();
                if let Some(first) = parts.first() {
                    if *first == seq_id {
                        found = true;
                        continue;
                    } else if found {
                        break;
                    }
                }
            } else if found {
                seq_buffer.push_str(trimmed);
                if seq_buffer.len() >= end {
                    break;
                }
            }
        }

        if !found {
            return Err(EngineError::SequenceNotFound(seq_id.to_string()));
        }

        let len = seq_buffer.len();
        if start > end || start > len {
            return Err(EngineError::InvalidInterval(start, end, len));
        }

        let slice_end = end.min(len);
        Ok(seq_buffer[start..slice_end].to_string())
    }

    pub fn compute_sliding_window_gc<P: AsRef<Path>>(
        fasta_path: P,
        window_size: usize,
        step: usize,
    ) -> Result<Vec<GCProfileBin>> {
        let reader = open_reader(fasta_path)?;
        let mut profiles = Vec::new();
        let mut current_id: Option<String> = None;
        let mut current_seq = String::new();

        let mut process_seq = |id: &str, seq: &str| {
            let len = seq.len();
            if len == 0 {
                return;
            }
            let bytes = seq.as_bytes();
            let mut start = 0;
            while start < len {
                let end = (start + window_size).min(len);
                let window = &bytes[start..end];
                let mut gc = 0;
                let mut at = 0;
                let mut n = 0;
                let mut amb = 0;

                for &b in window {
                    match b {
                        b'G' | b'g' | b'C' | b'c' => gc += 1,
                        b'A' | b'a' | b'T' | b't' => at += 1,
                        b'N' | b'n' => n += 1,
                        _ => amb += 1,
                    }
                }

                let canon = gc + at;
                let gc_pct = if canon > 0 {
                    (gc as f64 / canon as f64) * 100.0
                } else {
                    0.0
                };
                let win_len = window.len() as f64;
                let n_pct = (n as f64 / win_len) * 100.0;
                let amb_pct = (amb as f64 / win_len) * 100.0;

                profiles.push(GCProfileBin {
                    sequence_id: id.to_string(),
                    start,
                    end,
                    gc_percent: (gc_pct * 10.0).round() / 10.0,
                    ambiguous_percent: (amb_pct * 10.0).round() / 10.0,
                    n_percent: (n_pct * 10.0).round() / 10.0,
                });

                if end == len {
                    break;
                }
                start += step;
            }
        };

        for line_result in reader.lines() {
            let line = line_result?;
            let trimmed = line.trim();
            if trimmed.is_empty() {
                continue;
            }

            if trimmed.starts_with('>') {
                if let Some(ref id) = current_id {
                    process_seq(id, &current_seq);
                }
                let parts: Vec<&str> = trimmed[1..].split_whitespace().collect();
                current_id = parts.first().map(|s| s.to_string());
                current_seq.clear();
            } else if current_id.is_some() {
                current_seq.push_str(trimmed);
            }
        }

        if let Some(ref id) = current_id {
            process_seq(id, &current_seq);
        }

        Ok(profiles)
    }
}
