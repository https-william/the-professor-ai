
import React, { useState } from 'react';
import { QuizState } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface FlashcardViewProps {
  quizState: QuizState;
  onExit: (force?: boolean) => void;
}

export const FlashcardView: React.FC<FlashcardViewProps> = ({ quizState, onExit }) => {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const questions = quizState?.questions || [];
  const currentQ = questions[index];

  const handleDragEnd = (event: any, info: any) => {
    if (info.offset.x > 100) { // Right Swipe
      setIndex(i => i + 1);
      setFlipped(false);
    } else if (info.offset.x < -100) { // Left Swipe
      setIndex(i => i + 1);
      setFlipped(false);
    }
  };

  if (!currentQ) {
      return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6">
              <h3 className="text-xl font-bold text-white mb-2">Session Complete</h3>
              <button onClick={() => onExit(true)} className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold uppercase text-xs">Exit</button>
          </div>
      );
  }

  return (
    <div className="max-w-md mx-auto h-[80vh] flex flex-col relative overflow-hidden">
        <div className="flex justify-between items-center py-4 px-4">
            <button onClick={() => onExit(false)} className="text-gray-400 font-bold text-xs uppercase">Exit</button>
            <div className="text-xs font-mono text-gray-500">{index + 1} / {questions.length}</div>
        </div>

        <div className="flex-1 relative flex items-center justify-center">
            <AnimatePresence>
                <motion.div
                    key={currentQ.id}
                    className="absolute w-full h-[400px] cursor-pointer"
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    onDragEnd={handleDragEnd}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ x: 300, opacity: 0 }}
                    onClick={() => setFlipped(!flipped)}
                    style={{ perspective: 1000 }}
                >
                    <motion.div
                        className="w-full h-full relative preserve-3d transition-transform duration-500"
                        animate={{ rotateY: flipped ? 180 : 0 }}
                        style={{ transformStyle: 'preserve-3d' }}
                    >
                        {/* Front */}
                        <div className="absolute inset-0 backface-hidden bg-[#18181b] border border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-2xl">
                            <h3 className="text-xl font-medium text-white leading-relaxed">{currentQ.question}</h3>
                            <p className="absolute bottom-8 text-[10px] uppercase tracking-widest text-gray-500">Tap to Flip • Swipe to Skip</p>
                        </div>

                        {/* Back */}
                        <div 
                            className="absolute inset-0 backface-hidden bg-[#0f0f11] border border-blue-500/30 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-2xl"
                            style={{ transform: 'rotateY(180deg)' }}
                        >
                            <h3 className="text-xl font-bold text-blue-400 leading-relaxed mb-4">{currentQ.correct_answer}</h3>
                            <p className="text-sm text-gray-400">{currentQ.explanation}</p>
                        </div>
                    </motion.div>
                </motion.div>
            </AnimatePresence>
        </div>
        
        {/* Controls */}
        <div className="h-24 flex items-center justify-center gap-8 pb-4">
            <button onClick={() => { setIndex(i => i + 1); setFlipped(false); }} className="w-14 h-14 rounded-full bg-red-900/20 border border-red-500/30 text-red-500 flex items-center justify-center text-xl">✕</button>
            <button onClick={() => { setIndex(i => i + 1); setFlipped(false); }} className="w-14 h-14 rounded-full bg-green-900/20 border border-green-500/30 text-green-500 flex items-center justify-center text-xl">✓</button>
        </div>
    </div>
  );
};
