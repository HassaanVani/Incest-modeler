export type Sex = 'M' | 'F';

export interface Person {
  id: string;
  label: string;
  sex: Sex;
  generation: number;
  x?: number;
  y?: number;
  motherId?: string;
  fatherId?: string;
  inbreedingCoefficient?: number;
}

export interface ParentChildEdge {
  parentId: string;
  childId: string;
}

export interface ConsanguinityLink {
  person1Id: string;
  person2Id: string;
  relationship: RelationshipType;
}

export interface FamilyGraph {
  persons: Map<string, Person>;
  edges: ParentChildEdge[];
  consanguinityLinks: ConsanguinityLink[];
}

export type RelationshipType =
  | 'siblings'
  | 'half-siblings'
  | 'first-cousins'
  | 'second-cousins'
  | 'third-cousins'
  | 'double-first-cousins'
  | 'first-cousins-once-removed'
  | 'avuncular'
  | 'grandparent-grandchild'
  | 'great-grandparent'
  | 'parent-child';

export interface RelationshipOption {
  value: RelationshipType;
  label: string;
  description: string;
  baseCoefficient: number;
}

export interface AncestorPath {
  personIds: string[];
  commonAncestorId: string;
  steps: number;
}

export interface ProbabilityResult {
  coefficientOfRelationship: number;
  geneOverlapProbability: number;
  inbreedingCoefficient: number;
  xLinkedCoefficient: number | null;
  yLinkedCoefficient: number | null;
  baselineR: number;
  deltaFromBaseline: number;
}

export interface ConsanguinityScenario {
  id: string;
  label: string;
  description: string;
  ancestorRelationship: RelationshipType;
  ancestorGeneration: 'parents' | 'grandparents' | 'great-grandparents';
}

export interface GraphNode {
  id: string;
  x: number;
  y: number;
  radius: number;
  person: Person;
  isSelected: boolean;
  isHighlighted: boolean;
}

export interface GraphEdge {
  source: GraphNode;
  target: GraphNode;
  isConsanguinity: boolean;
  isHighlighted: boolean;
}
