import type { ProbabilityResult } from '../../types';
import './ProbabilityDisplay.css';

interface ProbabilityDisplayProps {
    result: ProbabilityResult;
    person1Label: string;
    person2Label: string;
}

export function ProbabilityDisplay({
    result,
    person1Label,
    person2Label
}: ProbabilityDisplayProps) {
    const formatPercent = (value: number) => {
        if (value < 0.01) {
            return `${(value * 100).toFixed(3)}%`;
        }
        return `${(value * 100).toFixed(2)}%`;
    };

    const formatCoefficient = (value: number) => {
        if (value < 0.001) {
            return value.toExponential(2);
        }
        return value.toFixed(4);
    };

    const hasChange = result.deltaFromBaseline !== 0;
    const changePercent = hasChange
        ? ((result.deltaFromBaseline / result.baselineR) * 100).toFixed(1)
        : null;

    return (
        <div className="probability-display">
            <div className="probability-header">
                <span className="probability-title">Gene Overlap Probability</span>
                <span className="probability-pair">
                    {person1Label} ↔ {person2Label}
                </span>
            </div>

            <div className="probability-main">
                <div className="probability-value">
                    {formatPercent(result.geneOverlapProbability)}
                </div>
                <div className="probability-bar">
                    <div
                        className="probability-bar-fill"
                        style={{ width: `${Math.min(result.geneOverlapProbability * 100, 100)}%` }}
                    />
                    {hasChange && (
                        <div
                            className="probability-bar-baseline"
                            style={{ left: `${result.baselineR * 100}%` }}
                        />
                    )}
                </div>
                {hasChange && (
                    <div className="probability-change">
                        <span className="probability-change-icon">↑</span>
                        <span>{changePercent}% from baseline due to consanguinity</span>
                    </div>
                )}
            </div>

            <div className="probability-details">
                <div className="probability-detail-row">
                    <span className="probability-detail-label">Coefficient of Relationship (r)</span>
                    <span className="probability-detail-value">
                        {formatCoefficient(result.coefficientOfRelationship)}
                    </span>
                </div>

                <div className="probability-detail-row">
                    <span className="probability-detail-label">Inbreeding Coefficient (F)</span>
                    <span className="probability-detail-value">
                        {formatCoefficient(result.inbreedingCoefficient)}
                    </span>
                </div>

                {result.xLinkedCoefficient !== null && (
                    <div className="probability-detail-row sex-linked">
                        <span className="probability-detail-label">
                            <span className="sex-indicator x">X</span>
                            X-Linked Coefficient
                        </span>
                        <span className="probability-detail-value">
                            {formatCoefficient(result.xLinkedCoefficient)}
                        </span>
                    </div>
                )}

                {result.yLinkedCoefficient !== null && result.yLinkedCoefficient > 0 && (
                    <div className="probability-detail-row sex-linked">
                        <span className="probability-detail-label">
                            <span className="sex-indicator y">Y</span>
                            Y-Linked Coefficient
                        </span>
                        <span className="probability-detail-value">
                            {formatCoefficient(result.yLinkedCoefficient)}
                        </span>
                    </div>
                )}

                <div className="probability-detail-row baseline">
                    <span className="probability-detail-label">Baseline r (no consanguinity)</span>
                    <span className="probability-detail-value">
                        {formatCoefficient(result.baselineR)}
                    </span>
                </div>
            </div>
        </div>
    );
}
