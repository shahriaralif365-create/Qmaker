"use client";

import React from 'react';
import { BookOpen, Layers, Hash, Globe } from 'lucide-react';

interface Config {
  level: string;
  subject: string;
  quantity: number;
  language: string;
}

interface GeneratorUIProps {
  config: Config;
  setConfig: (config: Config) => void;
}

const GeneratorUI: React.FC<GeneratorUIProps> = ({ config, setConfig }) => {
  const levels = ["মক্তব", "৫ম শ্রেণি", "৬ষ্ঠ শ্রেণি", "৭ম শ্রেণি", "৮ম শ্রেণি", "দাওরা হাদীস"];
  const subjects = ["তা'লীমুল ইসলাম", "ফিকহ", "হাদীস", "আকীদাহ", "সীরাত", "কুরআন"];
  const quantities = [5, 8, 10, 12, 15];
  const languages = [
    { code: 'bn-BD', name: 'বাংলা' },
    { code: 'ar-SA', name: 'العربية (আরবি)' },
    { code: 'ur-PK', name: 'اردو (উর্দু)' },
    { code: 'fa-IR', name: 'فارسی (ফার্সি)' },
    { code: 'en-US', name: 'English' },
  ];

  const updateConfig = (key: keyof Config, value: string | number) => {
    setConfig({ ...config, [key]: value });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl mx-auto mb-10">
      {/* Language */}
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm font-bold text-slate-600 ml-1">
          <Globe size={16} className="text-emerald-600" /> ভাষা নির্বাচন
        </label>
        <select 
          value={config.language}
          onChange={(e) => updateConfig('language', e.target.value)}
          className="p-4 bg-white rounded-2xl border-2 border-emerald-50 shadow-sm outline-none focus:border-emerald-500 transition-all font-medium"
        >
          {languages.map(lang => (
            <option key={lang.code} value={lang.code}>{lang.name}</option>
          ))}
        </select>
      </div>

      {/* Level */}
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm font-bold text-slate-600 ml-1">
          <Layers size={16} className="text-emerald-600" /> স্তর/শ্রেণি
        </label>
        <select 
          value={config.level}
          onChange={(e) => updateConfig('level', e.target.value)}
          className="p-4 bg-white rounded-2xl border-2 border-emerald-50 shadow-sm outline-none focus:border-emerald-500 transition-all font-medium"
        >
          {levels.map(l => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </div>

      {/* Subject */}
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm font-bold text-slate-600 ml-1">
          <BookOpen size={16} className="text-emerald-600" /> বিষয়
        </label>
        <select 
          value={config.subject}
          onChange={(e) => updateConfig('subject', e.target.value)}
          className="p-4 bg-white rounded-2xl border-2 border-emerald-50 shadow-sm outline-none focus:border-emerald-500 transition-all font-medium"
        >
          {subjects.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Quantity */}
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm font-bold text-slate-600 ml-1">
          <Hash size={16} className="text-emerald-600" /> প্রশ্নের সংখ্যা
        </label>
        <select 
          value={config.quantity}
          onChange={(e) => updateConfig('quantity', parseInt(e.target.value))}
          className="p-4 bg-white rounded-2xl border-2 border-emerald-50 shadow-sm outline-none focus:border-emerald-500 transition-all font-medium"
        >
          {quantities.map(q => (
            <option key={q} value={q}>{q} টি প্রশ্ন</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default GeneratorUI;
