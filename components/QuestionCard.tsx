"use client";

import React, { useRef } from 'react';
import { Printer, Download, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';

interface QuestionCardProps {
  content: string;
  language: string;
  title: string;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ content, language, title }) => {
  const [copied, setCopied] = React.useState(false);
  const isRTL = ['ar-SA', 'ur-PK', 'fa-IR'].includes(language);
  const printRef = useRef<HTMLDivElement>(null);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    // Simplified PDF generation for now, jspdf needs special fonts for Bengali/Arabic
    doc.text(content, 10, 10);
    doc.save('question-paper.pdf');
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-12 mb-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black text-emerald-900">প্রশ্নপত্র প্রিভিউ</h2>
        <div className="flex gap-3">
          <button onClick={copyToClipboard} className="p-3 bg-white hover:bg-emerald-50 rounded-xl border border-emerald-100 shadow-sm transition-all text-emerald-700">
            {copied ? <Check size={20} /> : <Copy size={20} />}
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 px-5 py-3 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-xl font-bold transition-all">
            <Printer size={20} /> প্রিন্ট
          </button>
          <button onClick={downloadPDF} className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all">
            <Download size={20} /> ডাউনলোড
          </button>
        </div>
      </div>

      <div 
        ref={printRef}
        dir={isRTL ? 'rtl' : 'ltr'}
        className={cn(
          "islamic-card p-12 min-h-[800px] relative overflow-hidden",
          isRTL ? "font-amiri arabic-text" : "font-noto-bn"
        )}
      >
        {/* Background Decorative Element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -ml-32 -mb-32 opacity-50" />

        <div className="relative z-10">
          <div className="text-center mb-12 border-b-2 border-emerald-100 pb-8">
            <h1 className="text-4xl font-black text-emerald-900 mb-2 uppercase tracking-wide">
              {title || "মাদ্রাসা প্রশ্নপত্র"}
            </h1>
            <p className="text-emerald-600 font-bold tracking-widest opacity-80 uppercase">بسم الله الرحمن الرحيم</p>
          </div>

          <div className="whitespace-pre-wrap text-xl leading-loose text-slate-800">
            {content}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionCard;
