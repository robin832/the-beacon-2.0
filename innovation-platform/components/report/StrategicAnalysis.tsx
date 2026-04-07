'use client';

import { Analysis } from '@/lib/types';
import Card from '@/components/ui/Card';
import TechTag from '@/components/ui/TechTag';

interface StrategicAnalysisProps {
  analysis: Analysis;
}

export default function StrategicAnalysis({ analysis }: StrategicAnalysisProps) {
  return (
    <section className="bg-beacon-light-gray py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-beacon-dark-teal mb-12">
          Strategic Analysis
        </h2>

        {/* Strategic Goals */}
        {analysis.strategic_goals.length > 0 && (
          <div className="mb-12">
            <h3 className="text-xs font-mono tracking-widest uppercase text-beacon-medium-gray mb-4">
              Strategic Goals
            </h3>
            <div className="space-y-4">
              {analysis.strategic_goals.map((goal, i) => (
                <Card key={i} className="p-6 border-l-4 border-l-beacon-cyan">
                  <h4 className="font-bold text-beacon-dark-teal">{goal.goal}</h4>
                  <p className="mt-1 text-sm text-beacon-medium-gray leading-relaxed">
                    {goal.relevance}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Innovation Gaps */}
        {analysis.innovation_gaps.length > 0 && (
          <div className="mb-12">
            <h3 className="text-xs font-mono tracking-widest uppercase text-beacon-medium-gray mb-4">
              Innovation Gaps
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {analysis.innovation_gaps.map((gap, i) => (
                <Card key={i} className="p-6">
                  <div className="flex items-start gap-3">
                    <span className="text-beacon-orange text-lg">●</span>
                    <span className="text-beacon-dark-teal font-medium">{gap}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Pain Points */}
        {analysis.pain_points_detected.length > 0 && (
          <div className="mb-12">
            <h3 className="text-xs font-mono tracking-widest uppercase text-beacon-medium-gray mb-4">
              Detected Pain Points
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {analysis.pain_points_detected.map((pain, i) => (
                <Card key={i} className="p-6">
                  <span className="text-beacon-dark-teal text-sm">{pain}</span>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Tech Stack & Active Projects */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {analysis.technologies_detected.length > 0 && (
            <div>
              <h3 className="text-xs font-mono tracking-widest uppercase text-beacon-medium-gray mb-4">
                Tech Stack Detected
              </h3>
              <div className="flex flex-wrap gap-2">
                {analysis.technologies_detected.map((tech, i) => (
                  <TechTag key={i} label={tech} />
                ))}
              </div>
            </div>
          )}

          {analysis.active_projects.length > 0 && (
            <div>
              <h3 className="text-xs font-mono tracking-widest uppercase text-beacon-medium-gray mb-4">
                Active Projects
              </h3>
              <div className="space-y-3">
                {analysis.active_projects.map((project, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                      project.status === 'active' ? 'bg-green-100 text-green-700' :
                      project.status === 'planned' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {project.status}
                    </span>
                    <div>
                      <span className="text-sm font-medium text-beacon-dark-teal">
                        {project.name}
                      </span>
                      {project.description && (
                        <p className="text-xs text-beacon-medium-gray mt-0.5">
                          {project.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
