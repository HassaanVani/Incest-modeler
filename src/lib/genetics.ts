import type { AncestorPath, FamilyGraph, Person, ProbabilityResult, RelationshipType } from '../types';

/**
 * Base coefficients of relationship for standard relationships (no inbreeding)
 */
export const BASE_COEFFICIENTS: Record<RelationshipType, number> = {
    'parent-child': 0.5,
    'siblings': 0.5,
    'half-siblings': 0.25,
    'grandparent-grandchild': 0.25,
    'avuncular': 0.25,
    'first-cousins': 0.125,
    'double-first-cousins': 0.25,
    'first-cousins-once-removed': 0.0625,
    'great-grandparent': 0.125,
    'second-cousins': 0.03125,
    'third-cousins': 0.0078125,
};

/**
 * Coefficient of Relationship (r)
 * r = Σ (0.5)^n × (1 + F_A)
 * where n = total steps in path through common ancestor
 * F_A = inbreeding coefficient of common ancestor
 */
export function coefficientOfRelationship(
    paths: AncestorPath[],
    ancestorInbreeding: Map<string, number>
): number {
    let r = 0;

    for (const path of paths) {
        const F_A = ancestorInbreeding.get(path.commonAncestorId) || 0;
        const contribution = Math.pow(0.5, path.steps) * (1 + F_A);
        r += contribution;
    }

    return r;
}

/**
 * Inbreeding Coefficient (F) for offspring
 * F = Σ (0.5)^(n+1) × (1 + F_A)
 * Probability that alleles at a locus are identical by descent
 */
export function inbreedingCoefficient(
    paths: AncestorPath[],
    ancestorInbreeding: Map<string, number>
): number {
    let F = 0;

    for (const path of paths) {
        const F_A = ancestorInbreeding.get(path.commonAncestorId) || 0;
        const contribution = Math.pow(0.5, path.steps + 1) * (1 + F_A);
        F += contribution;
    }

    return F;
}

/**
 * Gene overlap probability from coefficient of relationship
 * This represents the expected proportion of genes shared
 */
export function geneOverlapProbability(r: number): number {
    return r;
}

/**
 * Calculate X-linked coefficient between two individuals
 * Males have 1 X (from mother), Females have 2 X (one from each parent)
 */
export function xLinkedCoefficient(
    person1: Person,
    person2: Person,
    relationship: RelationshipType
): number | null {
    const sex1 = person1.sex;
    const sex2 = person2.sex;

    // X-linked coefficients vary based on sex combination and relationship
    const xLinkedTable: Record<RelationshipType, Record<string, number>> = {
        'parent-child': {
            'M-M': 0,      // Father-Son: no X transmitted
            'M-F': 1.0,    // Father-Daughter: father's only X
            'F-M': 0.5,    // Mother-Son: one of mother's two X
            'F-F': 0.5,    // Mother-Daughter: one of mother's two X
        },
        'siblings': {
            'M-M': 0.5,    // Brothers share mother's X with 50% probability
            'M-F': 0.5,    // Brother-Sister share mother's X
            'F-M': 0.5,    // Sister-Brother
            'F-F': 0.5,    // Sisters: 0.5 from mother, need father contribution for full
        },
        'half-siblings': {
            'M-M': 0.5,    // Maternal half-brothers
            'M-F': 0.5,    // Maternal half-siblings
            'F-M': 0.5,
            'F-F': 0.5,
        },
        'grandparent-grandchild': {
            'M-M': 0,
            'M-F': 0,      // Paternal grandfather to granddaughter
            'F-M': 0.25,
            'F-F': 0.25,
        },
        'avuncular': {
            'M-M': 0.25,
            'M-F': 0.25,
            'F-M': 0.25,
            'F-F': 0.25,
        },
        'first-cousins': {
            'M-M': 0.125,
            'M-F': 0.125,
            'F-M': 0.125,
            'F-F': 0.125,
        },
        'double-first-cousins': {
            'M-M': 0.25,
            'M-F': 0.25,
            'F-M': 0.25,
            'F-F': 0.25,
        },
        'first-cousins-once-removed': {
            'M-M': 0.0625,
            'M-F': 0.0625,
            'F-M': 0.0625,
            'F-F': 0.0625,
        },
        'great-grandparent': {
            'M-M': 0,
            'M-F': 0,
            'F-M': 0.125,
            'F-F': 0.125,
        },
        'second-cousins': {
            'M-M': 0.03125,
            'M-F': 0.03125,
            'F-M': 0.03125,
            'F-F': 0.03125,
        },
        'third-cousins': {
            'M-M': 0.0078125,
            'M-F': 0.0078125,
            'F-M': 0.0078125,
            'F-F': 0.0078125,
        },
    };

    const key = `${sex1}-${sex2}`;
    return xLinkedTable[relationship]?.[key] ?? null;
}

/**
 * Calculate Y-linked coefficient between two individuals
 * Y chromosome only transmitted father → son
 * All patrilineal males share 100% Y-chromosome identity
 */
