"use client";

import React from 'react';
import { Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
}

const TextInput: React.FC<TextInputProps> = ({ value, onChange, language }) => {
  const isRTL = ['ar-SA', 'ur-PK', 'fa-IR'].includes(language);

  return (
    <div className="w-full max-w-4xl mx-auto mb-10">
      <div className="flex items-center gap-2 mb-3 text-emerald-800 font-bold ml-2">
        <Edit3 size={20} />
        <span>আপনি যা বলেছেন (এডিট করতে পারেন):</span>
      </div>
      <div className="relative group">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          dir={isRTL ? 'rtl' : 'ltr'}
          placeholder="এখানে আপনার প্রশ্ন লিখুন বা ভয়েস দিয়ে বলুন..."
          className={cn(
            "w-full min-h-[150px] p-6 text-xl rounded-3xl border-2 border-emerald-100 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all resize-none shadow-inner bg-white/50",
            isRTL ? "font-amiri arabic-text" : "font-noto-bn"
          )}
        />
        <div className="absolute bottom-4 right-4 text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
          {value.length} অক্ষর
        </div>
      </div>
    </div>
  );
};

export default TextInput;
