import { useState } from 'react';
import { ImagePicker } from './components/ImagePicker';
import { ResultModal } from './components/ResultModal';
import { generateTryOn } from './services/geminiService';
import { ImageAsset, ProcessingStatus } from './types';

// Define available poses with their IDs, labels, and prompt instructions
const POSES = [
  { 
    id: 'original', 
    label: 'Original', 
    prompt: 'Maintain the person\'s original pose.' 
  },
  { 
    id: 'hands-hips', 
    label: 'Hand on Hip', 
    prompt: 'Change the person\'s pose to be standing confidently with one hand on their hip.' 
  },
  { 
    id: 'walking', 
    label: 'Walking', 
    prompt: 'Change the person\'s pose to be walking forward confidently like a runway model.' 
  },
  { 
    id: 'crossed-arms', 
    label: 'Arms Crossed', 
    prompt: 'Change the person\'s pose to be standing with arms crossed.' 
  },
];

const App = () => {
  // State
  const [personImage, setPersonImage] = useState<ImageAsset | null>(null);
  const [garmentImage, setGarmentImage] = useState<ImageAsset | null>(null);
  const [selectedPoseId, setSelectedPoseId] = useState<string>('original');
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleGenerate = async () => {
    if (!personImage || !garmentImage) return;

    setStatus(ProcessingStatus.GENERATING);
    setErrorMsg(null);

    // Find the prompt text for the selected pose
    const selectedPoseObj = POSES.find(p => p.id === selectedPoseId) || POSES[0];
    const poseInstruction = selectedPoseObj.prompt;

    try {
      const generatedImageBase64 = await generateTryOn(personImage, garmentImage, poseInstruction);
      setResultImage(generatedImageBase64);
      setStatus(ProcessingStatus.SUCCESS);
      setIsModalOpen(true);
    } catch (error: any) {
      console.error(error);
      setStatus(ProcessingStatus.ERROR);
      
      let message = "Failed to generate try-on. Please try again.";
      
      if (error instanceof Error) {
        message = error.message.replace('GoogleGenAIError:', '').trim();
        
        // Handle Permission/Billing errors specifically (case insensitive)
        const lowerMsg = message.toLowerCase();
        if (lowerMsg.includes("403") || lowerMsg.includes("permission") || lowerMsg.includes("billing")) {
           message = "Service configuration error: The application's API key is invalid or lacks permission. Please contact support.";
        } else if (lowerMsg.includes("unsupported mime type")) {
           message = "One of the images has an unsupported format. Please use standard JPEG or PNG files.";
        }
      }
      
      setErrorMsg(message);
    }
  };

  const handleDownload = () => {
    if (resultImage) {
      const link = document.createElement('a');
      link.href = resultImage;
      link.download = `fitcheck_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const isButtonDisabled = !personImage || !garmentImage || status === ProcessingStatus.GENERATING;

  // Main Application
  return (
    <div className="min-h-screen bg-white text-primary font-sans selection:bg-accent selection:text-white pb-32">
      
      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-screen-md mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-white font-bold text-sm">
              FC
            </div>
            <h1 className="text-xl font-bold tracking-tight">FitCheck</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs font-medium px-2 py-1 bg-gray-100 rounded-md text-secondary">
              PRO
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-screen-md mx-auto px-6 pt-8">
        
        {/* Intro Text */}
        <div className="mb-8 space-y-2">
          <h2 className="text-3xl font-bold">Virtual Try-On</h2>
          <p className="text-secondary text-sm leading-relaxed max-w-sm">
            Upload a full-body photo of yourself and a garment to generate a realistic try-on result.
          </p>
        </div>

        {/* Upload Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Column 1: Person & Pose */}
          <div className="flex flex-col gap-6">
            <ImagePicker 
              label="1. Your Photo" 
              image={personImage} 
              onImageSelected={setPersonImage}
              height="h-80 md:h-96"
            />

            {/* Pose Selector */}
            <div className="flex flex-col gap-3">
              <label className="text-sm font-semibold text-secondary uppercase tracking-wider pl-1">
                Target Pose
              </label>
              <div className="flex flex-wrap gap-2">
                {POSES.map(pose => (
                  <button
                    key={pose.id}
                    onClick={() => setSelectedPoseId(pose.id)}
                    className={`
                      px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border
                      ${selectedPoseId === pose.id 
                        ? 'bg-primary text-white border-primary shadow-lg scale-105' 
                        : 'bg-white text-secondary border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    {pose.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Column 2: Garment */}
          <div className="flex flex-col gap-6">
            <ImagePicker 
              label="2. The Garment" 
              image={garmentImage} 
              onImageSelected={setGarmentImage} 
              height="h-80 md:h-[calc(24rem+96px+1.5rem)]" // Match visual height of first column (img + gap + pose selector approx)
            />
          </div>
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="mt-8 p-4 bg-red-50 text-red-600 text-sm rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="flex flex-col gap-1">
              <span className="font-semibold">Generation Failed</span>
              <span className="break-words opacity-90">{errorMsg}</span>
            </div>
          </div>
        )}

      </main>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent z-30">
        <div className="max-w-screen-md mx-auto">
          <button
            onClick={handleGenerate}
            disabled={isButtonDisabled}
            className={`
              w-full py-4 rounded-full text-lg font-bold shadow-xl transition-all duration-300
              flex items-center justify-center gap-2
              ${isButtonDisabled 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                : 'bg-primary text-white hover:scale-[1.02] active:scale-[0.98]'}
            `}
          >
            {status === ProcessingStatus.GENERATING ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0V6H3a1 1 0 110-2h1V3a1 1 0 011-1zm0 9a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zm7-10a1 1 0 01.707.293l6.414 6.414a1 1 0 01.293.707v5.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 01-.707.293H12a1 1 0 01-1-1v-4.586a1 1 0 01.293-.707l4.293-4.293H12a1 1 0 01-1-1V2z" clipRule="evenodd" />
                </svg>
                Generate Try-On
              </>
            )}
          </button>
        </div>
      </div>

      {/* Result Modal */}
      <ResultModal 
        isOpen={isModalOpen}
        imageUrl={resultImage}
        onClose={() => setIsModalOpen(false)}
        onDownload={handleDownload}
      />

    </div>
  );
};

export default App;