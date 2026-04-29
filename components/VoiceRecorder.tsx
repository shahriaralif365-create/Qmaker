"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Volume2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceRecorderProps {
  onTranscriptChange: (transcript: string) => void;
  selectedLanguage: string;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onTranscriptChange, selectedLanguage }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      
      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          onTranscriptChange(finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        if (event.error === 'not-allowed') {
          setError('মাইক্রোফোন ব্যবহারের অনুমতি নেই। অনুগ্রহ করে পারমিশন দিন।');
        } else {
          setError('ভয়েস রেকর্ডিংয়ে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    } else {
      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => {
        setError('আপনার ব্রাউজারটি ভয়েস রেকর্ডিং সাপোর্ট করে না।');
      }, 0);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onTranscriptChange]);

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = selectedLanguage;
    }
  }, [selectedLanguage]);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      setError(null);
      try {
        recognitionRef.current?.start();
        setIsRecording(true);
      } catch (err) {
        console.error('Start error:', err);
        setIsRecording(false);
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-10 flex flex-col items-center">
      <div className="relative mb-6">
        {/* Pulse Animations */}
        {isRecording && (
          <>
            <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-20" />
            <div className="absolute inset-0 bg-emerald-400 rounded-full animate-pulse opacity-40 scale-150" />
          </>
        )}
        
        <button
          onClick={toggleRecording}
          className={cn(
            "relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl",
            isRecording 
              ? "bg-red-500 hover:bg-red-600 scale-110" 
              : "bg-emerald-600 hover:bg-emerald-700 hover:scale-105"
          )}
        >
          {isRecording ? (
            <Square size={32} className="text-white fill-white" />
          ) : (
            <Mic size={32} className="text-white" />
          )}
        </button>
      </div>

      <div className="text-center">
        <p className={cn(
          "text-lg font-bold transition-colors duration-300",
          isRecording ? "text-red-500 animate-pulse" : "text-emerald-800"
        )}>
          {isRecording ? "আমি শুনছি... বলুন" : "ভয়েস দিয়ে প্রশ্ন বলতে এখানে ক্লিক করুন"}
        </p>
        
        {error && (
          <div className="mt-4 flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-xl border border-red-100">
            <AlertCircle size={18} />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}
        
        {!isRecording && !error && (
          <div className="mt-2 flex items-center justify-center gap-2 text-slate-400 text-sm">
            <Volume2 size={14} />
            <span>বাংলা, আরবি ও অন্যান্য ভাষায় কথা বলুন</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceRecorder;