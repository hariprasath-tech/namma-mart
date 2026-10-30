import React, { useState } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useLangStore } from '../../store/lang';

interface VoiceSearchButtonProps {
  onTranscript: (text: string) => void;
  className?: string;
}

export const VoiceSearchButton: React.FC<VoiceSearchButtonProps> = ({
  onTranscript,
  className = '',
}) => {
  const { language } = useLangStore();
  const [isListening, setIsListening] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const startListening = () => {
    // Check SpeechRecognition support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMessage(
        language === 'ta'
          ? 'உங்கள் உலாவியில் குரல் தேடல் ஆதரிக்கப்படவில்லை.'
          : 'Voice search is not supported in this browser.'
      );
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'ta' ? 'ta-IN' : 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsListening(true);
      setErrorMessage(null);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          onTranscript(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setErrorMessage(
            language === 'ta'
              ? 'மைக்ரோஃபோன் அணுகல் மறுக்கப்பட்டது.'
              : 'Microphone permission denied.'
          );
        } else {
          setErrorMessage(
            language === 'ta' ? 'குரல் கேட்கவில்லை, மீண்டும் முயற்சிக்கவும்.' : 'Could not hear voice.'
          );
        }
        setTimeout(() => setErrorMessage(null), 3000);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={startListening}
        className={`p-2 rounded-xl border transition-all flex items-center justify-center cursor-pointer ${
          isListening
            ? 'bg-[#D63A2F] text-white border-[#D63A2F] animate-pulse ring-2 ring-[#D63A2F]/40'
            : 'bg-[#F7F9F4] text-[#0E3B2C] border-[#BDCBB8] hover:bg-[#EEF3EA] active:scale-95'
        } ${className}`}
        title={
          language === 'ta'
            ? 'தமிழில் குரல் மூலம் தேடுங்கள்'
            : 'Search by Voice (Tamil / English)'
        }
        aria-label="Voice Search"
      >
        <Mic className={`w-4 h-4 ${isListening ? 'animate-bounce' : ''}`} />
      </button>

      {/* Floating status or error tooltip */}
      {isListening && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 bg-[#0E3B2C] text-white text-[11px] font-bold px-2.5 py-1 rounded-md shadow-lg whitespace-nowrap border border-[#FFB400] flex items-center gap-1.5 animate-in fade-in">
          <span className="w-2 h-2 rounded-full bg-[#FFB400] animate-ping" />
          <span>{language === 'ta' ? 'பேசுங்கள்...' : 'Listening... (Speak now)'}</span>
        </div>
      )}

      {errorMessage && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 bg-[#D63A2F] text-white text-[10px] font-semibold px-2 py-1 rounded shadow-md whitespace-nowrap">
          {errorMessage}
        </div>
      )}
    </div>
  );
};
