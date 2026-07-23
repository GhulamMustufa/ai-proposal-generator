"use client";

import { useState } from "react";

export function JobAnalyzerWidget({ jobDescription }: { jobDescription: string }) {
  const [analyzed, setAnalyzed] = useState(false);
  const [keywords, setKeywords] = useState<{ word: string, category: 'tech' | 'soft' | 'bonus' }[]>([]);

  // Simple mock analysis function for demonstration purposes
  function analyzeJob() {
    if (!jobDescription.trim()) return;
    
    const text = jobDescription.toLowerCase();
    const found: { word: string, category: 'tech' | 'soft' | 'bonus' }[] = [];

    // Tech skills
    const techWords = ["react", "node", "typescript", "javascript", "python", "aws", "docker", "sql", "postgres", "graphql", "next.js", "nest.js", "kubernetes", "tailwind", "go", "rust", "php", "ruby"];
    techWords.forEach(word => {
      if (text.includes(word)) found.push({ word, category: 'tech' });
    });

    // Soft skills
    const softWords = ["leadership", "communication", "team", "agile", "scrum", "mentor", "management", "problem-solving", "collaboration", "remote", "autonomous"];
    softWords.forEach(word => {
      if (text.includes(word)) found.push({ word, category: 'soft' });
    });

    // Bonus / Good to have
    const bonusWords = ["bonus", "plus", "nice to have", "good to have", "preferred"];
    const hasBonus = bonusWords.some(w => text.includes(w));
    if (hasBonus) {
      found.push({ word: "has preferred qualifications", category: 'bonus' });
    }

    setKeywords(found);
    setAnalyzed(true);
  }

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/80 sticky top-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Keyword Analyzer
        </h3>
        <button
          onClick={analyzeJob}
          disabled={!jobDescription.trim()}
          className="rounded-lg bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-indigo-500/20 dark:text-indigo-300 dark:hover:bg-indigo-500/30 transition-colors"
        >
          Scan
        </button>
      </div>

      {!analyzed ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Click scan to extract technical and soft skills from the job description. Make sure these keywords appear in your generated proposal!
        </p>
      ) : (
        <div className="space-y-4">
          {keywords.length === 0 ? (
            <p className="text-sm text-slate-500">No common keywords found. You might be aiming for a very niche role!</p>
          ) : (
            <>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-2">Technical Skills Detected:</p>
                <div className="flex flex-wrap gap-2">
                  {keywords.filter(k => k.category === 'tech').map(k => (
                    <span key={k.word} className="px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 text-xs rounded-md font-medium capitalize">
                      {k.word}
                    </span>
                  ))}
                  {keywords.filter(k => k.category === 'tech').length === 0 && (
                    <span className="text-xs text-slate-400 italic">None detected</span>
                  )}
                </div>
              </div>
              
              <div>
                <p className="text-xs font-medium text-slate-500 mb-2">Soft Skills & Requirements:</p>
                <div className="flex flex-wrap gap-2">
                  {keywords.filter(k => k.category === 'soft').map(k => (
                    <span key={k.word} className="px-2 py-1 bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 text-xs rounded-md font-medium capitalize">
                      {k.word}
                    </span>
                  ))}
                  {keywords.filter(k => k.category === 'soft').length === 0 && (
                    <span className="text-xs text-slate-400 italic">None detected</span>
                  )}
                </div>
              </div>

              {keywords.filter(k => k.category === 'bonus').length > 0 && (
                <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-lg border border-amber-200 dark:border-amber-500/20">
                  <p className="text-xs text-amber-700 dark:text-amber-300 font-medium flex items-center gap-2">
                    <span>⭐</span> "Nice to have" qualifications detected!
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
