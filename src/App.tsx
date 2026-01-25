import { useState, useMemo, useCallback } from 'react';
import { Header } from './components/layout/Header';
import { InteractiveGraph } from './components/graph/InteractiveGraph';
import { RelationshipSelector } from './components/controls/RelationshipSelector';
import { SexSelector } from './components/controls/SexSelector';
import { ProbabilityDisplay } from './components/results/ProbabilityDisplay';
import {
  generateBasePedigree,
  calculateFromPedigree,
  type DynamicPedigree,
} from './lib/dynamic-pedigree';
import { BASE_COEFFICIENTS, xLinkedCoefficient, yLinkedCoefficient } from './lib/genetics';
import type { RelationshipType, Sex } from './types';
import './App.css';

function App() {
  const [baseRelationship, setBaseRelationship] = useState<RelationshipType>('first-cousins');
  const [person1Sex, setPerson1Sex] = useState<Sex>('M');
  const [person2Sex, setPerson2Sex] = useState<Sex>('F');

  // Initialize pedigree from base relationship
  const [pedigree, setPedigree] = useState<DynamicPedigree>(() =>
    generateBasePedigree(baseRelationship, person1Sex, person2Sex)
  );

  // Regenerate pedigree when base relationship changes
  const handleRelationshipChange = useCallback((newRelationship: RelationshipType) => {
    setBaseRelationship(newRelationship);
    setPedigree(generateBasePedigree(newRelationship, person1Sex, person2Sex));
  }, [person1Sex, person2Sex]);

  // Handle sex changes
  const handlePerson1SexChange = useCallback((sex: Sex) => {
    setPerson1Sex(sex);
    // Update the target person's sex in the pedigree
    setPedigree(prev => {
      const newPersons = new Map(prev.persons);
      const p1 = newPersons.get(prev.targetPair[0]);
      if (p1) {
        newPersons.set(prev.targetPair[0], { ...p1, sex });
      }
      return { ...prev, persons: newPersons };
    });
  }, []);

  const handlePerson2SexChange = useCallback((sex: Sex) => {
    setPerson2Sex(sex);
    setPedigree(prev => {
      const newPersons = new Map(prev.persons);
      const p2 = newPersons.get(prev.targetPair[1]);
      if (p2) {
        newPersons.set(prev.targetPair[1], { ...p2, sex });
      }
      return { ...prev, persons: newPersons };
    });
  }, []);

  // Toggle sex from graph click
  const handlePersonSexToggle = useCallback((personId: string) => {
    setPedigree(prev => {
      const newPersons = new Map(prev.persons);
      const person = newPersons.get(personId);
      if (person) {
        const newSex = person.sex === 'M' ? 'F' : 'M';
        newPersons.set(personId, { ...person, sex: newSex });

        // Update tracked sex if it's a target
        if (personId === prev.targetPair[0]) {
          setPerson1Sex(newSex);
        } else if (personId === prev.targetPair[1]) {
          setPerson2Sex(newSex);
        }
      }
      return { ...prev, persons: newPersons };
    });
  }, []);

  // Calculate probabilities from the dynamic pedigree
  const probabilityResult = useMemo(() => {
    const result = calculateFromPedigree(pedigree);
    const baseR = BASE_COEFFICIENTS[baseRelationship] || 0.125;

    const p1 = pedigree.persons.get(pedigree.targetPair[0]);
    const p2 = pedigree.persons.get(pedigree.targetPair[1]);

    // Calculate sex-linked coefficients
    let xLinked: number | null = null;
    let yLinked: number | null = null;

    if (p1 && p2) {
      xLinked = xLinkedCoefficient(p1, p2, baseRelationship);
      yLinked = yLinkedCoefficient(p1, p2, baseRelationship);
    }

    return {
      coefficientOfRelationship: result.coefficientOfRelationship,
      geneOverlapProbability: result.coefficientOfRelationship,
      inbreedingCoefficient: result.inbreedingCoefficient,
      xLinkedCoefficient: xLinked,
      yLinkedCoefficient: yLinked,
      baselineR: baseR,
      deltaFromBaseline: result.coefficientOfRelationship - baseR,
    };
  }, [pedigree, baseRelationship]);

  // Get labels for targets
  const personLabels = useMemo(() => {
    const p1 = pedigree.persons.get(pedigree.targetPair[0]);
    const p2 = pedigree.persons.get(pedigree.targetPair[1]);
    return {
      person1: p1?.label || 'Person A',
      person2: p2?.label || 'Person B',
    };
  }, [pedigree]);

  // Count defined relationships
  const definedRelationshipsCount = pedigree.definedRelationships.length;

  return (
    <div className="app">
      <Header />

      <main className="app-main">
        <div className="app-layout">
          <section className="app-graph-section">
            <div className="section-header">
              <h2 className="section-title">Interactive Pedigree</h2>
              {definedRelationshipsCount > 0 && (
                <span className="defined-count">
                  {definedRelationshipsCount} relationship{definedRelationshipsCount > 1 ? 's' : ''} defined
                </span>
              )}
            </div>
            <InteractiveGraph
              pedigree={pedigree}
              onPedigreeChange={setPedigree}
              onPersonSexToggle={handlePersonSexToggle}
            />
          </section>

          <aside className="app-sidebar">
            <div className="sidebar-section">
              <label className="label">Base Relationship</label>
              <p className="section-description">
                Select the relationship type to model, then click pairs of nodes to define additional relationships
              </p>
              <RelationshipSelector
                value={baseRelationship}
                onChange={handleRelationshipChange}
              />
            </div>

            <div className="sidebar-section">
              <SexSelector
                person1Sex={person1Sex}
                person2Sex={person2Sex}
                person1Label={personLabels.person1}
                person2Label={personLabels.person2}
                onPerson1SexChange={handlePerson1SexChange}
                onPerson2SexChange={handlePerson2SexChange}
              />
            </div>

            {/* Defined relationships summary */}
            {pedigree.definedRelationships.length > 0 && (
              <div className="sidebar-section">
                <label className="label">Defined Relationships</label>
                <div className="defined-relationships-list">
                  {pedigree.definedRelationships.map((rel, index) => (
                    <div key={index} className="defined-relationship-item">
                      <span className="defined-relationship-pair">
                        {pedigree.persons.get(rel.person1Id)?.label} ↔ {pedigree.persons.get(rel.person2Id)?.label}
                      </span>
                      <span className="defined-relationship-type">{rel.type}</span>
                    </div>
                  ))}
                </div>
                <button
                  className="btn btn-secondary reset-btn"
                  onClick={() => setPedigree(generateBasePedigree(baseRelationship, person1Sex, person2Sex))}
                >
                  Reset Relationships
                </button>
              </div>
            )}

            <div className="sidebar-section results-section">
              <ProbabilityDisplay
                result={probabilityResult}
                person1Label={personLabels.person1}
                person2Label={personLabels.person2}
              />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default App;
