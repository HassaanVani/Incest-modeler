import type { ConsanguinityScenario, FamilyGraph, Person, RelationshipOption, RelationshipType, Sex } from '../types';

/**
 * Available relationship types with descriptions
 */
export const RELATIONSHIP_OPTIONS: RelationshipOption[] = [
    {
        value: 'siblings',
        label: 'Siblings',
        description: 'Full siblings sharing both parents',
        baseCoefficient: 0.5,
    },
    {
        value: 'half-siblings',
        label: 'Half-Siblings',
        description: 'Sharing one parent',
        baseCoefficient: 0.25,
    },
    {
        value: 'first-cousins',
        label: '1st Cousins',
        description: 'Children of siblings',
        baseCoefficient: 0.125,
    },
    {
        value: 'double-first-cousins',
        label: 'Double 1st Cousins',
        description: 'Both sets of parents are siblings',
        baseCoefficient: 0.25,
    },
    {
        value: 'second-cousins',
        label: '2nd Cousins',
        description: 'Share great-grandparents',
        baseCoefficient: 0.03125,
    },
    {
        value: 'third-cousins',
        label: '3rd Cousins',
        description: 'Share great-great-grandparents',
        baseCoefficient: 0.0078125,
    },
    {
        value: 'first-cousins-once-removed',
        label: '1st Cousins Once Removed',
        description: 'Child of 1st cousin',
        baseCoefficient: 0.0625,
    },
    {
        value: 'avuncular',
        label: 'Aunt/Uncle - Niece/Nephew',
        description: 'Avuncular relationship',
        baseCoefficient: 0.25,
    },
    {
        value: 'grandparent-grandchild',
        label: 'Grandparent - Grandchild',
        description: 'Two generations apart',
        baseCoefficient: 0.25,
    },
];

/**
 * Consanguinity presets
 */
export const CONSANGUINITY_SCENARIOS: ConsanguinityScenario[] = [
    {
        id: 'none',
        label: 'None',
        description: 'No ancestral consanguinity',
        ancestorRelationship: 'siblings',
        ancestorGeneration: 'parents',
    },
    {
        id: 'parents-first-cousins',
        label: 'Parents are 1st Cousins',
        description: 'Parents share grandparents',
        ancestorRelationship: 'first-cousins',
        ancestorGeneration: 'parents',
    },
    {
        id: 'parents-second-cousins',
        label: 'Parents are 2nd Cousins',
        description: 'Parents share great-grandparents',
        ancestorRelationship: 'second-cousins',
        ancestorGeneration: 'parents',
    },
    {
        id: 'parents-half-siblings',
        label: 'Parents are Half-Siblings',
        description: 'Parents share one parent',
        ancestorRelationship: 'half-siblings',
        ancestorGeneration: 'parents',
    },
    {
        id: 'parents-siblings',
        label: 'Parents are Siblings',
        description: 'Parents are full siblings',
        ancestorRelationship: 'siblings',
        ancestorGeneration: 'parents',
    },
    {
        id: 'grandparents-first-cousins',
        label: 'Grandparents are 1st Cousins',
        description: 'One set of grandparents are cousins',
        ancestorRelationship: 'first-cousins',
        ancestorGeneration: 'grandparents',
    },
    {
        id: 'grandparents-siblings',
        label: 'Grandparents are Siblings',
        description: 'One set of grandparents are siblings',
        ancestorRelationship: 'siblings',
        ancestorGeneration: 'grandparents',
    },
];

/**
 * Generate a person node
 */
export function createPerson(
    id: string,
    label: string,
    sex: Sex,
    generation: number,
    motherId?: string,
    fatherId?: string
): Person {
    return {
        id,
        label,
        sex,
        generation,
        motherId,
        fatherId,
    };
}

/**
 * Create a basic sibling pedigree graph
 */
