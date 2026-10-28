import { useState } from 'react';

interface OnboardingProps {
  onComplete: (name: string) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');

  const steps = [
    {
      title: "Hi there! I'm Romo 🦦",
      content: "Your friendly otter companion here to help you build better habits, track your wellness, and find joy in the little things!",
      emoji: "🦦"
    },
    {
      title: "What can I help with?",
      content: "I can help you track your daily mood, set goals, plan meals, track hobbies, monitor sleep, and so much more!",
      emoji: "✨"
    },
    {
      title: "Let's get started!",
      content: "First, what should I call you?",
      emoji: "💛"
    }
  ];

  const currentStep = steps[step];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete(name || 'Friend');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-teal-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center transform transition-all duration-500">
          {/* Otter mascot */}
          <div className="text-7xl mb-6 animate-bounce">
            {currentStep.emoji}
          </div>
          
          <h1 className="text-2xl font-bold text-amber-900 mb-3">
            {currentStep.title}
          </h1>
          
          <p className="text-gray-600 mb-8 leading-relaxed">
            {currentStep.content}
          </p>

          {step === 2 && (
            <div className="mb-6">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name..."
                className="w-full px-4 py-3 rounded-xl border-2 border-amber-200 focus:border-amber-400 focus:outline-none text-center text-lg"
                autoFocus
              />
            </div>
          )}

          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-6">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  i === step ? 'bg-amber-500 w-6' : i < step ? 'bg-amber-300' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-amber-600 hover:to-orange-600 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-amber-200"
          >
            {step === steps.length - 1 ? "Let's Go! 🎉" : 'Next →'}
          </button>

          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="mt-3 text-gray-400 hover:text-gray-600 text-sm"
            >
              ← Back
            </button>
          )}
        </div>

        <p className="text-center text-gray-400 text-sm mt-4">
          ROMO v2.0 — Your Wellness Companion
        </p>
      </div>
    </div>
  );
}
