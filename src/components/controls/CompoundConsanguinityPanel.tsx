import type { RelationshipType } from '../../types';
import './CompoundConsanguinityPanel.css';

export interface ConsanguinityFactor {
    id: string;
    generation: 'parents' | 'grandparents' | 'great-grandparents';
    relationship: RelationshipType;
    description: string;
}

interface CompoundConsanguinityPanelProps {
    factors: ConsanguinityFactor[];
    onChange: (factors: ConsanguinityFactor[]) => void;
}

const GENERATION_OPTIONS = [
    { value: 'parents', label: 'Parents' },
    { value: 'grandparents', label: 'Grandparents' },
    { value: 'great-grandparents', label: 'Great-Grandparents' },
] as const;

const RELATIONSHIP_CHOICES: { value: RelationshipType; label: string }[] = [
    { value: 'siblings', label: 'Siblings' },
    { value: 'half-siblings', label: 'Half-Siblings' },
    { value: 'first-cousins', label: '1st Cousins' },
    { value: 'second-cousins', label: '2nd Cousins' },
    { value: 'third-cousins', label: '3rd Cousins' },
    { value: 'double-first-cousins', label: 'Double 1st Cousins' },
    { value: 'avuncular', label: 'Aunt/Uncle-Niece/Nephew' },
];

let factorIdCounter = 0;

export function CompoundConsanguinityPanel({ factors, onChange }: CompoundConsanguinityPanelProps) {
    const addFactor = () => {
        const newFactor: ConsanguinityFactor = {
            id: `factor-${++factorIdCounter}`,
            generation: 'parents',
            relationship: 'first-cousins',
            description: 'Parents are 1st Cousins',
        };
        onChange([...factors, newFactor]);
    };

    const removeFactor = (id: string) => {
        onChange(factors.filter(f => f.id !== id));
    };

    const updateFactor = (id: string, updates: Partial<ConsanguinityFactor>) => {
        onChange(factors.map(f => {
            if (f.id !== id) return f;
            const updated = { ...f, ...updates };
            // Auto-generate description
            const genLabel = GENERATION_OPTIONS.find(g => g.value === updated.generation)?.label || updated.generation;
            const relLabel = RELATIONSHIP_CHOICES.find(r => r.value === updated.relationship)?.label || updated.relationship;
            updated.description = `${genLabel} are ${relLabel}`;
            return updated;
        }));
    };

    return (
        <div className="compound-consanguinity-panel">
            <label className="label">Consanguinity Factors</label>
            <p className="compound-description">
                Add multiple ancestral relationships to model complex pedigrees
            </p>

            {factors.length === 0 && (
                <div className="no-factors">
                    No consanguinity factors added
                </div>
            )}

            <div className="factors-list">
                {factors.map((factor, index) => (
                    <div key={factor.id} className="factor-item">
                        <div className="factor-header">
                            <span className="factor-number">{index + 1}</span>
                            <button
                                className="factor-remove"
                                onClick={() => removeFactor(factor.id)}
                                aria-label="Remove factor"
                            >
                                ×
                            </button>
                        </div>

                        <div className="factor-controls">
                            <div className="factor-field">
                                <label className="factor-label">Generation</label>
                                <select
                                    className="select factor-select"
                                    value={factor.generation}
                                    onChange={(e) => updateFactor(factor.id, {
                                        generation: e.target.value as ConsanguinityFactor['generation']
                                    })}
                                >
                                    {GENERATION_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="factor-field">
                                <label className="factor-label">Relationship</label>
                                <select
                                    className="select factor-select"
                                    value={factor.relationship}
                                    onChange={(e) => updateFactor(factor.id, {
                                        relationship: e.target.value as RelationshipType
                                    })}
                                >
                                    {RELATIONSHIP_CHOICES.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="factor-summary">
                            {factor.description}
                        </div>
                    </div>
                ))}
            </div>

            <button className="btn btn-secondary add-factor-btn" onClick={addFactor}>
                <span className="add-icon">+</span>
                Add Consanguinity Factor
            </button>

            {factors.length > 0 && (
                <div className="compound-info">
                    <span className="compound-info-icon">ℹ</span>
                    <span className="compound-info-text">
                        {factors.length} factor{factors.length > 1 ? 's' : ''} will compound the coefficient
                    </span>
                </div>
            )}
        </div>
    );
}
