"use client";

import { useEffect, useRef, useLayoutEffect, useState } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RelationshipGraphData, GraphNode, GraphLink } from '@/lib/types';
import { useTheme } from 'next-themes';
import { Search, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RelationshipGraphProps {
  data: RelationshipGraphData;
}

const relationshipColors = {
  support: "#3B82F6", // blue
  conflict: "#EF4444", // red
  neutral: "#000000", // black
};

// Distinct colors for each speaker node
const speakerColors = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#14B8A6", // Teal
  "#F97316", // Orange
  "#6366F1", // Indigo
  "#84CC16", // Lime
];

const getSpeakerColor = (group: number) => {
  const index = (group - 1) % speakerColors.length;
  return speakerColors[index];
};

export default function RelationshipGraph({ data }: RelationshipGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const { toast } = useToast();
  
  const [dimensions, setDimensions] = useState({ width: 0, height: 500 });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'support' | 'conflict' | 'neutral'>('all');
  const [selectedNodeDetails, setSelectedNodeDetails] = useState<GraphNode | null>(null);

  useLayoutEffect(() => {
    if (containerRef.current) {
        const resizeObserver = new ResizeObserver(entries => {
            if (!Array.isArray(entries) || !entries.length) return;
            const entry = entries[0];
            setDimensions({ width: entry.contentRect.width, height: 500 });
        });
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }
  }, []);

  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0) return;

    const { width, height } = dimensions;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const nodes: (GraphNode & d3.SimulationNodeDatum)[] = JSON.parse(JSON.stringify(data.nodes));
    
    // Ensure each node has a unique group number for different colors
    nodes.forEach((node, index) => {
      if (!node.group || node.group === 0) {
        node.group = index + 1;
      }
    });
    
    const allLinks: (GraphLink & d3.SimulationLinkDatum<GraphNode & d3.SimulationNodeDatum>)[] = JSON.parse(JSON.stringify(data.links));
    
    // Filter links based on type
    const links = filterType === 'all' 
      ? allLinks 
      : allLinks.filter(l => l.type === filterType);

    // Constrain nodes inside the box
    function constrainNode(node: any) {
      node.x = Math.max(40, Math.min(width - 40, node.x));
      node.y = Math.max(40, Math.min(height - 40, node.y));
    }

    const g = svg.append('g');

    // Set initial positions with more spacing
    nodes.forEach((node, i) => {
      const angle = (i / nodes.length) * 2 * Math.PI;
      const radius = Math.min(width, height) / 2.5;
      node.x = width / 2 + radius * Math.cos(angle);
      node.y = height / 2 + radius * Math.sin(angle);
    });

    svg.attr("viewBox", [0, 0, width, height]);

    const colorFor = (t: GraphLink['type']) => (relationshipColors as Record<GraphLink['type'], string>)[t];

    // Create arrow markers for both directions
    const defs = g.append('defs');
    ['support', 'conflict', 'neutral'].forEach(type => {
      // Forward arrow (end)
      defs.append('marker')
        .attr('id', `arrow-end-${type}`)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 8)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', relationshipColors[type as keyof typeof relationshipColors]);
      
      // Backward arrow (start)
      defs.append('marker')
        .attr('id', `arrow-start-${type}`)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 2)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M10,-5L0,0L10,5')
        .attr('fill', relationshipColors[type as keyof typeof relationshipColors]);
    });

    // Create link group
    const linkGroup = g.append("g")
      .attr("class", "links");

    const link = linkGroup
      .selectAll("path")
      .data(links)
      .join("path")
      .attr("stroke", (d: GraphLink & d3.SimulationLinkDatum<any>) => colorFor(d.type))
      .attr("stroke-width", d => Math.max(2, Math.sqrt(d.value) * 2))
      .attr("fill", "none")
      .attr("marker-start", (d: any) => `url(#arrow-start-${d.type})`)
      .attr("marker-end", (d: any) => `url(#arrow-end-${d.type})`)
      .attr("opacity", 0.6)
      .attr("class", "link-path");

    // Edge labels showing interaction count
    const linkLabels = g.append("g")
      .attr("class", "link-labels")
      .selectAll("text")
      .data(links)
      .join("text")
      .attr("font-size", "10px")
      .attr("fill", resolvedTheme === 'dark' ? '#fff' : '#000')
      .attr("text-anchor", "middle")
      .attr("dy", -5)
      .text((d: any) => d.value > 2 ? d.value : '');

    // Create simulation AFTER link elements are created
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(200))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(60))
      .on("tick", () => {
        nodes.forEach(constrainNode);
        
        // Update arrows (bidirectional - adjust for node radius on both ends)
        linkGroup.selectAll('path')
          .attr('d', (d: any) => {
            const sourceX = d.source.x;
            const sourceY = d.source.y;
            const targetX = d.target.x;
            const targetY = d.target.y;
            
            // Calculate angles and adjust for node radius on both ends
            const dx = targetX - sourceX;
            const dy = targetY - sourceY;
            const angle = Math.atan2(dy, dx);
            const nodeRadius = 20;
            
            // Start point (adjusted from source node edge)
            const startX = sourceX + Math.cos(angle) * nodeRadius;
            const startY = sourceY + Math.sin(angle) * nodeRadius;
            
            // End point (adjusted to target node edge)
            const endX = targetX - Math.cos(angle) * nodeRadius;
            const endY = targetY - Math.sin(angle) * nodeRadius;
            
            return `M${startX},${startY} L${endX},${endY}`;
          });
        
        // Update edge labels
        linkLabels
          .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
          .attr('y', (d: any) => (d.source.y + d.target.y) / 2);
        
        node.attr("transform", d => `translate(${d.x},${d.y})`);
      });

    const typeToLabel: Record<GraphLink['type'], string> = {
      support: 'Support: cooperative/agreeing',
      conflict: 'Conflict: disagreement/tension',
      neutral: 'Neutral: informational',
    };

    // Tooltip for edges
    d3.select(containerRef.current).selectAll('.relationship-tooltip').remove();
    
    const tooltip = d3.select(containerRef.current)
      .append('div')
      .attr('class', 'relationship-tooltip')
      .style('position', 'absolute')
      .style('pointer-events', 'none')
      .style('background', resolvedTheme === 'dark' ? '#0b1220' : '#ffffff')
      .style('border', '1px solid var(--border)')
      .style('border-radius', '8px')
      .style('padding', '8px 12px')
      .style('font-size', '12px')
      .style('color', 'var(--foreground)')
      .style('box-shadow', '0 4px 12px rgba(0,0,0,0.2)')
      .style('display', 'none')
      .style('z-index', '1000')
      .style('max-width', '250px');

    const describe = (d: any) => {
      const label = typeToLabel[(d as GraphLink).type];
      const s = typeof d.avgSentiment === 'number' ? d.avgSentiment : 0;
      const sentiment = s > 0.2 ? 'positive' : s < -0.2 ? 'negative' : 'neutral';
      const sourceId = typeof d.source === 'object' ? d.source.id : d.source;
      const targetId = typeof d.target === 'object' ? d.target.id : d.target;
      
      let details = `<strong>${label}</strong><br/>`;
      details += `Interactions: ${d.value}<br/>`;
      details += `Sentiment: ${sentiment} (${s.toFixed(2)})<br/>`;
      
      if (d.initiator) {
        details += `Initiator: ${d.initiator}<br/>`;
      }
      
      if (d.timestamps && d.timestamps.length > 0) {
        details += `Times: ${d.timestamps.slice(0, 3).join(', ')}${d.timestamps.length > 3 ? '...' : ''}`;
      }
      
      if (d.topics && d.topics.length > 0) {
        details += `<br/>Topics: ${d.topics.slice(0, 2).join(', ')}${d.topics.length > 2 ? '...' : ''}`;
      }
      
      return details;
    };

    (link as any)
      .on('mousemove', function (event: MouseEvent, d: any) {
        tooltip
          .style('left', `${event.offsetX + 12}px`)
          .style('top', `${event.offsetY + 12}px`)
          .style('display', 'block')
          .html(describe(d));
      })
      .on('mouseleave', function () {
        tooltip.style('display', 'none');
      });

    const node = g.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("class", "node-group")
      .call(drag(simulation) as any)
      .on('click', function(event, d) {
        event.stopPropagation();
        handleNodeClick(d.id);
      });

    // Calculate node size based on connections
    const getNodeSize = (nodeId: string) => {
      const connectionCount = links.filter(l => {
        const sourceId = typeof l.source === 'object' ? (l.source as any).id : l.source;
        const targetId = typeof l.target === 'object' ? (l.target as any).id : l.target;
        return sourceId === nodeId || targetId === nodeId;
      }).length;
      return 15 + Math.min(connectionCount * 2, 15);
    };

    node.append("circle")
      .attr("r", d => getNodeSize(d.id))
      .attr("fill", (d) => getSpeakerColor(d.group))
      .attr("stroke", resolvedTheme === 'dark' ? "#1a2a28" : "#fff")
      .attr("stroke-width", 3)
      .attr("class", "node-circle")
      .style("cursor", "pointer");

    node.append("text")
      .attr("x", d => getNodeSize(d.id) + 5)
      .attr("y", "0.31em")
      .text(d => d.label)
      .attr("fill", "currentColor")
      .attr("font-size", "13px")
      .attr("font-weight", "600")
      .style("pointer-events", "none");
    
    node.append("title")
      .text(d => {
        const connections = links.filter(l => {
          const sourceId = typeof l.source === 'object' ? (l.source as any).id : l.source;
          const targetId = typeof l.target === 'object' ? (l.target as any).id : l.target;
          return sourceId === d.id || targetId === d.id;
        }).length;
        return `${d.label}\nConnections: ${connections}`;
      });

    // Handle node highlighting
    function handleNodeClick(nodeId: string | null) {
      if (!nodeId || selectedNode === nodeId) {
        setSelectedNode(null);
        setSelectedNodeDetails(null);
        // Reset all - make everything visible
        node.style('display', 'block');
        node.selectAll('.node-circle').attr('opacity', 1);
        node.selectAll('text').attr('opacity', 1);
        link.style('display', 'block').attr('opacity', 0.6);
        linkLabels.style('display', 'block').attr('opacity', 1);
      } else {
        setSelectedNode(nodeId);
        const nodeData = nodes.find(n => n.id === nodeId);
        setSelectedNodeDetails(nodeData || null);
        
        // Find connected nodes
        const connectedNodeIds = new Set<string>();
        connectedNodeIds.add(nodeId); // Add the selected node itself
        
        links.forEach(l => {
          const sourceId = typeof l.source === 'object' ? (l.source as any).id : l.source;
          const targetId = typeof l.target === 'object' ? (l.target as any).id : l.target;
          
          if (sourceId === nodeId || targetId === nodeId) {
            connectedNodeIds.add(sourceId);
            connectedNodeIds.add(targetId);
          }
        });
        
        // Hide all nodes and links first
        node.style('display', (d: any) => connectedNodeIds.has(d.id) ? 'block' : 'none');
        
        // Show only connected links
        link.style('display', (d: any) => {
          const sourceId = typeof d.source === 'object' ? d.source.id : d.source;
          const targetId = typeof d.target === 'object' ? d.target.id : d.target;
          return (sourceId === nodeId || targetId === nodeId) ? 'block' : 'none';
        }).attr('opacity', 0.8);
        
        linkLabels.style('display', (d: any) => {
          const sourceId = typeof d.source === 'object' ? d.source.id : d.source;
          const targetId = typeof d.target === 'object' ? d.target.id : d.target;
          return (sourceId === nodeId || targetId === nodeId) ? 'block' : 'none';
        }).attr('opacity', 1);
        
        // Highlight selected node
        node.filter((d: any) => d.id === nodeId)
          .selectAll('.node-circle')
          .attr('opacity', 1);
        
        node.filter((d: any) => d.id !== nodeId && connectedNodeIds.has(d.id))
          .selectAll('.node-circle')
          .attr('opacity', 0.7);
      }
    }

    // Search functionality - only trigger if searchTerm changed
    if (searchTerm && searchTerm !== selectedNode) {
      const matchingNode = nodes.find(n => 
        n.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      if (matchingNode && matchingNode.id !== selectedNode) {
        handleNodeClick(matchingNode.id);
      } else if (!matchingNode) {
        // Show toast if speaker not found
        toast({
          title: "Speaker Not Found",
          description: `No speaker matching "${searchTerm}" was found in the graph.`,
          variant: "destructive",
        });
        setSearchTerm('');
      }
    }

    // Click on background to deselect
    svg.on('click', () => {
      setSelectedNode(null);
      setSelectedNodeDetails(null);
      node.selectAll('.node-circle').attr('opacity', 1);
      link.attr('opacity', 0.6);
      linkLabels.attr('opacity', 1);
    });

    function drag(simulation: d3.Simulation<any, any>) {
      function dragstarted(event: d3.D3DragEvent<any, any, any>) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }
      function dragged(event: d3.D3DragEvent<any, any, any>) {
        const newX = Math.max(40, Math.min(width - 40, event.x));
        const newY = Math.max(40, Math.min(height - 40, event.y));
        event.subject.fx = newX;
        event.subject.fy = newY;
      }
      function dragended(event: d3.D3DragEvent<any, any, any>) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }
      return d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended);
    }

  }, [data, dimensions, resolvedTheme, searchTerm, filterType]);

  return (
    <Card className="shadow-md">
      <CardHeader>
        <div>
          <CardTitle>Interactive Relationship Graph</CardTitle>
          <CardDescription>Click nodes to highlight connections • Drag to reposition</CardDescription>
        </div>
        
        {/* Controls */}
        <div className="flex gap-3 mt-4 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search speaker..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedNode(null);
                  setSelectedNodeDetails(null);
                }}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
          
          {/* Filter */}
          <div className="flex gap-2">
            <Button
              variant={filterType === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('all')}
            >
              All
            </Button>
            <Button
              variant={filterType === 'support' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('support')}
              className={filterType === 'support' ? 'bg-blue-600 hover:bg-blue-700' : ''}
            >
              Support
            </Button>
            <Button
              variant={filterType === 'conflict' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('conflict')}
              className={filterType === 'conflict' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              Conflict
            </Button>
            <Button
              variant={filterType === 'neutral' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('neutral')}
            >
              Neutral
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent ref={containerRef} className="w-full h-[520px] relative">
        {/* Legend */}
        <div className="absolute left-4 top-4 z-10 bg-background/90 backdrop-blur border rounded-lg p-3 text-xs space-y-2">
          <div className="font-semibold mb-2">Legend</div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5" style={{background: relationshipColors.support}}></div>
            <span>Support</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5" style={{background: relationshipColors.conflict}}></div>
            <span>Conflict</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5" style={{background: relationshipColors.neutral}}></div>
            <span>Neutral</span>
          </div>
          <div className="pt-2 border-t text-muted-foreground">
            <div>• Node size = connections</div>
            <div>• Line thickness = strength</div>
            <div>• Arrows show direction</div>
          </div>
        </div>

        {/* Node Details Panel */}
        {selectedNodeDetails && (
          <div className="absolute right-4 top-4 z-10 bg-background/95 backdrop-blur border rounded-lg p-4 text-sm w-64 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-base">{selectedNodeDetails.label}</h4>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => {
                  setSelectedNode(null);
                  setSelectedNodeDetails(null);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2 text-muted-foreground">
              <div>
                <span className="font-medium">ID:</span> {selectedNodeDetails.id}
              </div>
              <div>
                <span className="font-medium">Connections:</span>{' '}
                {data.links.filter(l => l.source === selectedNodeDetails.id || l.target === selectedNodeDetails.id).length}
              </div>
              <div>
                <span className="font-medium">Group:</span> {selectedNodeDetails.group}
              </div>
            </div>
          </div>
        )}

        <svg ref={svgRef} className="w-full h-full"></svg>
      </CardContent>
    </Card>
  );
}
