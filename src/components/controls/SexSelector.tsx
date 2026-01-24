import type { Sex } from '../../types';
import './SexSelector.css';

interface SexSelectorProps {
    person1Sex: Sex;
    person2Sex: Sex;
    person1Label: string;
    person2Label: string;
    onPerson1SexChange: (sex: Sex) => void;
    onPerson2SexChange: (sex: Sex) => void;
}

export function SexSelector({
    person1Sex,
    person2Sex,
    person1Label,
    person2Label,
    onPerson1SexChange,
    onPerson2SexChange,
}: SexSelectorProps) {
    return (
        <div className="sex-selector">
            <label className="label">Sex Configuration</label>
            <p className="sex-description">
                Required for X-linked and Y-linked calculations
            </p>

            <div className="sex-controls">
                <div className="sex-control">
                    <span className="sex-label">{person1Label}</span>
                    <div className="sex-toggle">
                        <button
                            className={`sex-btn ${person1Sex === 'M' ? 'selected male' : ''}`}
                            onClick={() => onPerson1SexChange('M')}
                        >
                            ♂
                        </button>
                        <button
                            className={`sex-btn ${person1Sex === 'F' ? 'selected female' : ''}`}
                            onClick={() => onPerson1SexChange('F')}
                        >
                            ♀
                        </button>
                    </div>
                </div>

                <div className="sex-control">
                    <span className="sex-label">{person2Label}</span>
                    <div className="sex-toggle">
                        <button
                            className={`sex-btn ${person2Sex === 'M' ? 'selected male' : ''}`}
                            onClick={() => onPerson2SexChange('M')}
                        >
                            ♂
                        </button>
                        <button
                            className={`sex-btn ${person2Sex === 'F' ? 'selected female' : ''}`}
                            onClick={() => onPerson2SexChange('F')}
                        >
                            ♀
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
