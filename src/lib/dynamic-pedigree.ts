import type { Person, FamilyGraph, RelationshipType, Sex, ConsanguinityLink, ParentChildEdge } from '../types';

/**
 * Represents a defined relationship between two nodes
 */
export interface NodeRelationship {
    person1Id: string;
    person2Id: string;
    type: 'siblings' | 'half-siblings' | 'spouse' | 'first-cousins' | 'second-cousins' | 'unrelated';
}

/**
 * Dynamic pedigree state that can be modified by the user
 */
export interface DynamicPedigree {
    /** All persons in the pedigree */
    persons: Map<string, Person>;
    /** Parent-child relationships */
    edges: ParentChildEdge[];
    /** User-defined relationships between pairs */
    definedRelationships: NodeRelationship[];
    /** The two target individuals being compared */
    targetPair: [string, string];
    /** Node merges (nodeId -> mergedIntoId) */
    merges: Map<string, string>;
}

/**
 * Generate initial pedigree nodes for a base relationship type
 * Creates all nodes without any consanguinity - pure baseline
 */
export function generateBasePedigree(
    baseRelationship: RelationshipType,
    person1Sex: Sex = 'M',
    person2Sex: Sex = 'F'
): DynamicPedigree {
    const persons = new Map<string, Person>();
    const edges: ParentChildEdge[] = [];

    const addPerson = (id: string, label: string, sex: Sex, generation: number) => {
        persons.set(id, { id, label, sex, generation });
    };

    const addEdge = (parentId: string, childId: string) => {
        edges.push({ parentId, childId });
    };

    let targetPair: [string, string] = ['p1', 'p2'];

    switch (baseRelationship) {
        case 'siblings':
        case 'half-siblings':
            // 2 targets, 2 parents, 4 grandparents
            addPerson('p1', 'Sibling A', person1Sex, 2);
            addPerson('p2', 'Sibling B', person2Sex, 2);
            addPerson('father', 'Father', 'M', 1);
            addPerson('mother', 'Mother', 'F', 1);
            addPerson('gf1', 'Grandfather 1', 'M', 0);
            addPerson('gm1', 'Grandmother 1', 'F', 0);
            addPerson('gf2', 'Grandfather 2', 'M', 0);
            addPerson('gm2', 'Grandmother 2', 'F', 0);

            addEdge('father', 'p1');
            addEdge('mother', 'p1');
            addEdge('father', 'p2');
            addEdge('mother', 'p2');
            addEdge('gf1', 'father');
            addEdge('gm1', 'father');
            addEdge('gf2', 'mother');
            addEdge('gm2', 'mother');
            break;

        case 'first-cousins':
            // 2 targets, 4 parents, 6 grandparents (2 shared)
            addPerson('p1', 'Cousin A', person1Sex, 2);
            addPerson('p2', 'Cousin B', person2Sex, 2);
            addPerson('father1', 'Parent A1', 'M', 1);
            addPerson('mother1', 'Parent A2', 'F', 1);
            addPerson('father2', 'Parent B1', 'M', 1);
            addPerson('mother2', 'Parent B2', 'F', 1);
            // Shared grandparents (parents are siblings)
            addPerson('gf-shared', 'Shared Grandfather', 'M', 0);
            addPerson('gm-shared', 'Shared Grandmother', 'F', 0);
            // Non-shared grandparents
            addPerson('gf-a', 'Grandfather A', 'M', 0);
            addPerson('gm-a', 'Grandmother A', 'F', 0);
            addPerson('gf-b', 'Grandfather B', 'M', 0);
            addPerson('gm-b', 'Grandmother B', 'F', 0);

            addEdge('father1', 'p1');
            addEdge('mother1', 'p1');
            addEdge('father2', 'p2');
            addEdge('mother2', 'p2');
            addEdge('gf-shared', 'father1');
            addEdge('gm-shared', 'father1');
            addEdge('gf-shared', 'father2');
            addEdge('gm-shared', 'father2');
            addEdge('gf-a', 'mother1');
            addEdge('gm-a', 'mother1');
            addEdge('gf-b', 'mother2');
            addEdge('gm-b', 'mother2');
            break;

        case 'double-first-cousins':
            // Both sets of parents are siblings
            addPerson('p1', 'Cousin A', person1Sex, 2);
            addPerson('p2', 'Cousin B', person2Sex, 2);
            addPerson('father1', 'Father A', 'M', 1);
            addPerson('mother1', 'Mother A', 'F', 1);
            addPerson('father2', 'Father B', 'M', 1);
            addPerson('mother2', 'Mother B', 'F', 1);
            // All grandparents are shared
            addPerson('gf1', 'Grandfather 1', 'M', 0);
            addPerson('gm1', 'Grandmother 1', 'F', 0);
            addPerson('gf2', 'Grandfather 2', 'M', 0);
            addPerson('gm2', 'Grandmother 2', 'F', 0);

            addEdge('father1', 'p1');
            addEdge('mother1', 'p1');
            addEdge('father2', 'p2');
            addEdge('mother2', 'p2');
            addEdge('gf1', 'father1');
            addEdge('gm1', 'father1');
            addEdge('gf1', 'father2');
            addEdge('gm1', 'father2');
            addEdge('gf2', 'mother1');
            addEdge('gm2', 'mother1');
            addEdge('gf2', 'mother2');
            addEdge('gm2', 'mother2');
            break;

        case 'avuncular':
            // Uncle/aunt and nephew/niece
            addPerson('p1', 'Uncle/Aunt', person1Sex, 1);
            addPerson('p2', 'Nephew/Niece', person2Sex, 2);
            addPerson('sibling', 'Parent', person1Sex === 'M' ? 'F' : 'M', 1);
            addPerson('spouse', 'Spouse', person1Sex === 'M' ? 'F' : 'M', 1);
            addPerson('gf', 'Grandfather', 'M', 0);
            addPerson('gm', 'Grandmother', 'F', 0);
            addPerson('gf-spouse', 'Grandfather (in-law)', 'M', 0);
            addPerson('gm-spouse', 'Grandmother (in-law)', 'F', 0);

            addEdge('sibling', 'p2');
            addEdge('spouse', 'p2');
            addEdge('gf', 'p1');
            addEdge('gm', 'p1');
            addEdge('gf', 'sibling');
            addEdge('gm', 'sibling');
            addEdge('gf-spouse', 'spouse');
            addEdge('gm-spouse', 'spouse');
            break;

        case 'second-cousins':
            // Share great-grandparents
            addPerson('p1', 'Cousin A', person1Sex, 3);
            addPerson('p2', 'Cousin B', person2Sex, 3);
            addPerson('parent1', 'Parent A', 'M', 2);
            addPerson('parent2', 'Parent B', 'M', 2);
            addPerson('gp1', 'Grandparent A', 'M', 1);
            addPerson('gp2', 'Grandparent B', 'M', 1);
            addPerson('ggp-shared', 'Shared Great-GP', 'M', 0);

            addEdge('parent1', 'p1');
            addEdge('parent2', 'p2');
            addEdge('gp1', 'parent1');
            addEdge('gp2', 'parent2');
            addEdge('ggp-shared', 'gp1');
            addEdge('ggp-shared', 'gp2');
            break;

        default:
            // Default to siblings
            addPerson('p1', 'Person A', person1Sex, 2);
            addPerson('p2', 'Person B', person2Sex, 2);
            addPerson('father', 'Father', 'M', 1);
            addPerson('mother', 'Mother', 'F', 1);
            addEdge('father', 'p1');
            addEdge('mother', 'p1');
            addEdge('father', 'p2');
            addEdge('mother', 'p2');
    }

    return {
        persons,
        edges,
        definedRelationships: [],
        targetPair,
        merges: new Map(),
    };
}

