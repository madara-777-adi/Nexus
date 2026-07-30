import React, { useState } from "react";
import { X, ChevronLeft, ChevronRight, RotateCw } from "lucide-react";

export interface Flashcard {
  _id?: string;
  front: string;
  back: string;
}

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl bg-[#080A0F]/80 transition-all duration-300">
      <div className="relative w-full max-w-2xl rounded-2xl border border-gray-800 bg-[#12141A] p-6 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-800">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#BCFF3C]">
              Active Recall Deck
            </span>
            <h3 className="text-lg font-medium text-white tracking-tight">
              {subtopicTitle}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 3D Interactive Card View */}
        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className="group relative min-h-[260px] w-full cursor-pointer rounded-xl border border-gray-800 bg-[#181B22] p-8 flex flex-col items-center justify-center text-center transition-all duration-300 hover:border-[#BCFF3C]/40 hover:shadow-[0_0_20px_rgba(188,255,60,0.05)]"
        >
          <div className="absolute top-4 left-4 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            <RotateCw className="h-3 w-3" />
            <span>{isFlipped ? "Answer / Takeaway" : "Prompt / Question"}</span>
          </div>

          <p className="text-lg leading-relaxed font-medium text-gray-100 max-w-xl">
            {isFlipped ? currentCard.back : currentCard.front}
          </p>

          <span className="absolute bottom-4 text-xs text-gray-500 group-hover:text-gray-400">
            Click anywhere to flip
          </span>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-800">
          <span className="text-xs font-mono text-gray-500">
            Card {currentIndex + 1} of {cards.length}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="flex items-center gap-1 rounded-lg border border-gray-800 bg-[#181B22] px-3 py-1.5 text-xs font-medium text-gray-300 hover:border-gray-700 hover:text-white transition-all"
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>
            <button
              onClick={handleNext}
              className="flex items-center gap-1 rounded-lg border border-gray-800 bg-[#181B22] px-3 py-1.5 text-xs font-medium text-gray-300 hover:border-gray-700 hover:text-white transition-all"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};