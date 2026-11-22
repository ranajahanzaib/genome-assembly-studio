import subprocess
import json
import os
import shutil
from typing import Dict, Any, Optional
from services.api.app.core.config import settings

class RustEngineIntegration:
    @staticmethod
    def get_binary_path() -> str:
        # Check configured path, target/release, target/debug, or PATH
        candidates = [
            settings.RUST_CLI_PATH,
            os.path.abspath("./target/release/genome-studio"),
            os.path.abspath("./target/debug/genome-studio"),
            shutil.which("genome-studio")
        ]
        for c in candidates:
            if c and os.path.isfile(c) and os.access(c, os.X_OK):
                return c
        return settings.RUST_CLI_PATH

    @staticmethod
    def is_available() -> bool:
        bin_path = RustEngineIntegration.get_binary_path()
        return os.path.isfile(bin_path) and os.access(bin_path, os.X_OK)

    @staticmethod
    def analyze_assembly(fasta_path: str, output_dir: Optional[str] = None) -> Dict[str, Any]:
        bin_path = RustEngineIntegration.get_binary_path()
        if not os.path.isfile(bin_path):
            raise FileNotFoundError(f"Rust genome-studio binary not found at {bin_path}")

        if not output_dir:
            output_dir = os.path.join(os.path.dirname(fasta_path), "analysis_artifacts")
        os.makedirs(output_dir, exist_ok=True)

        cmd = [bin_path, "analyze", fasta_path, "--output", output_dir, "--json"]
        proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
        return json.loads(proc.stdout)

    @staticmethod
    def get_gc_profile(fasta_path: str, window_size: int = 5000, step: int = 2500) -> Any:
        bin_path = RustEngineIntegration.get_binary_path()
        cmd = [
            bin_path, "profile", fasta_path,
            "--window-size", str(window_size),
            "--step", str(step),
            "--json"
        ]
        proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
        return json.loads(proc.stdout)

    @staticmethod
    def inspect_sequence(fasta_path: str, sequence_id: str, start: int = 0, end: int = 0) -> str:
        bin_path = RustEngineIntegration.get_binary_path()
        cmd = [
            bin_path, "inspect", fasta_path,
            "--sequence", sequence_id,
            "--start", str(start),
            "--end", str(end)
        ]
        proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
        lines = proc.stdout.strip().split("\n")
        if len(lines) > 1:
            return "".join(lines[1:])
        return ""

    @staticmethod
    def parse_gfa(gfa_path: str) -> Dict[str, Any]:
        bin_path = RustEngineIntegration.get_binary_path()
        cmd = [bin_path, "graph-stats", gfa_path, "--json"]
        proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
        return json.loads(proc.stdout)

    @staticmethod
    def parse_paf(paf_path: str) -> Dict[str, Any]:
        bin_path = RustEngineIntegration.get_binary_path()
        cmd = [bin_path, "align-stats", paf_path, "--json"]
        proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
        return json.loads(proc.stdout)
