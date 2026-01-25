import { useEffect, useRef, useState, useCallback } from 'react';
import type { Person } from '../../types';
import type { DynamicPedigree, NodeRelationship } from '../../lib/dynamic-pedigree';
import { pedigreeToGraph, getRelationshipOptions, addRelationship } from '../../lib/dynamic-pedigree';
import './InteractiveGraph.css';

interface InteractiveGraphProps {
    pedigree: DynamicPedigree;
    onPedigreeChange: (pedigree: DynamicPedigree) => void;
    onPersonSexToggle?: (personId: string) => void;
}

interface NodePosition {
    x: number;
    y: number;
}

const NODE_RADIUS = 28;
const GENERATION_HEIGHT = 110;
const NODE_SPACING = 90;

export function InteractiveGraph({
    pedigree,
    onPedigreeChange,
    onPersonSexToggle,
}: InteractiveGraphProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Track selected pair for relationship definition
    const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);
    const [showRelationshipPanel, setShowRelationshipPanel] = useState(false);

    const graph = pedigreeToGraph(pedigree);

    // Calculate positions with merged nodes
    const calculatePositions = useCallback((): Map<string, NodePosition> => {
        const positions = new Map<string, NodePosition>();
        const generationGroups = new Map<number, Person[]>();

        // Group visible persons by generation
        graph.persons.forEach((person) => {
            const gen = person.generation;
            if (!generationGroups.has(gen)) {
                generationGroups.set(gen, []);
            }
            generationGroups.get(gen)!.push(person);
        });

        const canvasWidth = containerRef.current?.clientWidth || 700;
        const sortedGenerations = Array.from(generationGroups.keys()).sort((a, b) => a - b);

        sortedGenerations.forEach((gen) => {
            const persons = generationGroups.get(gen)!;
            const totalWidth = (persons.length - 1) * NODE_SPACING;
            const startX = (canvasWidth - totalWidth) / 2;
            const y = 70 + gen * GENERATION_HEIGHT;

            persons.forEach((person, index) => {
                positions.set(person.id, {
                    x: startX + index * NODE_SPACING,
                    y,
                });
            });
        });

        return positions;
    }, [graph]);

    // Draw the graph
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = container.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        ctx.scale(dpr, dpr);

        ctx.clearRect(0, 0, rect.width, rect.height);

        const positions = calculatePositions();
        const getStyle = (prop: string) =>
            getComputedStyle(document.documentElement).getPropertyValue(prop).trim();

        // Draw edges
        ctx.lineWidth = 2;
        graph.edges.forEach((edge) => {
            const parentPos = positions.get(edge.parentId);
            const childPos = positions.get(edge.childId);
            if (!parentPos || !childPos) return;

            ctx.strokeStyle = getStyle('--edge-muted');
            ctx.beginPath();
            ctx.moveTo(parentPos.x, parentPos.y + NODE_RADIUS);

            const midY = (parentPos.y + childPos.y) / 2;
            ctx.bezierCurveTo(
                parentPos.x, midY,
                childPos.x, midY,
                childPos.x, childPos.y - NODE_RADIUS
            );
            ctx.stroke();
        });

        // Draw consanguinity/relationship links
        graph.consanguinityLinks.forEach((link) => {
            const pos1 = positions.get(link.person1Id);
            const pos2 = positions.get(link.person2Id);
            if (!pos1 || !pos2) return;

            ctx.strokeStyle = getStyle('--accent-primary');
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(pos1.x + NODE_RADIUS, pos1.y);
            ctx.lineTo(pos2.x - NODE_RADIUS, pos2.y);
            ctx.stroke();
            ctx.setLineDash([]);
        });

        // Selection line between two selected nodes
        if (selectedNodes.length === 2) {
            const pos1 = positions.get(selectedNodes[0]);
            const pos2 = positions.get(selectedNodes[1]);
            if (pos1 && pos2) {
                ctx.strokeStyle = getStyle('--accent-secondary');
                ctx.lineWidth = 3;
                ctx.setLineDash([3, 3]);
                ctx.beginPath();
                ctx.moveTo(pos1.x, pos1.y);
                ctx.lineTo(pos2.x, pos2.y);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }

        // Draw nodes
        graph.persons.forEach((person) => {
            const pos = positions.get(person.id);
            if (!pos) return;

            const isTarget = pedigree.targetPair.includes(person.id);
            const isSelected = selectedNodes.includes(person.id);
            const isHovered = hoveredNode === person.id;

            // Glow effect
            if (isSelected || isTarget) {
                ctx.shadowColor = isSelected
                    ? getStyle('--accent-secondary')
                    : getStyle('--accent-glow');
                ctx.shadowBlur = isSelected ? 25 : 15;
            }

            // Node circle
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, NODE_RADIUS, 0, Math.PI * 2);

            if (isSelected) {
                ctx.fillStyle = getStyle('--accent-secondary');
            } else if (isTarget) {
                ctx.fillStyle = getStyle('--node-selected');
            } else if (isHovered) {
                ctx.fillStyle = getStyle('--bg-hover');
            } else {
                ctx.fillStyle = getStyle('--node-fill');
            }
            ctx.fill();

            // Border
            ctx.strokeStyle = isSelected
                ? getStyle('--accent-secondary')
                : isTarget
                    ? getStyle('--accent-primary')
                    : getStyle('--border');
            ctx.lineWidth = isSelected || isTarget ? 3 : 1.5;
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Sex indicator
            ctx.fillStyle = person.sex === 'M'
                ? getStyle('--node-male')
                : getStyle('--node-female');
            ctx.font = 'bold 16px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(person.sex === 'M' ? '♂' : '♀', pos.x, pos.y);

            // Label
            ctx.fillStyle = isTarget
                ? getStyle('--accent-secondary')
                : getStyle('--text-secondary');
            ctx.font = isTarget ? 'bold 11px Inter, sans-serif' : '11px Inter, sans-serif';
            ctx.fillText(person.label, pos.x, pos.y + NODE_RADIUS + 16);
        });
    }, [graph, pedigree.targetPair, selectedNodes, hoveredNode, calculatePositions]);

    // Handle canvas click for node selection
    const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const positions = calculatePositions();

        for (const [id, pos] of positions) {
            const dx = x - pos.x;
            const dy = y - pos.y;
            if (dx * dx + dy * dy <= NODE_RADIUS * NODE_RADIUS) {
                if (e.shiftKey && onPersonSexToggle) {
                    onPersonSexToggle(id);
                    return;
                }

                // Toggle selection
                setSelectedNodes(prev => {
                    if (prev.includes(id)) {
                        // Deselect
                        setShowRelationshipPanel(false);
                        return prev.filter(n => n !== id);
                    } else if (prev.length >= 2) {
                        // Replace first selection
                        return [prev[1], id];
                    } else {
                        // Add to selection
                        const newSelection = [...prev, id];
                        if (newSelection.length === 2) {
                            setShowRelationshipPanel(true);
                        }
                        return newSelection;
                    }
                });
                return;
            }
        }

        // Clicked on empty space - clear selection
        setSelectedNodes([]);
        setShowRelationshipPanel(false);
    };

    // Handle mouse move for hover effect
    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const positions = calculatePositions();

        for (const [id, pos] of positions) {
            const dx = x - pos.x;
            const dy = y - pos.y;
            if (dx * dx + dy * dy <= NODE_RADIUS * NODE_RADIUS) {
                setHoveredNode(id);
                canvas.style.cursor = 'pointer';
                return;
            }
        }
        setHoveredNode(null);
        canvas.style.cursor = 'default';
    };

    // Handle relationship selection
    const handleRelationshipSelect = (type: NodeRelationship['type']) => {
        if (selectedNodes.length !== 2) return;

        const newPedigree = addRelationship(
            pedigree,
            selectedNodes[0],
            selectedNodes[1],
            type
        );
        onPedigreeChange(newPedigree);
        setSelectedNodes([]);
        setShowRelationshipPanel(false);
    };

    useEffect(() => {
        draw();
        const handleResize = () => draw();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [draw]);

    const relationshipOptions = selectedNodes.length === 2
        ? getRelationshipOptions(pedigree, selectedNodes[0], selectedNodes[1])
        : [];

    const selectedPerson1 = selectedNodes[0] ? pedigree.persons.get(selectedNodes[0]) : null;
    const selectedPerson2 = selectedNodes[1] ? pedigree.persons.get(selectedNodes[1]) : null;

    return (
        <div className="interactive-graph" ref={containerRef}>
            <canvas
                ref={canvasRef}
                onClick={handleClick}
                onMouseMove={handleMouseMove}
                className="interactive-graph-canvas"
            />

            {/* Relationship definition panel */}
            {showRelationshipPanel && selectedNodes.length === 2 && (
                <div className="relationship-panel">
                    <div className="relationship-panel-header">
                        <span className="relationship-pair">
                            {selectedPerson1?.label} ↔ {selectedPerson2?.label}
                        </span>
                        <button
                            className="relationship-close"
                            onClick={() => {
                                setSelectedNodes([]);
                                setShowRelationshipPanel(false);
                            }}
                        >
                            ×
                        </button>
                    </div>
                    <div className="relationship-options">
                        {relationshipOptions.map(opt => (
                            <button
                                key={opt.value}
                                className="relationship-option"
                                onClick={() => handleRelationshipSelect(opt.value)}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="interactive-graph-hint">
                <span>Click two nodes to define their relationship</span>
                <span>·</span>
                <span>Shift+click to toggle sex</span>
            </div>
        </div>
    );
}