/**
 * Calculate inbreeding coefficient from the dynamic pedigree
 * Uses path-counting through the actual graph structure
 */
export function calculateFromPedigree(pedigree: DynamicPedigree): {
    coefficientOfRelationship: number;
    inbreedingCoefficient: number;
    contributingPaths: string[][];
} {
    const [id1, id2] = pedigree.targetPair;

    // Find all paths from id1 to id2 through common ancestors
    const paths = findAllPaths(id1, id2, pedigree);

    let r = 0;
    for (const path of paths) {
        // r = sum of (0.5)^n for each path through a common ancestor
        // n = number of steps in the path
        const contribution = Math.pow(0.5, path.length - 1);
        r += contribution;
    }

    return {
        coefficientOfRelationship: Math.min(r, 1), // Cap at 1
        inbreedingCoefficient: r / 2,
        contributingPaths: paths,
    };
}

/**
 * Find all paths between two individuals through common ancestors
 */
function findAllPaths(id1: string, id2: string, pedigree: DynamicPedigree): string[][] {
    // Build adjacency for going upward (child -> parents)
    const parentOf = new Map<string, string[]>();

    for (const edge of pedigree.edges) {
        const resolved = resolveId(edge.childId, pedigree.merges);
        if (!parentOf.has(resolved)) {
            parentOf.set(resolved, []);
        }
        parentOf.get(resolved)!.push(resolveId(edge.parentId, pedigree.merges));
    }

    // DFS to find all ancestors of each person
    const getAncestors = (id: string): Map<string, number> => {
        const ancestors = new Map<string, number>();
        const visited = new Set<string>();

        const dfs = (current: string, depth: number) => {
            if (visited.has(current)) return;
            visited.add(current);

            const parents = parentOf.get(current) || [];
            for (const parent of parents) {
                if (!ancestors.has(parent) || ancestors.get(parent)! > depth + 1) {
                    ancestors.set(parent, depth + 1);
                }
                dfs(parent, depth + 1);
            }
        };

        dfs(resolveId(id, pedigree.merges), 0);
        return ancestors;
    };

    const ancestors1 = getAncestors(id1);
    const ancestors2 = getAncestors(id2);

    // Find common ancestors
    const commonAncestors: string[] = [];
    for (const [ancestorId] of ancestors1) {
        if (ancestors2.has(ancestorId)) {
            commonAncestors.push(ancestorId);
        }
    }

    // For each common ancestor, create path
    const paths: string[][] = [];
    for (const ancestor of commonAncestors) {
        const depth1 = ancestors1.get(ancestor)!;
        const depth2 = ancestors2.get(ancestor)!;
        // Simple path representation: just track the length
        const pathLength = depth1 + depth2 + 1;
        paths.push(new Array(pathLength).fill(ancestor));
    }

    return paths;
}

