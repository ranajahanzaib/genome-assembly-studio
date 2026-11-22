import html

def generate_terminal_svg(output_path: str):
    lines = [
        ("$ genome-studio analyze datasets/fixtures/draft_v1.fasta", "#38BDF8"),
        ("=== Genome Assembly Studio Sequence Analysis ===", "#A7F3D0"),
        ("File:                datasets/fixtures/draft_v1.fasta", "#94A3B8"),
        ("Total length:        48,500 bp", "#E2E8F0"),
        ("Sequences:           12", "#E2E8F0"),
        ("Contigs:             13", "#E2E8F0"),
        ("N50:                 4,000 bp (L50: 5)", "#60A5FA"),
        ("N90:                 2,500 bp (L90: 11)", "#94A3B8"),
        ("auN:                 4,382.5 bp", "#60A5FA"),
        ("GC content:          51.45%", "#34D399"),
        ("N content:           0.10%", "#94A3B8"),
        ("Gaps:                1 (50 bp total)", "#FBBF24"),
        ("Artifacts saved:     results/analysis.json", "#94A3B8"),
        ("", "#000000"),
        ("$ genome-studio graph-stats datasets/fixtures/assembly_graph.gfa", "#38BDF8"),
        ("=== Assembly Graph Summary ===", "#A7F3D0"),
        ("Nodes: 9  |  Edges: 9  |  Dead ends: 2  |  Branch points: 2", "#E2E8F0"),
        ("", "#000000"),
        ("$ genome-studio align-stats datasets/fixtures/v1_to_ref.paf", "#38BDF8"),
        ("Alignments: 13  |  Aligned length: 48,400 bp  |  Matches: 48,115 (99.4%)", "#E2E8F0"),
    ]

    width = 760
    height = 540
    line_height = 22
    start_y = 65

    text_elements = []
    for i, (text, color) in enumerate(lines):
        if not text:
            continue
        y = start_y + (i * line_height)
        safe_text = html.escape(text)
        is_cmd = text.startswith("$")
        font_weight = "600" if is_cmd else "400"
        text_elements.append(
            f'<text x="28" y="{y}" fill="{color}" font-weight="{font_weight}">{safe_text}</text>'
        )

    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="{width}" height="{height}">
  <defs>
    <style>
      .term-text {{
        font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
        font-size: 13px;
        letter-spacing: -0.01em;
      }}
    </style>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.5"/>
    </filter>
  </defs>

  <!-- Background Window Card -->
  <rect x="8" y="8" width="{width - 16}" height="{height - 16}" rx="12" fill="#0B1329" stroke="#1E293B" stroke-width="1.5" filter="url(#shadow)"/>

  <!-- Window Header Bar -->
  <path d="M 8 20 A 12 12 0 0 1 20 8 L {width - 20} 8 A 12 12 0 0 1 {width - 8} 20 L {width - 8} 42 L 8 42 Z" fill="#111C3D"/>
  <line x1="8" y1="42" x2="{width - 8}" y2="42" stroke="#1E293B" stroke-width="1"/>

  <!-- Window Control Buttons -->
  <circle cx="28" cy="25" r="5.5" fill="#EF4444"/>
  <circle cx="46" cy="25" r="5.5" fill="#F59E0B"/>
  <circle cx="64" cy="25" r="5.5" fill="#10B981"/>

  <!-- Terminal Title -->
  <text x="{width / 2}" y="29" fill="#94A3B8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="500" text-anchor="middle">
    genome-studio — High-Performance Rust Sequence CLI
  </text>

  <!-- Terminal Body Content -->
  <g class="term-text">
    {"".join(text_elements)}
  </g>
</svg>"""

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(svg)

if __name__ == "__main__":
    generate_terminal_svg("docs/screenshots/cli-demo.svg")
    print("Generated docs/screenshots/cli-demo.svg")
