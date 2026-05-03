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

    const targetPair: [string, string] = ['p1', 'p2'];

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

type InbreedingCache = Map<string, number>;

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
    const cache: InbreedingCache = new Map();

    const result = calculateRAndPaths(resolveId(id1, pedigree.merges), resolveId(id2, pedigree.merges), pedigree, cache);

    return {
        coefficientOfRelationship: Math.min(result.r, 1), // Cap at 1
        inbreedingCoefficient: result.r / 2,
        contributingPaths: result.paths,
    };
}

function calculateRAndPaths(id1: string, id2: string, pedigree: DynamicPedigree, cache: InbreedingCache): { r: number, paths: string[][] } {
    const validPaths = findAllPaths(id1, id2, pedigree);
    
    let r = 0;
    const contributingPaths: string[][] = [];

    for (const p of validPaths) {
        const n = p.path.length - 1; // number of steps (edges)
        const FA = getInbreeding(p.commonAncestor, pedigree, cache);
        r += Math.pow(0.5, n) * (1 + FA);
        contributingPaths.push(p.path);
    }

    return { r, paths: contributingPaths };
}

function getInbreeding(id: string, pedigree: DynamicPedigree, cache: InbreedingCache): number {
    if (cache.has(id)) return cache.get(id)!;

    // Find parents
    const parents = pedigree.edges
        .filter(e => resolveId(e.childId, pedigree.merges) === id)
        .map(e => resolveId(e.parentId, pedigree.merges));
        
    const uniqueParents = Array.from(new Set(parents));
    if (uniqueParents.length < 2) {
        cache.set(id, 0);
        return 0;
    }
    
    const [p1, p2] = uniqueParents;
    const { r } = calculateRAndPaths(p1, p2, pedigree, cache);
    const F = r / 2;
    cache.set(id, F);
    return F;
}

function getAncestorPaths(startId: string, pedigree: DynamicPedigree): string[][] {
    const parentOf = new Map<string, string[]>();
    for (const edge of pedigree.edges) {
        const child = resolveId(edge.childId, pedigree.merges);
        const parent = resolveId(edge.parentId, pedigree.merges);
        if (!parentOf.has(child)) parentOf.set(child, []);
        if (!parentOf.get(child)!.includes(parent)) {
            parentOf.get(child)!.push(parent);
        }
    }
    
    const paths: string[][] = [];
    
    function dfs(currentId: string, currentPath: string[]) {
        paths.push([...currentPath]);
        const parents = parentOf.get(currentId) || [];
        for (const parent of parents) {
            if (!currentPath.includes(parent)) {
                dfs(parent, [...currentPath, parent]);
            }
        }
    }
    
    dfs(startId, [startId]);
    return paths;
}

function findAllPaths(id1: string, id2: string, pedigree: DynamicPedigree): { path: string[], commonAncestor: string }[] {
    const pathsA = getAncestorPaths(id1, pedigree);
    const pathsB = getAncestorPaths(id2, pedigree);
    
    const validFullPaths: { path: string[], commonAncestor: string }[] = [];
    const seenPathKeys = new Set<string>();

    for (const pathA of pathsA) {
        for (const pathB of pathsB) {
            const ancestorA = pathA[pathA.length - 1];
            const ancestorB = pathB[pathB.length - 1];
            
            if (ancestorA === ancestorB) {
                const setB = new Set(pathB);
                let intersectionCount = 0;
                for (const node of pathA) {
                    if (setB.has(node)) intersectionCount++;
                }
                
                if (intersectionCount === 1) {
                    const commonAncestor = ancestorA;
                    const fullPath = [...pathA, ...pathB.slice(0, -1).reverse()];
                    const key = fullPath.join(',');
                    if (!seenPathKeys.has(key)) {
                        seenPathKeys.add(key);
                        validFullPaths.push({ path: fullPath, commonAncestor });
                    }
                }
            }
        }
    }
    
    return validFullPaths;
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