/**
 * Resolve an ID through the merge map
 */
function resolveId(id: string, merges: Map<string, string>): string {
    let resolved = id;
    while (merges.has(resolved)) {
        resolved = merges.get(resolved)!;
    }
    return resolved;
}

/**
 * Add a relationship between two nodes and update the pedigree accordingly
 */
export function addRelationship(
    pedigree: DynamicPedigree,
    person1Id: string,
    person2Id: string,
    relationshipType: NodeRelationship['type']
): DynamicPedigree {
    const newPedigree = { ...pedigree };
    newPedigree.definedRelationships = [
        ...pedigree.definedRelationships,
        { person1Id, person2Id, type: relationshipType }
    ];

    // Handle merging of ancestors for sibling relationships
    if (relationshipType === 'siblings') {
        // If two people are siblings, they share both parents
        // Merge their parent nodes
        newPedigree.merges = new Map(pedigree.merges);

        // Find parents of each person
        const parents1 = pedigree.edges
            .filter(e => e.childId === person1Id)
            .map(e => e.parentId);
        const parents2 = pedigree.edges
            .filter(e => e.childId === person2Id)
            .map(e => e.parentId);

        // Merge parents by sex
        const father1 = parents1.find(p => pedigree.persons.get(p)?.sex === 'M');
        const father2 = parents2.find(p => pedigree.persons.get(p)?.sex === 'M');
        const mother1 = parents1.find(p => pedigree.persons.get(p)?.sex === 'F');
        const mother2 = parents2.find(p => pedigree.persons.get(p)?.sex === 'F');

        if (father1 && father2 && father1 !== father2) {
            newPedigree.merges.set(father2, father1);
        }
        if (mother1 && mother2 && mother1 !== mother2) {
            newPedigree.merges.set(mother2, mother1);
        }
    }

    if (relationshipType === 'half-siblings') {
        // Share one parent (default to father)
        newPedigree.merges = new Map(pedigree.merges);

        const parents1 = pedigree.edges
            .filter(e => e.childId === person1Id)
            .map(e => e.parentId);
        const parents2 = pedigree.edges
            .filter(e => e.childId === person2Id)
            .map(e => e.parentId);

        const father1 = parents1.find(p => pedigree.persons.get(p)?.sex === 'M');
        const father2 = parents2.find(p => pedigree.persons.get(p)?.sex === 'M');

        if (father1 && father2 && father1 !== father2) {
            newPedigree.merges.set(father2, father1);
        }
    }

    return newPedigree;
}

