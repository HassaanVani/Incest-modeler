import { useEffect, useRef } from 'react';
import type { FamilyGraph, Person } from '../../types';
import './FamilyGraph.css';

interface FamilyGraphProps {
    graph: FamilyGraph;
    selectedPair: [string, string];
    highlightedPath?: string[];
    onPersonClick?: (personId: string) => void;
    onPersonSexToggle?: (personId: string) => void;
}

interface NodePosition {
    x: number;
    y: number;
}

const NODE_RADIUS = 24;
const GENERATION_HEIGHT = 100;
const NODE_SPACING = 80;

export function FamilyGraph({
    graph,
    selectedPair,
    highlightedPath = [],
    onPersonClick,
    onPersonSexToggle,
}: FamilyGraphProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Calculate node positions based on generation
    const calculatePositions = (): Map<string, NodePosition> => {
        const positions = new Map<string, NodePosition>();
        const generationGroups = new Map<number, Person[]>();

        // Group by generation
        graph.persons.forEach((person) => {
            const gen = person.generation;
            if (!generationGroups.has(gen)) {
                generationGroups.set(gen, []);
            }
            generationGroups.get(gen)!.push(person);
        });

        // Calculate positions for each generation
        const sortedGenerations = Array.from(generationGroups.keys()).sort((a, b) => a - b);
        const canvasWidth = containerRef.current?.clientWidth || 600;

        sortedGenerations.forEach((gen) => {
            const persons = generationGroups.get(gen)!;
            const totalWidth = (persons.length - 1) * NODE_SPACING;
            const startX = (canvasWidth - totalWidth) / 2;
            const y = 60 + gen * GENERATION_HEIGHT;

            persons.forEach((person, index) => {
                positions.set(person.id, {
                    x: startX + index * NODE_SPACING,
                    y,
                });
            });
        });

        return positions;
    };

    // Draw the graph
    const draw = () => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        const dpr = window.devicePixelRatio || 1;
        const rect = container.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        ctx.scale(dpr, dpr);

        // Clear canvas
        ctx.clearRect(0, 0, rect.width, rect.height);

        const positions = calculatePositions();

        // Draw edges first (behind nodes)
        ctx.lineWidth = 2;
        graph.edges.forEach((edge) => {
            const parentPos = positions.get(edge.parentId);
            const childPos = positions.get(edge.childId);
            if (!parentPos || !childPos) return;

            const isHighlighted = highlightedPath.includes(edge.parentId) &&
                highlightedPath.includes(edge.childId);

            ctx.strokeStyle = isHighlighted
                ? getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim()
                : getComputedStyle(document.documentElement).getPropertyValue('--edge-muted').trim();

            ctx.beginPath();
            ctx.moveTo(parentPos.x, parentPos.y + NODE_RADIUS);

            // Curved line
            const midY = (parentPos.y + childPos.y) / 2;
            ctx.bezierCurveTo(
                parentPos.x, midY,
                childPos.x, midY,
                childPos.x, childPos.y - NODE_RADIUS
            );
            ctx.stroke();
        });

        // Draw consanguinity links (dashed)
        graph.consanguinityLinks.forEach((link) => {
            const pos1 = positions.get(link.person1Id);
            const pos2 = positions.get(link.person2Id);
            if (!pos1 || !pos2) return;

            ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim();
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(pos1.x, pos1.y);
            ctx.lineTo(pos2.x, pos2.y);
            ctx.stroke();
            ctx.setLineDash([]);
        });

        // Draw nodes
        graph.persons.forEach((person) => {
            const pos = positions.get(person.id);
            if (!pos) return;

            const isSelected = selectedPair.includes(person.id);
            const isHighlighted = highlightedPath.includes(person.id);

            // Node glow for selected
            if (isSelected) {
                ctx.shadowColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-glow').trim();
                ctx.shadowBlur = 20;
            }

            // Node fill
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, NODE_RADIUS, 0, Math.PI * 2);

            if (isSelected) {
                ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--node-selected').trim();
            } else if (isHighlighted) {
                ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent-muted').trim();
            } else {
                ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--node-fill').trim();
            }
            ctx.fill();

            // Node border
            ctx.strokeStyle = isSelected
                ? getComputedStyle(document.documentElement).getPropertyValue('--accent-secondary').trim()
                : getComputedStyle(document.documentElement).getPropertyValue('--border').trim();
            ctx.lineWidth = isSelected ? 2 : 1;
            ctx.stroke();

            ctx.shadowBlur = 0;

            // Sex indicator
            ctx.fillStyle = person.sex === 'M'
                ? getComputedStyle(document.documentElement).getPropertyValue('--node-male').trim()
                : getComputedStyle(document.documentElement).getPropertyValue('--node-female').trim();
            ctx.font = '14px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(person.sex === 'M' ? '♂' : '♀', pos.x, pos.y);

            // Label below node
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim();
            ctx.font = '11px Inter, sans-serif';
            ctx.fillText(person.label, pos.x, pos.y + NODE_RADIUS + 14);
        });
    };

    // Handle click on canvas
    const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const positions = calculatePositions();

        // Check if click is on a node
        for (const [id, pos] of positions) {
            const dx = x - pos.x;
            const dy = y - pos.y;
            if (dx * dx + dy * dy <= NODE_RADIUS * NODE_RADIUS) {
                if (e.shiftKey && onPersonSexToggle) {
                    onPersonSexToggle(id);
                } else if (onPersonClick) {
                    onPersonClick(id);
                }
                return;
            }
        }
    };

    useEffect(() => {
        draw();

        const handleResize = () => draw();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [graph, selectedPair, highlightedPath]);

    return (
        <div className="family-graph" ref={containerRef}>
            <canvas
                ref={canvasRef}
                onClick={handleClick}
                className="family-graph-canvas"
            />
            <div className="family-graph-hint">
                <span>Click node to select</span>
                <span>·</span>
                <span>Shift+click to toggle sex</span>
            </div>
        </div>
    );
}
