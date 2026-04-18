import React, { useState } from 'react';

interface Question {
  id: string;
  text: string;
  description?: string;
  options: {
    label: string;
    value: string;
    points: { iris: number; fcare: number };
  }[];
}

const questions: Question[] = [
  {
    id: 'employer_authority',
    text: 'Do you want to be the employer for your workers?',
    description: 'This includes hiring, training, and supervising the people who provide your care.',
    options: [
      { label: 'Yes, I want to manage my own employees', value: 'yes', points: { iris: 5, fcare: 0 } },
      { label: 'No, I prefer an agency to manage staff', value: 'no', points: { iris: 0, fcare: 5 } },
      { label: 'I am undecided', value: 'undecided', points: { iris: 2, fcare: 2 } },
    ],
  },
  {
    id: 'budget_authority',
    text: 'How involved do you want to be in managing your funding?',
    description: 'IRIS gives you a fixed monthly budget to manage. Family Care is service-authorized.',
    options: [
      { label: 'I want full control over how my budget is spent', value: 'high', points: { iris: 5, fcare: 0 } },
      { label: 'I prefer a team-based approach with authorized services', value: 'low', points: { iris: 0, fcare: 5 } },
    ],
  },
  {
    id: 'residency',
    text: 'Where are you interested in living?',
    options: [
      { label: 'In my own home or apartment', value: 'home', points: { iris: 3, fcare: 3 } },
      { label: 'Assisted Living, Residential Care (CBRF), or Nursing Home', value: 'facility', points: { iris: 0, fcare: 5 } },
    ],
  },
  {
    id: 'coordination',
    text: 'How often do you want check-ins from your care team?',
    options: [
      { label: 'Only as needed or once a month', value: 'low_touch', points: { iris: 5, fcare: 1 } },
      { label: 'Regularly, with a dedicated team (Nurse/Social Worker)', value: 'managed', points: { iris: 0, fcare: 5 } },
    ],
  },
];

interface Props {
  onComplete: (recommendation: 'IRIS' | 'Family Care', score: { iris: number; fcare: number }) => void;
  onCancel: () => void;
}

export const CounselingAdvisorWizard: React.FC<Props> = ({ onComplete, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { iris: number; fcare: number }>>({});

  const handleSelect = (points: { iris: number; fcare: number }) => {
    const updatedAnswers = { ...answers, [questions[currentStep].id]: points };
    setAnswers(updatedAnswers);

    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Calculate final
      const finalScore = Object.values(updatedAnswers).reduce(
        (acc, curr) => ({ iris: acc.iris + curr.iris, fcare: acc.fcare + curr.fcare }),
        { iris: 0, fcare: 0 }
      );
      const rec = finalScore.iris >= finalScore.fcare ? 'IRIS' : 'Family Care';
      onComplete(rec, finalScore);
    }
  };

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-emerald-400">Step {currentStep + 1} of {questions.length}</span>
          <button onClick={onCancel} className="text-slate-400 hover:text-white transition-colors">Cancel</button>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div 
            className="bg-emerald-500 h-full transition-all duration-500 ease-out"
            style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">{questions[currentStep].text}</h2>
          {questions[currentStep].description && (
            <p className="text-slate-400">{questions[currentStep].description}</p>
          )}
        </div>

        <div className="grid gap-4">
          {questions[currentStep].options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(opt.points)}
              className="group relative p-6 bg-slate-800/50 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/50 rounded-2xl text-left transition-all hover:scale-[1.02]"
            >
              <span className="block text-lg font-semibold text-white group-hover:text-emerald-400 transition-colors">
                {opt.label}
              </span>
            </button>
          ))}
        </div>

        {currentStep > 0 && (
          <button 
            onClick={() => setCurrentStep(currentStep - 1)}
            className="text-slate-400 hover:text-white flex items-center gap-2 mt-4"
          >
            ← Back
          </button>
        )}
      </div>
    </div>
  );
};
