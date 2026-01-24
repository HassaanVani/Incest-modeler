import type { RelationshipType } from '../../types';
import { RELATIONSHIP_OPTIONS } from '../../lib/pedigree-templates';
import './RelationshipSelector.css';

interface RelationshipSelectorProps {
    value: RelationshipType;
    onChange: (relationship: RelationshipType) => void;
}

export function RelationshipSelector({ value, onChange }: RelationshipSelectorProps) {
    return (
        <div className="relationship-selector">
            <label className="label">Relationship Type</label>
            <div className="relationship-grid">
                {RELATIONSHIP_OPTIONS.map((option) => (
                    <button
                        key={option.value}
                        className={`relationship-option ${value === option.value ? 'selected' : ''}`}
                        onClick={() => onChange(option.value)}
                        title={option.description}
                    >
                        <span className="relationship-label">{option.label}</span>
                        <span className="relationship-coefficient">
                            r = {option.baseCoefficient}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
