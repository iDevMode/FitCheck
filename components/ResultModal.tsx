import { FC } from 'react';

interface ResultModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  onClose: () => void;
  onDownload: () => void;
}

export const ResultModal: FC<ResultModalProps> = ({ isOpen, imageUrl, onClose, onDownload }) => {
  if (!isOpen || !imageUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/40 to-transparent">
          <button 
            onClick={onClose}
            className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 bg-gray-100 overflow-hidden relative">
           <img 
            src={imageUrl} 
            alt="FitCheck Result" 
            className="w-full h-full object-contain bg-black"
          />
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-white space-y-3">
          <button 
            onClick={onDownload}
            className="w-full py-4 bg-primary text-white text-lg font-bold rounded-full shadow-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Save to Gallery
          </button>
          <button 
            onClick={onClose}
            className="w-full py-3 text-secondary font-medium hover:text-primary transition-colors"
          >
            Try Another Outfit
          </button>
        </div>
      </div>
    </div>
  );
};