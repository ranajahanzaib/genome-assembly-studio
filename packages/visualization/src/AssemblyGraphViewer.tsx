"use client";

import * as d3 from "d3";
import React, { useEffect, useRef, useState } from "react";

export interface GfaNode {
  id: string;
  length: number;
  sequence_preview?: string;
  coverage?: number;
  gc_percent?: number;
}

export interface GfaEdge {
  from_node: string;
  from_orientation: string;
  to_node: string;
  to_orientation: string;
  overlap: string;
}

export interface AssemblyGraphViewerProps {
  nodes: GfaNode[];
  edges: GfaEdge[];
  onSelectNode?: (node: GfaNode | null) => void;
  width?: number;
  height?: number;
}

export const AssemblyGraphViewer: React.FC<AssemblyGraphViewerProps> = ({
  nodes,
  edges,
  onSelectNode,
  width = 720,
  height = 480,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g");

    // Add zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 8])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Create D3 simulation data structures
    const simNodes = nodes.map((d) => ({
      id: d.id,
      length: d.length,
      coverage: d.coverage || 30.0,
      raw: d,
    }));

    const nodeById = new Map(simNodes.map((d) => [d.id, d]));

    const simLinks = edges
      .filter((e) => nodeById.has(e.from_node) && nodeById.has(e.to_node))
      .map((e) => ({
        source: nodeById.get(e.from_node)!,
        target: nodeById.get(e.to_node)!,
        raw: e,
      }));

    // Force simulation
    const simulation = d3
      .forceSimulation(simNodes as any)
      .force(
        "link",
        d3
          .forceLink(simLinks as any)
          .distance(110)
          .strength(0.8),
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(45));

    // Coverage color scale
    const colorScale = d3
      .scaleSequential()
      .domain([10, 60])
      .interpolator(d3.interpolateTurbo);

    // Render edges
    const link = g
      .append("g")
      .attr("stroke", "#94A3B8")
      .attr("stroke-opacity", 0.7)
      .selectAll("line")
      .data(simLinks)
      .join("line")
      .attr("stroke-width", 2);

    // Render nodes as rounded pills/capsules
    const node = g
      .append("g")
      .selectAll("g")
      .data(simNodes)
      .join("g")
      .attr("cursor", "pointer")
      .call(
        d3
          .drag<any, any>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }),
      );

    node
      .append("rect")
      .attr("x", (d) => {
        const textW = d.id.length * 7.5 + 20;
        const pillW = Math.max(textW, Math.min(140, d.length / 10));
        return -pillW / 2;
      })
      .attr("y", -14)
      .attr("width", (d) => {
        const textW = d.id.length * 7.5 + 20;
        return Math.max(textW, Math.min(140, d.length / 10));
      })
      .attr("height", 28)
      .attr("rx", 14)
      .attr("fill", (d) =>
        d.coverage > 50 ? "#DC2626" : d.coverage < 20 ? "#F59E0B" : "#0D9488",
      )
      .attr("stroke", (d) => (selectedNodeId === d.id ? "#1E293B" : "#FFFFFF"))
      .attr("stroke-width", (d) => (selectedNodeId === d.id ? 3 : 1.5))
      .on("click", (event, d) => {
        setSelectedNodeId(d.id);
        onSelectNode?.(d.raw);
      });

    node
      .append("text")
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle")
      .attr("fill", "#FFFFFF")
      .attr("font-size", "10px")
      .attr("font-family", "monospace")
      .attr("font-weight", "600")
      .attr("pointer-events", "none")
      .text((d) => d.id);

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [nodes, edges, selectedNodeId, width, height]);

  return (
    <div className="relative border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-900">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="w-full h-auto"
      />
      <div className="absolute top-3 left-3 bg-slate-800/80 backdrop-blur-xs text-white text-xs px-2.5 py-1.5 rounded border border-slate-700 flex items-center gap-3">
        <span>Nodes: {nodes.length}</span>
        <span>Edges: {edges.length}</span>
        <div className="flex items-center gap-1.5 ml-2">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
          <span>Normal (~30x)</span>
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ml-1.5"></span>
          <span>Low (&lt;20x)</span>
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 ml-1.5"></span>
          <span>Repeat (50x+)</span>
        </div>
      </div>
    </div>
  );
};