export function createSiblingPedigree(): FamilyGraph {
    const persons = new Map<string, Person>();

    // Grandparents (generation 0)
    persons.set('gf1', createPerson('gf1', 'Grandfather 1', 'M', 0));
    persons.set('gm1', createPerson('gm1', 'Grandmother 1', 'F', 0));
    persons.set('gf2', createPerson('gf2', 'Grandfather 2', 'M', 0));
    persons.set('gm2', createPerson('gm2', 'Grandmother 2', 'F', 0));

    // Parents (generation 1)
    persons.set('father', createPerson('father', 'Father', 'M', 1, 'gm1', 'gf1'));
    persons.set('mother', createPerson('mother', 'Mother', 'F', 1, 'gm2', 'gf2'));

    // Children (generation 2) - these are the selected pair
    persons.set('child1', createPerson('child1', 'Sibling A', 'M', 2, 'mother', 'father'));
    persons.set('child2', createPerson('child2', 'Sibling B', 'F', 2, 'mother', 'father'));

    const edges = [
        { parentId: 'gf1', childId: 'father' },
        { parentId: 'gm1', childId: 'father' },
        { parentId: 'gf2', childId: 'mother' },
        { parentId: 'gm2', childId: 'mother' },
        { parentId: 'father', childId: 'child1' },
        { parentId: 'mother', childId: 'child1' },
        { parentId: 'father', childId: 'child2' },
        { parentId: 'mother', childId: 'child2' },
    ];

    return { persons, edges, consanguinityLinks: [] };
}

/**
 * Create a first cousins pedigree graph
 */
export function createCousinsPedigree(): FamilyGraph {
    const persons = new Map<string, Person>();

    // Shared grandparents (generation 0)
    persons.set('gf', createPerson('gf', 'Grandfather', 'M', 0));
    persons.set('gm', createPerson('gm', 'Grandmother', 'F', 0));

    // Parents generation (siblings + their spouses)
    persons.set('parent1', createPerson('parent1', 'Parent 1', 'M', 1, 'gm', 'gf'));
    persons.set('parent2', createPerson('parent2', 'Parent 2', 'M', 1, 'gm', 'gf'));
    persons.set('spouse1', createPerson('spouse1', 'Spouse 1', 'F', 1));
    persons.set('spouse2', createPerson('spouse2', 'Spouse 2', 'F', 1));

    // Cousins (generation 2)
    persons.set('cousin1', createPerson('cousin1', 'Cousin A', 'M', 2, 'spouse1', 'parent1'));
    persons.set('cousin2', createPerson('cousin2', 'Cousin B', 'F', 2, 'spouse2', 'parent2'));

    const edges = [
        { parentId: 'gf', childId: 'parent1' },
        { parentId: 'gm', childId: 'parent1' },
        { parentId: 'gf', childId: 'parent2' },
        { parentId: 'gm', childId: 'parent2' },
        { parentId: 'parent1', childId: 'cousin1' },
        { parentId: 'spouse1', childId: 'cousin1' },
        { parentId: 'parent2', childId: 'cousin2' },
        { parentId: 'spouse2', childId: 'cousin2' },
    ];

    return { persons, edges, consanguinityLinks: [] };
}

/**
 * Get pedigree template for a relationship type
 */
export function getPedigreeForRelationship(relationship: RelationshipType): FamilyGraph {
    switch (relationship) {
        case 'siblings':
        case 'half-siblings':
            return createSiblingPedigree();
        case 'first-cousins':
        case 'double-first-cousins':
        case 'second-cousins':
        case 'third-cousins':
        case 'first-cousins-once-removed':
            return createCousinsPedigree();
        default:
            return createSiblingPedigree();
    }
}

/**
 * Get the selected pair IDs for a relationship type
 */
export function getSelectedPairIds(relationship: RelationshipType): [string, string] {
    switch (relationship) {
        case 'siblings':
        case 'half-siblings':
            return ['child1', 'child2'];
        case 'first-cousins':
        case 'double-first-cousins':
        case 'second-cousins':
        case 'third-cousins':
        case 'first-cousins-once-removed':
            return ['cousin1', 'cousin2'];
        default:
            return ['child1', 'child2'];
    }
}
