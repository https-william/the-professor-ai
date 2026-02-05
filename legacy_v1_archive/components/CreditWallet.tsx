
import React, { useEffect, useState } from 'react';

interface CreditWalletProps {
  balance: number;
  onClick: () => void;
  className?: string;
}

export const CreditWallet: React.FC<CreditWalletProps> = ({ balance, onClick, className = "" }) => {
  const [displayBalance, setDisplayBalance] = useState(balance);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (balance !== displayBalance) {
      setAnimate(true);
      const timer = setTimeout(() => {
          setDisplayBalance(balance);
          setAnimate(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [balance, displayBalance]);

  return (
    <button 
        onClick={onClick}
        className={`group relative flex items-center gap-2 bg-black/20 hover:bg-black/40 border border-white/10 hover:border-amber-500/50 rounded-full pl-1 pr-4 py-1 transition-all duration-300 ${className}`}
        title="Neural Tokens Balance"
    >
        <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-900/20 group-hover:scale-110 transition-transform ${animate ? 'animate-pulse' : ''}`}>
            {/* Custom Prism SVG */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white">
                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" className="hidden" />
                <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-2.625 6c-.54 0-.828.419-.936.634a6.953 6.953 0 00-.3 2.035c0 1.07.329 1.734.936 2.159.407.285 1.022.422 1.838.422.816 0 1.431-.137 1.838-.422.607-.425.936-1.089.936-2.159 0-.853-.18-1.579-.3-2.035-.108-.215-.396-.634-.936-.634h-3.072zm6.225 0c-.54 0-.828.419-.936.634-.12.241-.3 1.182-.3 2.035 0 1.07.329 1.734.936 2.159.407.285 1.022.422 1.838.422.816 0 1.431-.137 1.838-.422.607-.425.936-1.089.936-2.159 0-.853-.18-1.579-.3-2.035-.108-.215-.396-.634-.936-.634h-3.072z" clipRule="evenodd" className="hidden" />
                {/* Real Prism Path */}
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
        </div>
        
        <div className="flex flex-col items-start">
            <span className={`font-mono font-bold text-sm text-white transition-colors ${animate ? 'text-amber-400' : ''}`}>
                {balance.toLocaleString()}
            </span>
            <span className="text-[8px] font-bold text-gray-500 uppercase tracking-wider group-hover:text-amber-500/80 transition-colors">
                Credits
            </span>
        </div>

        {/* Add Button Visual Hint */}
        <div className="w-4 h-4 bg-white/10 rounded-full flex items-center justify-center text-[10px] text-gray-400 ml-2 group-hover:bg-amber-500 group-hover:text-black transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
        </div>
    </button>
  );
};