export function yLinkedCoefficient(
    person1: Person,
    person2: Person,
    relationship: RelationshipType
): number | null {
    // Y-linked only applies to male-male relationships
    if (person1.sex !== 'M' || person2.sex !== 'M') {
        return 0;
    }

    // Patrilineal relationships share Y chromosome completely
    const patrilinealRelationships: RelationshipType[] = [
        'parent-child', // Father-son
        'siblings',     // Brothers (same father)
        'grandparent-grandchild', // Paternal grandfather-grandson
        'avuncular',    // Paternal uncle-nephew
        'first-cousins', // Paternal male cousins
    ];

    if (patrilinealRelationships.includes(relationship)) {
        return 1.0;
    }

    // Half-siblings only share if same father
    if (relationship === 'half-siblings') {
        return 0; // Assume maternal half-siblings by default
    }

    return 0;
}

/**
 * Calculate complete probability result for a relationship
 */
export function calculateProbabilities(
    person1: Person,
    person2: Person,
    relationship: RelationshipType,
    consanguinityFactor: number = 0
): ProbabilityResult {
    // Base coefficient from relationship type
    const baseR = BASE_COEFFICIENTS[relationship];

    // Adjust for consanguinity
    // When parents are related, the coefficient increases
    const adjustedR = baseR * (1 + consanguinityFactor);

    // Calculate inbreeding coefficient for potential offspring
    const F = adjustedR / 2;

    // Sex-linked coefficients
    const xLinked = xLinkedCoefficient(person1, person2, relationship);
    const yLinked = yLinkedCoefficient(person1, person2, relationship);

    return {
        coefficientOfRelationship: adjustedR,
        geneOverlapProbability: geneOverlapProbability(adjustedR),
        inbreedingCoefficient: F,
        xLinkedCoefficient: xLinked,
        yLinkedCoefficient: yLinked,
        baselineR: baseR,
        deltaFromBaseline: adjustedR - baseR,
    };
}

/**
 * Get consanguinity factor from parent relationship
 */
export function getConsanguinityFactor(parentRelationship: RelationshipType | null): number {
    if (!parentRelationship) return 0;

    // The consanguinity factor is based on the inbreeding coefficient
    // that would result from the parent relationship
    const parentR = BASE_COEFFICIENTS[parentRelationship] || 0;
    return parentR / 2; // F = r/2 for offspring of related parents
}

/**
 * Generation depth multipliers for consanguinity effects
 * Grandparent consanguinity has less effect than parent consanguinity
 */
const GENERATION_MULTIPLIERS: Record<string, number> = {
    'parents': 1.0,
    'grandparents': 0.5,
    'great-grandparents': 0.25,
};

/**
 * Calculate compound consanguinity factor from multiple ancestry relationships
 * Each factor contributes additively, with generation depth reducing the effect
 */
export function getCompoundConsanguinityFactor(
    factors: Array<{
        generation: 'parents' | 'grandparents' | 'great-grandparents';
        relationship: RelationshipType;
    }>
): number {
    let totalFactor = 0;

    for (const factor of factors) {
        const baseF = getConsanguinityFactor(factor.relationship);
        const multiplier = GENERATION_MULTIPLIERS[factor.generation] || 1.0;
        totalFactor += baseF * multiplier;
    }

    return totalFactor;
}

/**
 * Find all paths between two individuals through common ancestors
 */
export function findAncestorPaths(
    person1Id: string,
    person2Id: string,
    graph: FamilyGraph
): AncestorPath[] {
    const pathsA = getAncestorPaths(person1Id, graph);
    const pathsB = getAncestorPaths(person2Id, graph);
    
    const validFullPaths: AncestorPath[] = [];
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
                    const commonAncestorId = ancestorA;
                    const fullPath = [...pathA, ...pathB.slice(0, -1).reverse()];
                    const key = fullPath.join(',');
                    if (!seenPathKeys.has(key)) {
                        seenPathKeys.add(key);
                        validFullPaths.push({ 
                            personIds: fullPath, 
                            commonAncestorId, 
                            steps: pathA.length - 1 + pathB.length - 1 
                        });
                    }
                }
            }
        }
    }
    
    return validFullPaths;
}

/**
 * Get all paths to all ancestors for a given person
 */
function getAncestorPaths(
    personId: string,
    graph: FamilyGraph
): string[][] {
    const paths: string[][] = [];
    
    function dfs(currentId: string, currentPath: string[]) {
        paths.push([...currentPath]);
        
        const person = graph.persons.get(currentId);
        if (!person) return;
        
        const parentIds = [person.motherId, person.fatherId].filter(Boolean) as string[];
        for (const parentId of parentIds) {
            if (!currentPath.includes(parentId)) {
                dfs(parentId, [...currentPath, parentId]);
            }
        }
    }
    
    dfs(personId, [personId]);
    return paths;
}
