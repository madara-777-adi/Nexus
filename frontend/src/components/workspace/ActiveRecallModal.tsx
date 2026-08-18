import React, { useState } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  HelpCircle,
  Lightbulb,
} from "lucide-react";
import type { Flashcard } from "../../types/ai.types";

interface ActiveRecallModalProps {
  isOpen: boolean;
  subtopicTitle: string;
  cards: Flashcard[];
  onClose: () => void;
}

export const ActiveRecallModal: React.FC<ActiveRecallModalProps> = ({
  isOpen,
  subtopicTitle,
  cards,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (!isOpen || cards.length === 0) return null;

  const currentCard = cards[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const progressPercentage = ((currentIndex + 1) / cards.length) * 100;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-6 bg-[#080A0F]/90 backdrop-blur-xl transition-all duration-300">
      <div className="modal-enter relative w-full max-w-2xl max-h-[92vh] rounded-3xl border border-[#1E2846] bg-[#121620] p-5 sm:p-7 shadow-2xl flex flex-col justify-between">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1E2846] shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neon-lime">
                Active Recall Deck
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-[10px] font-mono text-slate-400">
                Card {currentIndex + 1} of {cards.length}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight line-clamp-1 mt-0.5">
              {subtopicTitle}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl border border-gray-800 bg-[#181B22] text-gray-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3D Interactive Card View */}
        <div
          onClick={() => setIsFlipped((prev) => !prev)}
          className="my-6 w-full aspect-[4/3] sm:aspect-[16/9] perspective-1000 group cursor-pointer select-none"
        >
          <div
            className={`relative w-full h-full transform-style-3d flip-card-inner rounded-2xl shadow-2xl ${
              isFlipped ? "rotate-y-180" : ""
            }`}
          >
            {/* FRONT FACE */}
            <div className="absolute inset-0 backface-hidden glass-panel rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center border-surface-border hover:border-neon-lime/40 transition-colors">
              <div className="absolute top-4 left-4 flex items-center gap-1.5 text-[10px] sm:text-xs font-mono text-gray-400 uppercase tracking-wider">
                <HelpCircle className="w-3.5 h-3.5 text-[#00E5FF]" />
                <span>Prompt / Question</span>
              </div>

              <p className="text-sm sm:text-lg font-medium text-white leading-relaxed max-w-lg break-words">
                {currentCard.front}
              </p>

              <div className="absolute bottom-4 flex items-center gap-1.5 text-[10px] sm:text-xs text-gray-500 bg-[#080A0F]/60 px-3 py-1 rounded-lg border border-surface-border">
                <RotateCw className="w-3 h-3" /> Click anywhere to reveal answer
              </div>
            </div>

            {/* BACK FACE */}
            <div className="absolute inset-0 backface-hidden rotate-y-180 glass-panel rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center border-neon-lime/40 bg-neon-lime/5 shadow-[0_0_30px_rgba(188,255,60,0.05)]">
              <div className="absolute top-4 left-4 flex items-center gap-1.5 text-[10px] sm:text-xs font-mono text-neon-lime uppercase tracking-wider">
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Answer / Takeaway</span>
              </div>

              <p className="text-xs sm:text-base font-medium text-gray-100 leading-relaxed max-w-lg break-words whitespace-pre-wrap">
                {currentCard.back}
              </p>

              <div className="absolute bottom-4 flex items-center gap-1.5 text-[10px] sm:text-xs text-neon-lime/80 bg-[#080A0F]/60 px-3 py-1 rounded-lg border border-neon-lime/30">
                <RotateCw className="w-3 h-3" /> Click to flip back
              </div>
            </div>
          </div>
        </div>

        {/* Footer Navigation & Mastery Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#1E2846] shrink-0">
          <div className="w-full sm:w-48 space-y-1">
            <div className="flex justify-between text-[10px] font-mono text-gray-500">
              <span>Deck Progress</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full h-1.5 bg-[#080A0F] rounded-full overflow-hidden">
              <div
                className="h-full bg-neon-lime transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handlePrev}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-2 rounded-xl border border-gray-800 bg-[#181B22] text-xs font-medium text-gray-300 hover:border-gray-700 hover:text-white transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <button
              onClick={handleNext}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-4 py-2 rounded-xl bg-neon-lime hover:bg-[#aef525] text-midnight text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-md shadow-neon-lime/10"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
