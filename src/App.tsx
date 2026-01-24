import { useState, useMemo, useCallback } from 'react';
import { Header } from './components/layout/Header';
import { FamilyGraph } from './components/graph/FamilyGraph';
import { RelationshipSelector } from './components/controls/RelationshipSelector';
import { CompoundConsanguinityPanel, type ConsanguinityFactor } from './components/controls/CompoundConsanguinityPanel';
import { SexSelector } from './components/controls/SexSelector';
import { ProbabilityDisplay } from './components/results/ProbabilityDisplay';
import {
  getPedigreeForRelationship,
  getSelectedPairIds
} from './lib/pedigree-templates';
import {
  calculateProbabilities,
  getCompoundConsanguinityFactor
} from './lib/genetics';
import type { RelationshipType, Sex, FamilyGraph as FamilyGraphType } from './types';
import './App.css';

function App() {
  const [relationship, setRelationship] = useState<RelationshipType>('siblings');
  const [consanguinityFactors, setConsanguinityFactors] = useState<ConsanguinityFactor[]>([]);
  const [person1Sex, setPerson1Sex] = useState<Sex>('M');
  const [person2Sex, setPerson2Sex] = useState<Sex>('F');

  // Get the pedigree graph for the selected relationship
  const baseGraph = useMemo(() => {
    return getPedigreeForRelationship(relationship);
  }, [relationship]);

  // Update graph with current sex selections and consanguinity links
  const graph = useMemo((): FamilyGraphType => {
    const [id1, id2] = getSelectedPairIds(relationship);
    const persons = new Map(baseGraph.persons);

    // Update sexes for selected persons
    const p1 = persons.get(id1);
    const p2 = persons.get(id2);
    if (p1) persons.set(id1, { ...p1, sex: person1Sex });
    if (p2) persons.set(id2, { ...p2, sex: person2Sex });

    // Add consanguinity links for visualization
    const consanguinityLinks = consanguinityFactors.map((factor, index) => {
      // For parent-level consanguinity, show link between father and mother
      if (factor.generation === 'parents') {
        return {
          person1Id: 'father',
          person2Id: 'mother',
          relationship: factor.relationship,
        };
      }
      // For grandparent level, show between grandparents
      if (factor.generation === 'grandparents') {
        return {
          person1Id: index % 2 === 0 ? 'gf1' : 'gf2',
          person2Id: index % 2 === 0 ? 'gm1' : 'gm2',
          relationship: factor.relationship,
        };
      }
      // Default
      return {
        person1Id: 'father',
        person2Id: 'mother',
        relationship: factor.relationship,
      };
    });

    return {
      ...baseGraph,
      persons,
      consanguinityLinks,
    };
  }, [baseGraph, relationship, person1Sex, person2Sex, consanguinityFactors]);

  // Get selected pair IDs
  const selectedPair = useMemo(() => {
    return getSelectedPairIds(relationship);
  }, [relationship]);

  // Get person labels
  const personLabels = useMemo(() => {
    const [id1, id2] = selectedPair;
    const p1 = graph.persons.get(id1);
    const p2 = graph.persons.get(id2);
    return {
      person1: p1?.label || 'Person A',
      person2: p2?.label || 'Person B',
    };
  }, [graph, selectedPair]);

  // Calculate probability result
  const probabilityResult = useMemo(() => {
    const [id1, id2] = selectedPair;
    const p1 = graph.persons.get(id1);
    const p2 = graph.persons.get(id2);

    if (!p1 || !p2) {
      return null;
    }

    // Calculate compound consanguinity factor from all factors
    const compoundFactor = getCompoundConsanguinityFactor(consanguinityFactors);

    return calculateProbabilities(p1, p2, relationship, compoundFactor);
  }, [graph, selectedPair, relationship, consanguinityFactors]);

  // Handle sex toggle from graph click
  const handlePersonSexToggle = useCallback((personId: string) => {
    const [id1, id2] = selectedPair;
    if (personId === id1) {
      setPerson1Sex(s => s === 'M' ? 'F' : 'M');
    } else if (personId === id2) {
      setPerson2Sex(s => s === 'M' ? 'F' : 'M');
    }
  }, [selectedPair]);

  return (
    <div className="app">
      <Header />

      <main className="app-main">
        <div className="app-layout">
          <section className="app-graph-section">
            <div className="section-header">
              <h2 className="section-title">Family Pedigree</h2>
            </div>
            <FamilyGraph
              graph={graph}
              selectedPair={selectedPair}
              onPersonSexToggle={handlePersonSexToggle}
            />
          </section>

          <aside className="app-sidebar">
            <div className="sidebar-section">
              <RelationshipSelector
                value={relationship}
                onChange={setRelationship}
              />
            </div>

            <div className="sidebar-section">
              <SexSelector
                person1Sex={person1Sex}
                person2Sex={person2Sex}
                person1Label={personLabels.person1}
                person2Label={personLabels.person2}
                onPerson1SexChange={setPerson1Sex}
                onPerson2SexChange={setPerson2Sex}
              />
            </div>

            <div className="sidebar-section">
              <CompoundConsanguinityPanel
                factors={consanguinityFactors}
                onChange={setConsanguinityFactors}
              />
            </div>

            <div className="sidebar-section results-section">
              {probabilityResult && (
                <ProbabilityDisplay
                  result={probabilityResult}
                  person1Label={personLabels.person1}
                  person2Label={personLabels.person2}
                />
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default App;