/**
 * Convert dynamic pedigree to FamilyGraph for visualization
 */
export function pedigreeToGraph(pedigree: DynamicPedigree): FamilyGraph {
    const persons = new Map<string, Person>();
    const edges: ParentChildEdge[] = [];
    const consanguinityLinks: ConsanguinityLink[] = [];

    // Add non-merged persons
    for (const [id, person] of pedigree.persons) {
        if (!pedigree.merges.has(id)) {
            persons.set(id, person);
        }
    }

    // Add edges with resolved IDs
    for (const edge of pedigree.edges) {
        const parentId = resolveId(edge.parentId, pedigree.merges);
        const childId = resolveId(edge.childId, pedigree.merges);

        // Avoid duplicate edges
        const exists = edges.some(e => e.parentId === parentId && e.childId === childId);
        if (!exists) {
            edges.push({ parentId, childId });
        }
    }

    // Add consanguinity links for defined relationships
    for (const rel of pedigree.definedRelationships) {
        const id1 = resolveId(rel.person1Id, pedigree.merges);
        const id2 = resolveId(rel.person2Id, pedigree.merges);

        if (rel.type !== 'unrelated' && rel.type !== 'spouse') {
            consanguinityLinks.push({
                person1Id: id1,
                person2Id: id2,
                relationship: rel.type === 'first-cousins' ? 'first-cousins' :
                    rel.type === 'second-cousins' ? 'second-cousins' :
                        rel.type === 'half-siblings' ? 'half-siblings' : 'siblings',
            });
        }
    }

    return { persons, edges, consanguinityLinks };
}

/**
 * Get available relationship options for a selected pair
 */
export function getRelationshipOptions(
    pedigree: DynamicPedigree,
    person1Id: string,
    person2Id: string
): { value: NodeRelationship['type']; label: string }[] {
    const p1 = pedigree.persons.get(person1Id);
    const p2 = pedigree.persons.get(person2Id);

    if (!p1 || !p2) return [];

    // Same generation = potential siblings/cousins
    if (p1.generation === p2.generation) {
        return [
            { value: 'unrelated', label: 'Unrelated' },
            { value: 'siblings', label: 'Siblings (same parents)' },
            { value: 'half-siblings', label: 'Half-Siblings (one shared parent)' },
            { value: 'first-cousins', label: '1st Cousins' },
            { value: 'second-cousins', label: '2nd Cousins' },
        ];
    }

    // Different generation - could be parent-child, aunt/uncle
    return [
        { value: 'unrelated', label: 'Unrelated' },
    ];
}
