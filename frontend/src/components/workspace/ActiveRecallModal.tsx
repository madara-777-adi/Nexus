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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-xl bg-[#080A0F]/90 transition-all duration-300">
      <div className="relative w-full max-w-2xl rounded-2xl border border-gray-800 bg-[#12141A] p-4 sm:p-6 shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 mb-4 sm:mb-6 border-b border-gray-800 shrink-0">
          <div>
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-[#BCFF3C]">
              Active Recall Deck
            </span>
            <h3 className="text-base sm:text-lg font-medium text-white tracking-tight line-clamp-1">
              {subtopicTitle}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 3D Interactive Card View */}
        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className="group relative flex-1 min-h-[300px] sm:min-h-[260px] w-full cursor-pointer rounded-xl border border-gray-800 bg-[#181B22] p-5 sm:p-8 flex flex-col items-center justify-center text-center transition-all duration-300 hover:border-[#BCFF3C]/40 hover:shadow-[0_0_20px_rgba(188,255,60,0.05)] overflow-y-auto"
        >
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            <RotateCw className="h-3 w-3" />
            <span>{isFlipped ? "Answer / Takeaway" : "Prompt / Question"}</span>
          </div>

          <div className="w-full h-full flex items-center justify-center py-8">
            <p className="text-sm sm:text-lg leading-relaxed font-medium text-gray-100 max-w-xl break-words whitespace-pre-wrap">
              {isFlipped ? currentCard.back : currentCard.front}
            </p>
          </div>

          <span className="absolute bottom-3 sm:bottom-4 text-[10px] sm:text-xs text-gray-500 group-hover:text-gray-400 bg-[#181B22]/80 px-2 py-1 rounded">
            Tap anywhere to flip
          </span>
        </div>

        {/* Footer Navigation */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0 mt-4 sm:mt-6 pt-4 border-t border-gray-800 shrink-0">
          <span className="text-xs font-mono text-gray-500 order-2 sm:order-1">
            Card {currentIndex + 1} of {cards.length}
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto order-1 sm:order-2">
            <button
              onClick={handlePrev}
              className="flex flex-1 sm:flex-none justify-center items-center gap-1 rounded-lg border border-gray-800 bg-[#181B22] px-3 py-2 sm:py-1.5 text-xs font-medium text-gray-300 hover:border-gray-700 hover:text-white transition-all cursor-pointer min-h-[44px]"
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>
            <button
              onClick={handleNext}
              className="flex flex-1 sm:flex-none justify-center items-center gap-1 rounded-lg border border-gray-800 bg-[#181B22] px-3 py-2 sm:py-1.5 text-xs font-medium text-gray-300 hover:border-gray-700 hover:text-white transition-all cursor-pointer min-h-[44px]"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};