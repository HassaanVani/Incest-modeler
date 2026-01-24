import { CONSANGUINITY_SCENARIOS } from '../../lib/pedigree-templates';
import './ConsanguinityPanel.css';

interface ConsanguinityPanelProps {
    selectedScenarioId: string;
    onChange: (scenarioId: string) => void;
}

export function ConsanguinityPanel({ selectedScenarioId, onChange }: ConsanguinityPanelProps) {
    const selectedScenario = CONSANGUINITY_SCENARIOS.find(s => s.id === selectedScenarioId);

    return (
        <div className="consanguinity-panel">
            <label className="label">Consanguinity Factor</label>
            <p className="consanguinity-description">
                Ancestral inbreeding affects gene overlap probability
            </p>

            <select
                className="select consanguinity-select"
                value={selectedScenarioId}
                onChange={(e) => onChange(e.target.value)}
            >
                {CONSANGUINITY_SCENARIOS.map((scenario) => (
                    <option key={scenario.id} value={scenario.id}>
                        {scenario.label}
                    </option>
                ))}
            </select>

            {selectedScenario && selectedScenario.id !== 'none' && (
                <div className="consanguinity-info">
                    <span className="consanguinity-info-icon">⚠</span>
                    <span className="consanguinity-info-text">
                        {selectedScenario.description}
                    </span>
                </div>
            )}
        </div>
    );
}
