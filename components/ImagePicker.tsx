import { useRef, ChangeEvent, FC } from 'react';
import { ImageAsset } from '../types';

interface ImagePickerProps {
  label: string;
  image: ImageAsset | null;
  onImageSelected: (asset: ImageAsset) => void;
  height?: string;
}

export const ImagePicker: FC<ImagePickerProps> = ({ 
  label, 
  image, 
  onImageSelected,
  height = "h-64"
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDivClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Gemini API Supported Types: PNG, JPEG, WEBP, HEIC, HEIF
      // Explicitly unsupported: AVIF
      const supportedMimeTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif'];
      
      // Check MIME type if available
      const isMimeValid = supportedMimeTypes.includes(file.type);
      
      // Fallback: Check extension if MIME type is generic or empty (sometimes happens on mobile)
      const fileName = file.name.toLowerCase();
      const isExtensionValid = /\.(jpg|jpeg|png|webp|heic|heif)$/.test(fileName);

      if (!isMimeValid && !isExtensionValid) {
        alert(`Unsupported file format. Please upload a JPEG, PNG, or WEBP image.\n\nDetected: ${file.type || 'Unknown'}`);
        // Reset input so user can select again
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Extract base64 raw string (remove data:image/xyz;base64, prefix)
        const base64Data = result.split(',')[1];
        
        onImageSelected({
          uri: result, // Full data URI for display
          base64: base64Data, // Raw base64 for API
          mimeType: file.type || 'image/jpeg' // Default to jpeg if type is missing but extension passed
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full flex flex-col gap-2">
      <label className="text-sm font-semibold text-secondary uppercase tracking-wider pl-1">
        {label}
      </label>
      
      <div 
        onClick={handleDivClick}
        className={`
          relative w-full ${height} rounded-3xl overflow-hidden cursor-pointer 
          transition-all duration-300 border-2 border-dashed
          ${image ? 'border-transparent shadow-lg' : 'border-gray-300 hover:border-gray-400 bg-surface'}
        `}
      >
        <input 
          type="file" 
          accept="image/png, image/jpeg, image/webp, image/heic, image/heif" 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleFileChange}
        />

        {image ? (
          <img 
            src={image.uri} 
            alt={label} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm font-medium">Tap to upload</span>
          </div>
        )}

        {image && (
          <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-sm z-10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};