"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Mic, MicOff, Plus, Trash2, Download, Printer, Upload,
  ChevronRight, Eye, Edit3, Globe, Save, FileText, RotateCcw, AlertTriangle, X,
  AlignLeft, AlignCenter, AlignRight, AlignJustify
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';


// --- Types ---
interface SubQuestion {
  id: string;
  text: string;
  fontSize?: number;
  isBold?: boolean;
  isUnderline?: boolean;
  isOverline?: boolean;
  manualLabel?: string;
  alignment?: 'left' | 'center' | 'right' | 'justify';
}

interface Question {
  id: string;
  text: string;
  subQuestions: SubQuestion[];
  fontSize?: number;
  isBold?: boolean;
  isUnderline?: boolean;
  isOverline?: boolean;
  isPageBreak?: boolean;
  alignment?: 'left' | 'center' | 'right' | 'justify';
}

interface HeaderField {
  id: string;
  label: string;
  value: string;
}

interface HeaderData {
  madrasaName: string;
  examTitle: string;
  fields: HeaderField[];
}

type Language = 'bn-BD' | 'ar-SA' | 'en-US' | 'ur-PK' | 'fa-IR';

// --- Translations ---
const translations = {
  'bn-BD': {
    title: 'সহজ প্রশ্ন',
    madrasaName: 'মাদ্রাসার নাম',
    examTitle: 'পরীক্ষার নাম',
    subject: 'বিষয়',
    class: 'জামাত',
    date: 'তারিখ',
    time: 'সময়',
    fullMarks: 'পূর্ণমান',
    addQuestion: 'প্রশ্ন যোগ করুন',
    addSubQuestion: 'উপ-প্রশ্ন যোগ করুন',
    question: 'প্রশ্ন',
    subQuestion: 'উপ-প্রশ্ন',
    preview: 'প্রিভিউ',
    edit: 'এডিট',
    downloadPDF: 'PDF ডাউনলোড',
    downloadWord: 'Word ডাউনলোড',
    print: 'প্রিন্ট',
    saveDraft: 'ড্রাফট সেভ করুন',
    placeholderQuestion: 'এখানে প্রশ্ন লিখুন...',
    placeholderSubQuestion: 'উপ-প্রশ্ন লিখুন...',
    voiceStart: 'কথা বলা শুরু করুন...',
    voiceStop: 'রেকর্ডিং বন্ধ',
    reset: 'রিসেট',
    resetConfirm: 'আপনি কি নিশ্চিত যে আপনি সবকিছু মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা যাবে না।',
    addPageBreak: 'নতুন পেজ যোগ করুন',
  },
  'ar-SA': {
    title: 'سؤال سهل',
    madrasaName: 'اسم المدرسة',
    examTitle: 'عنوان الامتحان',
    subject: 'المادة',
    class: 'الصف',
    date: 'التاريخ',
    time: 'الوقت',
    fullMarks: 'الدرجة الكاملة',
    addQuestion: 'إضافة سؤال',
    addSubQuestion: 'إضافة سؤال فرعي',
    question: 'السؤال',
    subQuestion: 'سؤال فرعي',
    preview: 'معاينة',
    edit: 'تعديل',
    downloadPDF: 'تحميل PDF',
    downloadWord: 'تحميل Word',
    print: 'طباعة',
    saveDraft: 'حفظ المسودة',
    placeholderQuestion: 'اكتب السؤال هنا...',
    placeholderSubQuestion: 'اكتب السؤال الفرعي هنا...',
    voiceStart: 'ابدأ التحدث...',
    voiceStop: 'إيقاف التسجيل',
  },
  'en-US': {
    title: 'Easy Question',
    madrasaName: 'Madrasa Name',
    examTitle: 'Exam Title',
    subject: 'Subject',
    class: 'Class/Jamaat',
    date: 'Date',
    time: 'Time',
    fullMarks: 'Full Marks',
    addQuestion: 'Add Question',
    addSubQuestion: 'Add Sub-Question',
    question: 'Question',
    subQuestion: 'Sub-Question',
    preview: 'Preview',
    edit: 'Edit',
    downloadPDF: 'Download PDF',
    downloadWord: 'Download Word',
    print: 'Print',
    saveDraft: 'Save Draft',
    placeholderQuestion: 'Enter question here...',
    placeholderSubQuestion: 'Enter sub-question here...',
    voiceStart: 'Start speaking...',
    voiceStop: 'Stop recording',
  },
  'ur-PK': {
    title: 'آسان سوال',
    madrasaName: 'مدرسہ کا نام',
    examTitle: 'امتحان کا عنوان',
    subject: 'مضمون',
    class: 'جماعت',
    date: 'تاریخ',
    time: 'وقت',
    fullMarks: 'کل نمبر',
    addQuestion: 'سوال شامل کریں',
    addSubQuestion: 'ذیلی سوال شامل کریں',
    question: 'سوال',
    subQuestion: 'ذیلی سوال',
    preview: 'معائنہ',
    edit: 'ترمیم',
    downloadPDF: 'پی ڈی ایف ڈاؤن لوڈ',
    downloadWord: 'ورڈ ڈاؤن لوڈ',
    print: 'پرنٹ',
    saveDraft: 'ڈرافٹ محفوظ کریں',
    placeholderQuestion: 'یہاں سوال لکھیں...',
    placeholderSubQuestion: 'ذیلی سوال یہاں لکھیں...',
    voiceStart: 'بولنا شروع کریں...',
    voiceStop: 'ریکارڈنگ بند کریں',
  },
  'fa-IR': {
    title: 'سوال‌ساز مدرسه',
    madrasaName: 'نام مدرسه',
    examTitle: 'عنوان امتحان',
    subject: 'درس',
    class: 'کلاس',
    date: 'تاریخ',
    time: 'زمان',
    fullMarks: 'نمره کامل',
    addQuestion: 'افزودن سوال',
    addSubQuestion: 'افزودن زیرسوال',
    question: 'سوال',
    subQuestion: 'زیرسوال',
    preview: 'پیش‌نمایش',
    edit: 'ویرایش',
    downloadPDF: 'دانلود PDF',
    downloadWord: 'دانلود Word',
    print: 'چاپ',
    saveDraft: 'ذخیره پیش‌نویس',
    placeholderQuestion: 'سوال را اینجا وارد کنید...',
    placeholderSubQuestion: 'زیرسوال را اینجا وارد کنید...',
    voiceStart: 'شروع به صحبت کنید...',
    voiceStop: 'توقف ضبط',
  }
};

const JAMAAT_LIST = [
  'মক্তব', 'নুরানী', 'নাজেরা', 'হিফজ', 'ইবতেদায়ী', 'মিজান', 'নাহবেমীর', 
  'হেদায়াতুন্নাহু', 'কাফিয়া', 'শরহে জামী', 'শরহে বেকায়া', 'জালালাইন', 
  'মিশকাত', 'দাওরায়ে হাদীস', 'তাকমীল', 'ফযীলত', 'সানাবিয়্যাহ খাসসাহ', 
  'সানাবিয়্যাহ আম্মাহ', 'মুতাওয়াসসিতাহ'
];

const EXAM_LIST = [
  '১ম সাময়িক পরীক্ষা', '২য় সাময়িক পরীক্ষা', 'বার্ষিক পরীক্ষা', 
  'সাপ্তাহিক পরীক্ষা', 'মাসিক পরীক্ষা', 'নির্বাচনী পরীক্ষা', 
  'কেন্দ্রীয় পরীক্ষা', 'অর্ধ-বার্ষিক পরীক্ষা'
];

const DEFAULT_HEADER: HeaderData = {
  madrasaName: 'জামিয়া ইবনে আব্বাস (রা.) সামান্তপুর',
  examTitle: '',
  fields: [
    { id: 'subject', label: 'বিষয়', value: '' },
    { id: 'class', label: 'জামাত', value: '' },
    { id: 'date', label: 'তারিখ', value: '' },
    { id: 'time', label: 'সময়', value: '' },
    { id: 'fullMarks', label: 'পূর্ণমান', value: '' },
  ],
};

// --- Components ---
const EditableText = ({ 
  value, 
  onChange, 
  onFocus, 
  onBlur,
  className, 
  style, 
  placeholder,
  ...props 
}: any) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && document.activeElement !== ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || '';
    }
  }, [value]);

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onInput={(e) => onChange(e.currentTarget.innerHTML)}
      onFocus={onFocus}
      onBlur={(e) => {
        onChange(e.currentTarget.innerHTML);
        if (onBlur) onBlur(e);
      }}
      className={className}
      style={style}
      data-placeholder={placeholder}
      {...props}
    />
  );
};

export default function Home() {
  // --- Translations & Helpers ---
  const [paperLang, setPaperLang] = useState<Language>('bn-BD');
  const t = translations[paperLang];
  const uiT = translations['bn-BD'];
  const isRTL = paperLang === 'ar-SA' || paperLang === 'ur-PK' || paperLang === 'fa-IR';

  // --- State ---
  const [lang, setLang] = useState<Language>('bn-BD');
  const [voiceLang, setVoiceLang] = useState<Language>('bn-BD');
  const [header, setHeader] = useState<HeaderData>(DEFAULT_HEADER);
  const [headerHtml, setHeaderHtml] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [view, setView] = useState<'edit' | 'preview'>('edit');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [activeField, setActiveField] = useState<{
    id: string;
    type: 'header' | 'question' | 'subquestion';
    fieldName?: 'madrasaName' | 'examTitle' | 'dynamic';
    fieldId?: string;
    qId?: string;
  } | null>(null);

  // --- Helper Functions for Formatting State ---
  const isFormatActive = (format: 'bold' | 'underline' | 'overline') => {
    if (typeof document === 'undefined') return false;
    
    // For rich editor, use browser command state if focused
    if (activeField?.id === 'headerEditor') {
      if (format === 'bold') return document.queryCommandState('bold');
      if (format === 'underline') return document.queryCommandState('underline');
      if (format === 'overline') {
        // queryCommandState doesn't work for overline, check selection
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          let node: Node | null = selection.anchorNode;
          while (node && node !== headerEditorRef.current) {
            if (node instanceof HTMLElement && node.style.textDecoration.includes('overline')) return true;
            node = node.parentNode;
          }
        }
        return false;
      }
    }

    if (!activeField) return false;
    const { id, type, fieldName, fieldId, qId } = activeField;
    const key = fieldName === 'dynamic' ? (fieldId || '') : (fieldName || '');
    
    if (type === 'header') {
      if (format === 'bold') return !!headerWeights[key];
      if (format === 'underline') return !!headerUnderlines[key];
      if (format === 'overline') return !!headerOverlines[key];
    }
    
    if (type === 'question') {
      const q = questions.find(q => q.id === id);
      if (format === 'bold') return !!q?.isBold;
      if (format === 'underline') return !!q?.isUnderline;
      if (format === 'overline') return !!q?.isOverline;
    }
    
    if (type === 'subquestion' && qId) {
      const q = questions.find(q => q.id === qId);
      const sq = q?.subQuestions.find(sq => sq.id === id);
      if (format === 'bold') return !!sq?.isBold;
      if (format === 'underline') return !!sq?.isUnderline;
      if (format === 'overline') return !!sq?.isOverline;
    }
    return false;
  };

  const getAlignmentActive = () => {
    if (typeof document === 'undefined') return isRTL ? 'right' : 'left';

    // For rich editor, use browser command state if focused
    if (activeField?.id === 'headerEditor') {
      if (document.queryCommandState('justifyCenter')) return 'center';
      if (document.queryCommandState('justifyRight')) return 'right';
      if (document.queryCommandState('justifyFull')) return 'justify';
      if (document.queryCommandState('justifyLeft')) return 'left';
      // Default to center for header editor if nothing else set
      return 'center';
    }

    if (!activeField) return isRTL ? 'right' : 'left';
    const { id, type, fieldName, fieldId, qId } = activeField;
    const key = fieldName === 'dynamic' ? (fieldId || '') : (fieldName || '');
    
    if (type === 'header') return headerAlignments[key] || 'center';
    if (type === 'question') return questions.find(q => q.id === id)?.alignment || (isRTL ? 'right' : 'left');
    if (type === 'subquestion' && qId) return questions.find(q => q.id === qId)?.subQuestions.find(sq => sq.id === id)?.alignment || (isRTL ? 'right' : 'left');
    
    return isRTL ? 'right' : 'left';
  };
  const activeFieldRef = useRef<any>(null);
  const voiceLangRef = useRef<Language>('bn-BD');
  const isRecordingRef = useRef<boolean>(false);
  const [headerSizes, setHeaderSizes] = useState<Record<string, number>>({});
  const [headerBaseFontSize, setHeaderBaseFontSize] = useState<number>(24);
  const [headerWeights, setHeaderWeights] = useState<Record<string, boolean>>({});
  const [headerUnderlines, setHeaderUnderlines] = useState<Record<string, boolean>>({});
  const [headerOverlines, setHeaderOverlines] = useState<Record<string, boolean>>({});
  const [headerAlignments, setHeaderAlignments] = useState<Record<string, 'left' | 'center' | 'right' | 'justify'>>({});
  const [isClient, setIsClient] = useState(false);
  const [isWideScreen, setIsWideScreen] = useState(true);
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm?: () => void;
    type: 'alert' | 'confirm';
  }>({ isOpen: false, title: '', message: '', type: 'alert' });


  // --- Refs ---
  const previewRef = useRef<HTMLDivElement>(null);
  const headerEditorRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // --- Word Paste Sanitizer ---
  const sanitizeWordHtml = (html: string): string => {
    // Remove XML declarations and processing instructions
    let clean = html.replace(/<\?xml[^>]*>/gi, '');
    // Remove MS Office conditional comments
    clean = clean.replace(/<!--\[if[^\]]*\]>[\s\S]*?<!\[endif\]-->/gi, '');
    clean = clean.replace(/<!--[\s\S]*?-->/g, '');
    // Remove Office namespace tags (o:p, w:sdt, etc.)
    clean = clean.replace(/<\/?o:[^>]*>/gi, '');
    clean = clean.replace(/<\/?w:[^>]*>/gi, '');
    clean = clean.replace(/<\/?m:[^>]*>/gi, '');
    clean = clean.replace(/<\/?v:[^>]*>/gi, '');
    // Remove class attributes with Mso prefixes but keep other classes
    clean = clean.replace(/\s*class="[^"]*Mso[^"]*"/gi, '');
    // Remove lang attributes
    clean = clean.replace(/\s*lang="[^"]*"/gi, '');
    // Clean up style attributes - keep useful ones
    clean = clean.replace(/style="([^"]*)"/gi, (match, styles) => {
      const allowedProps = [
        'font-size', 'font-weight', 'font-style', 'font-family',
        'text-align', 'text-decoration', 'text-indent',
        'color', 'background-color', 'background',
        'margin', 'margin-top', 'margin-bottom', 'margin-left', 'margin-right',
        'padding', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right',
        'border', 'border-top', 'border-bottom', 'border-left', 'border-right',
        'border-collapse', 'border-spacing',
        'width', 'height', 'min-width', 'min-height',
        'line-height', 'letter-spacing',
        'vertical-align', 'direction'
      ];
      const filtered = styles
        .split(';')
        .map((s: string) => s.trim())
        .filter((s: string) => {
          if (!s) return false;
          const prop = s.split(':')[0]?.trim().toLowerCase();
          return allowedProps.some(a => prop === a);
        })
        .join('; ');
      return filtered ? `style="${filtered}"` : '';
    });
    // Remove empty spans
    clean = clean.replace(/<span\s*>([\s\S]*?)<\/span>/gi, '$1');
    // Remove xml namespace declarations
    clean = clean.replace(/\s*xmlns:[a-z]+="[^"]*"/gi, '');
    clean = clean.replace(/\s*xmlns="[^"]*"/gi, '');
    // Clean up excessive whitespace in tags
    clean = clean.replace(/<([a-z]+)\s{2,}/gi, '<$1 ');
    // Remove empty paragraphs (but keep line breaks)
    clean = clean.replace(/<p[^>]*>\s*(&nbsp;)?\s*<\/p>/gi, '<br/>');
    return clean.trim();
  };

  // --- Header Backup & Restore ---
  const restoreInputRef = useRef<HTMLInputElement>(null);


  const backupHeader = () => {

    if (!headerHtml) {
      setModal({
        isOpen: true,
        title: 'ব্যাকআপ ব্যর্থ',
        message: 'হেডার সেকশনে কোনো কন্টেন্ট নেই। ব্যাকআপ করতে আগে কিছু লিখুন বা পেস্ট করুন।',
        type: 'alert'
      });
      return;
    }

    const backupData = {
      version: 1,
      timestamp: new Date().toISOString(),
      headerHtml: headerHtml
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toLocaleDateString('bn-BD').replace(/\//g, '-');
    a.download = `header-backup-${dateStr}.qheader`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setModal({
      isOpen: true,
      title: 'ব্যাকআপ সফল ✅',
      message: 'হেডার সেকশনের ব্যাকআপ ফাইল সফলভাবে ডাউনলোড হয়েছে।',
      type: 'alert'
    });
  };

  const restoreHeader = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const backupData = JSON.parse(content);

        if (!backupData.headerHtml && backupData.headerHtml !== '') {
          setModal({
            isOpen: true,
            title: 'রিস্টোর ব্যর্থ',
            message: 'এটি একটি বৈধ ব্যাকআপ ফাইল নয়। অনুগ্রহ করে সঠিক .qheader ফাইল নির্বাচন করুন।',
            type: 'alert'
          });
          return;
        }

        setHeaderHtml(backupData.headerHtml);
        if (headerEditorRef.current) {
          headerEditorRef.current.innerHTML = backupData.headerHtml;
        }

        setModal({
          isOpen: true,
          title: 'রিস্টোর সফল ✅',
          message: `হেডার সফলভাবে রিস্টোর হয়েছে! (ব্যাকআপ তারিখ: ${backupData.timestamp ? new Date(backupData.timestamp).toLocaleString('bn-BD') : 'অজানা'})`,
          type: 'alert'
        });
      } catch (err) {
        setModal({
          isOpen: true,
          title: 'রিস্টোর ব্যর্থ',
          message: 'ফাইলটি পড়তে সমস্যা হয়েছে। অনুগ্রহ করে একটি বৈধ .qheader ফাইল ব্যবহার করুন।',
          type: 'alert'
        });
      }
    };
    reader.readAsText(file);

    // Reset file input so the same file can be selected again
    if (restoreInputRef.current) {
      restoreInputRef.current.value = '';
    }
  };

  // Sync state to ref for onresult access
  useEffect(() => {
    activeFieldRef.current = activeField;
  }, [activeField]);

  useEffect(() => {
    voiceLangRef.current = voiceLang;
  }, [voiceLang]);

  // Handle language change while recording
  useEffect(() => {
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, [voiceLang]);

  // Keep Ref in sync with state
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  // Sync headerHtml to editor ref
  useEffect(() => {
    if (headerEditorRef.current && headerHtml !== headerEditorRef.current.innerHTML) {
      headerEditorRef.current.innerHTML = headerHtml;
    }
  }, [headerHtml]);



  // Hydration fix
  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem('q-maker-draft');
    if (saved) {
      try {
        const {
          header: sHeader,
          questions: sQuestions,
          lang: sLang,
          paperLang: sPaperLang,
          headerSizes: sHeaderSizes,
          headerWeights: sHeaderWeights,
          headerUnderlines: sHeaderUnderlines,
          headerOverlines: sHeaderOverlines,
          headerAlignments: sHeaderAlignments,
          headerHtml: sHeaderHtml,
          headerBaseFontSize: sHeaderBaseFontSize
        } = JSON.parse(saved);

        if (sHeaderHtml) {
          setHeaderHtml(sHeaderHtml);
        }
        
        if (sHeaderBaseFontSize) {
          setHeaderBaseFontSize(sHeaderBaseFontSize);
        }

        // Migration logic for older versions
        let migHeader = sHeader;
        if (migHeader && !migHeader.fields) {
          migHeader = {
            madrasaName: sHeader.madrasaName || '',
            examTitle: sHeader.examTitle || '',
            fields: [
              { id: 'subject', label: 'বিষয়', value: sHeader.subjectName || '' },
              { id: 'class', label: 'জামাত', value: sHeader.className || '' },
              { id: 'date', label: 'তারিখ', value: sHeader.date || '' },
              { id: 'time', label: 'সময়', value: sHeader.time || '' },
              { id: 'fullMarks', label: 'পূর্ণমান', value: sHeader.fullMarks || '' },
            ]
          };
        }
        
        // Force fixed madrasa name and styles
        if (migHeader) {
          migHeader.madrasaName = 'জামিয়া ইবনে আব্বাস (রা.) সামান্তপুর';
        }

        setHeader(migHeader);
        setQuestions(sQuestions);
        
        const newSizes = sHeaderSizes || {};
        if (!newSizes.madrasaName) newSizes.madrasaName = 36;
        setHeaderSizes(newSizes);

        const newWeights = sHeaderWeights || {};
        setHeaderWeights(newWeights);

        const newUnderlines = sHeaderUnderlines || {};
        setHeaderUnderlines(newUnderlines);

        const newOverlines = sHeaderOverlines || {};
        setHeaderOverlines(newOverlines);

        const newAlignments = sHeaderAlignments || {};
        if (!newAlignments.madrasaName) newAlignments.madrasaName = 'center';
        if (!newAlignments.examTitle) newAlignments.examTitle = 'center';
        migHeader.fields.forEach((f: any) => {
          if (!newAlignments[f.id]) newAlignments[f.id] = 'center';
        });
        setHeaderAlignments(newAlignments);
        setLang(sLang || 'bn-BD');
        setPaperLang(sPaperLang || sLang || 'bn-BD');
        setVoiceLang(sPaperLang || sLang || 'bn-BD');
        voiceLangRef.current = sPaperLang || sLang || 'bn-BD';
      } catch (e) {
        console.error("Failed to load draft", e);
      }
    } else {
      // Add initial question
      setQuestions([{ id: Date.now().toString(), text: '', subQuestions: [] }]);
    }
  }, []);

  // Update header labels when paper language changes
  useEffect(() => {
    setHeader(prev => ({
      ...prev,
      fields: prev.fields.map(f => {
        const defaultIds = ['subject', 'class', 'date', 'time', 'fullMarks'];
        if (defaultIds.includes(f.id)) {
          const trans = translations[paperLang] as any;
          if (trans && trans[f.id]) {
            return { ...f, label: trans[f.id] };
          }
        }
        return f;
      })
    }));
  }, [paperLang]);

  // Save to localStorage
  const saveDraft = useCallback(() => {
    localStorage.setItem('q-maker-draft', JSON.stringify({
      header, questions, lang, paperLang, headerSizes, headerWeights, headerUnderlines, headerOverlines, headerAlignments, headerHtml, headerBaseFontSize
    }));
  }, [header, questions, lang, paperLang, headerSizes, headerWeights, headerUnderlines, headerOverlines, headerAlignments, headerHtml, headerBaseFontSize]);

  // Sync voiceLangRef with state
  useEffect(() => {
    voiceLangRef.current = voiceLang;
  }, [voiceLang]);

  // Track screen width for responsive control bar
  useEffect(() => {
    const handleResize = () => {
      setIsWideScreen(window.innerWidth > 965);
    };
    handleResize(); // Set initial value
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const resetPaper = () => {
    setModal({
      isOpen: true,
      title: uiT.reset,
      message: translations['bn-BD'].resetConfirm,
      type: 'confirm',
      onConfirm: () => {
        setHeader(DEFAULT_HEADER);
        setQuestions([{ id: Date.now().toString(), text: '', subQuestions: [] }]);
        setHeaderSizes({});
        setHeaderWeights({});
        setHeaderUnderlines({});
        setHeaderOverlines({});
        setHeaderAlignments({});
        localStorage.removeItem('q-maker-draft');
      }
    });
  };

  // --- Header Management ---
  const addHeaderField = () => {
    setHeader(prev => ({
      ...prev,
      fields: [...prev.fields, { id: Date.now().toString(), label: 'নতুন বক্স', value: '' }]
    }));
  };

  const removeHeaderField = (id: string) => {
    setHeader(prev => ({
      ...prev,
      fields: prev.fields.filter(f => f.id !== id)
    }));
  };

  const updateHeaderField = (id: string, key: 'label' | 'value', val: string) => {
    setHeader(prev => ({
      ...prev,
      fields: prev.fields.map(f => f.id === id ? { ...f, [key]: val } : f)
    }));
  };

  // --- Question Management ---
  const addQuestion = () => {
    setQuestions([...questions, { id: Date.now().toString(), text: '', subQuestions: [] }]);
  };

  const addPageBreak = () => {
    setQuestions([...questions, { id: Date.now().toString(), text: 'PAGE_BREAK', subQuestions: [], isPageBreak: true }]);
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const updateQuestionText = (id: string, text: string) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, text } : q));
  };

  const addSubQuestion = (qId: string) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        return {
          ...q,
          subQuestions: [...q.subQuestions, { id: Date.now().toString(), text: '' }]
        };
      }
      return q;
    }));
  };

  const updateSubQuestionText = (qId: string, sqId: string, text: string) => {
    setQuestions(prev => prev.map(q => {
      if (q.id === qId) {
        return {
          ...q,
          subQuestions: q.subQuestions.map(sq => sq.id === sqId ? { ...sq, text } : sq)
        };
      }
      return q;
    }));
  };

  const updateSubQuestionLabel = (qId: string, sqId: string, manualLabel: string) => {
    setQuestions(prev => prev.map(q => {
      if (q.id === qId) {
        return {
          ...q,
          subQuestions: q.subQuestions.map(sq => sq.id === sqId ? { ...sq, manualLabel } : sq)
        };
      }
      return q;
    }));
  };

  const removeSubQuestion = (qId: string, sqId: string) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        return {
          ...q,
          subQuestions: q.subQuestions.filter(sq => sq.id !== sqId)
        };
      }
      return q;
    }));
  };

  const adjustFontSize = (delta: number) => {
    if (!activeField) return;

    const { id, type, fieldName, fieldId, qId } = activeField;

    // Header editor: use execCommand for font size on selection
    if (type === 'header' && id === 'headerEditor') {
      const selection = window.getSelection();
      if (selection && headerEditorRef.current) {
        const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
        
        if (range && selection.toString().length > 0) {
          // Apply font size change to selected text
          const fragment = range.extractContents();
          const wrapper = document.createElement('span');
          
          // Try to get current font size from selection
          const tempDiv = document.createElement('div');
          tempDiv.appendChild(fragment.cloneNode(true));
          const computedStyle = window.getComputedStyle(
            range.startContainer.parentElement || headerEditorRef.current
          );
          const currentSize = parseFloat(computedStyle.fontSize) || 16;
          const newSize = Math.max(8, Math.min(72, currentSize + delta));
          
          wrapper.style.fontSize = `${newSize}px`;
          wrapper.appendChild(fragment);
          range.insertNode(wrapper);
          
          // Restore selection
          selection.removeAllRanges();
          const newRange = document.createRange();
          newRange.selectNodeContents(wrapper);
          selection.addRange(newRange);
        } else {
          // No selection - apply to ALL content by updating state
          const newSize = Math.max(8, Math.min(72, headerBaseFontSize + delta));
          setHeaderBaseFontSize(newSize);
          
          // Also wrap existing content if it's the first time to ensure it's in the HTML
          if (!headerHtml.includes('font-size')) {
            headerEditorRef.current.innerHTML = `<div style="font-size: ${newSize}px">${headerEditorRef.current.innerHTML}</div>`;
          }
        }
        setHeaderHtml(headerEditorRef.current.innerHTML);
      }
      return;
    }

    if (type === 'header' && fieldName) {
      if (fieldName === 'madrasaName' || fieldName === 'examTitle') {
        setHeaderSizes(prev => ({
          ...prev,
          [fieldName]: (prev[fieldName] || (fieldName === 'madrasaName' ? 24 : 18)) + delta
        }));
      } else if (fieldName === 'dynamic' && fieldId) {
        setHeaderSizes(prev => ({
          ...prev,
          [fieldId]: (prev[fieldId] || 18) + delta
        }));
      }
    } else if (type === 'question') {
      setQuestions(prev => prev.map(q =>
        q.id === id ? { ...q, fontSize: (q.fontSize || 18) + delta } : q
      ));
    } else if (type === 'subquestion' && qId) {
      setQuestions(prev => prev.map(q => {
        if (q.id === qId) {
          return {
            ...q,
            subQuestions: q.subQuestions.map(sq =>
              sq.id === id ? { ...sq, fontSize: (sq.fontSize || 16) + delta } : sq
            )
          };
        }
        return q;
      }));
    }
  };

  const toggleBold = () => {
    const selection = window.getSelection();

    // Header editor: always use execCommand
    if (activeField?.id === 'headerEditor' && headerEditorRef.current) {
      headerEditorRef.current.focus();
      document.execCommand('bold', false);
      setHeaderHtml(headerEditorRef.current.innerHTML);
      return;
    }

    if (selection && selection.toString().length > 0) {
      document.execCommand('bold', false);
      return;
    }

    if (!activeField) return;

    const { id, type, fieldName, fieldId, qId } = activeField;

    if (type === 'header' && fieldName) {
      if (fieldName === 'madrasaName' || fieldName === 'examTitle') {
        setHeaderWeights(prev => ({ ...prev, [fieldName]: !prev[fieldName] }));
      } else if (fieldName === 'dynamic' && fieldId) {
        setHeaderWeights(prev => ({ ...prev, [fieldId]: !prev[fieldId] }));
      }
    } else if (type === 'question') {
      setQuestions(prev => prev.map(q => q.id === id ? { ...q, isBold: !q.isBold } : q));
    } else if (type === 'subquestion' && qId) {
      setQuestions(prev => prev.map(q => {
        if (q.id === qId) {
          return {
            ...q,
            subQuestions: q.subQuestions.map(sq => sq.id === id ? { ...sq, isBold: !sq.isBold } : sq)
          };
        }
        return q;
      }));
    }
  };

  const toggleUnderline = () => {
    const selection = window.getSelection();

    // Header editor: always use execCommand
    if (activeField?.id === 'headerEditor' && headerEditorRef.current) {
      headerEditorRef.current.focus();
      document.execCommand('underline', false);
      setHeaderHtml(headerEditorRef.current.innerHTML);
      return;
    }

    if (selection && selection.toString().length > 0) {
      document.execCommand('underline', false);
      return;
    }

    if (!activeField) return;

    const { id, type, fieldName, fieldId, qId } = activeField;

    if (type === 'header' && fieldName) {
      const key = fieldName === 'dynamic' && fieldId ? fieldId : fieldName;
      setHeaderUnderlines(prev => ({ ...prev, [key]: !prev[key] }));
    } else if (type === 'question') {
      setQuestions(prev => prev.map(q => q.id === id ? { ...q, isUnderline: !q.isUnderline } : q));
    } else if (type === 'subquestion' && qId) {
      setQuestions(prev => prev.map(q => {
        if (q.id === qId) {
          return {
            ...q,
            subQuestions: q.subQuestions.map(sq => sq.id === id ? { ...sq, isUnderline: !sq.isUnderline } : sq)
          };
        }
        return q;
      }));
    }
  };

  const toggleOverline = () => {
    // Header editor: apply overline via insertHTML
    if (activeField?.id === 'headerEditor' && headerEditorRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        headerEditorRef.current.focus();
        if (selection.toString().length > 0) {
          try {
            const range = selection.getRangeAt(0);
            const span = document.createElement('span');
            span.style.textDecoration = 'overline';
            range.surroundContents(span);
          } catch (e) {
            const container = document.createElement('div');
            container.appendChild(selection.getRangeAt(0).cloneContents());
            document.execCommand('insertHTML', false, `<span style="text-decoration: overline">${container.innerHTML}</span>`);
          }
        }
        setHeaderHtml(headerEditorRef.current.innerHTML);
      }
      return;
    }

    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      try {
        const range = selection.getRangeAt(0);
        const span = document.createElement('span');
        span.style.textDecoration = 'overline';
        range.surroundContents(span);
      } catch (e) {
        // Fallback for complex selections
        const container = document.createElement('div');
        container.appendChild(selection.getRangeAt(0).cloneContents());
        document.execCommand('insertHTML', false, `<span style="text-decoration: overline">${container.innerHTML}</span>`);
      }
      return;
    }

    if (!activeField) return;

    const { id, type, fieldName, fieldId, qId } = activeField;

    if (type === 'header' && fieldName) {
      const key = fieldName === 'dynamic' && fieldId ? fieldId : fieldName;
      setHeaderOverlines(prev => ({ ...prev, [key]: !prev[key] }));
    } else if (type === 'question') {
      setQuestions(prev => prev.map(q => q.id === id ? { ...q, isOverline: !q.isOverline } : q));
    } else if (type === 'subquestion' && qId) {
      setQuestions(prev => prev.map(q => {
        if (q.id === qId) {
          return {
            ...q,
            subQuestions: q.subQuestions.map(sq => sq.id === id ? { ...sq, isOverline: !sq.isOverline } : sq)
          };
        }
        return q;
      }));
    }
  };

  const updateAlignment = (align: 'left' | 'center' | 'right' | 'justify') => {
    if (!activeField) return;

    const { id, type, fieldName, fieldId, qId } = activeField;
    const key = fieldName === 'dynamic' && fieldId ? fieldId : (fieldName || '');

    // Header editor: use execCommand for alignment AND update state for UI buttons
    if (id === 'headerEditor' && headerEditorRef.current) {
      headerEditorRef.current.focus();
      const cmdMap: Record<string, string> = {
        'left': 'justifyLeft',
        'center': 'justifyCenter',
        'right': 'justifyRight',
        'justify': 'justifyFull'
      };
      document.execCommand(cmdMap[align], false);
      setHeaderHtml(headerEditorRef.current.innerHTML);
      
      // Update state so floating buttons show active
      if (key) {
        setHeaderAlignments(prev => ({ ...prev, [key]: align }));
      }
      return;
    }

    if (type === 'header' && fieldName) {
      const key = fieldName === 'dynamic' && fieldId ? fieldId : fieldName;
      setHeaderAlignments(prev => ({ ...prev, [key]: align }));
    } else if (type === 'question') {
      setQuestions(prev => prev.map(q => q.id === id ? { ...q, alignment: align } : q));
    } else if (type === 'subquestion' && qId) {
      setQuestions(prev => prev.map(q => {
        if (q.id === qId) {
          return {
            ...q,
            subQuestions: q.subQuestions.map(sq => sq.id === id ? { ...sq, alignment: align } : sq)
          };
        }
        return q;
      }));
    }
  };

  const applyFont = (fontClass: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.toString().length === 0) return;

    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    span.className = fontClass;

    try {
      // Extract contents to manipulate them
      const fragment = range.extractContents();

      // Recursively clean existing font classes from the fragment to avoid nesting issues
      const cleanNodes = (node: Node) => {
        if (node instanceof HTMLElement) {
          node.classList.remove('font-naskh', 'font-nastaliq');
          // If the span is now empty of classes and it was just a font-wrapper, 
          // we could potentially unwrap it, but keeping it is safer for preserving other styles.
          node.childNodes.forEach(cleanNodes);
        }
      };
      fragment.childNodes.forEach(cleanNodes);

      span.appendChild(fragment);
      range.insertNode(span);

      // Restore selection for better UX
      selection.removeAllRanges();
      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      selection.addRange(newRange);
    } catch (e) {
      console.error('Failed to apply font:', e);
    }
  };

  // --- Voice Recognition ---
  const startRecognition = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setModal({
        isOpen: true,
        title: 'Error',
        message: "Voice recognition is not supported in this browser.",
        type: 'alert'
      });
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = voiceLangRef.current;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
      let currentTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          const transcript = event.results[i][0].transcript;
          if (!transcript && transcript !== "") return;
          
          const fontClass = voiceLangRef.current === 'ar-SA' ? 'font-naskh' : voiceLangRef.current === 'ur-PK' ? 'font-nastaliq' : '';
          currentTranscript += fontClass ? `<span class="${fontClass}">${transcript}</span>` : transcript;
        }
      }

      if (currentTranscript) {
        // Use activeFieldRef to find the last active element if document.activeElement is not valid
        let targetEl = document.activeElement as HTMLElement;
        if (!targetEl || targetEl.contentEditable !== 'true') {
          // Attempt to find element by ID from activeFieldRef
          if (activeFieldRef.current) {
            const { id } = activeFieldRef.current;
            if (id === 'headerEditor') {
              targetEl = headerEditorRef.current as HTMLElement;
            } else {
              targetEl = document.getElementById(`editable-${id}`) as HTMLElement;
            }
          }
        }

        if (targetEl && targetEl.contentEditable === 'true') {
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            
            // Smart Selection Replacement: If text is selected, delete it first
            if (!range.collapsed) {
              range.deleteContents();
            }
            
            const preRange = range.cloneRange();
            preRange.selectNodeContents(targetEl);
            preRange.setEnd(range.startContainer, range.startOffset);
            const textBefore = preRange.toString();
            const needsLeadingSpace = textBefore.length > 0 && !textBefore.endsWith(' ') && !textBefore.endsWith('\n');

            const postRange = range.cloneRange();
            postRange.selectNodeContents(targetEl);
            postRange.setStart(range.endContainer, range.endOffset);
            const textAfter = postRange.toString();
            const needsTrailingSpace = textAfter.length > 0 && !textAfter.startsWith(' ') && !textAfter.startsWith('\n');
            
            const htmlToInsert = (needsLeadingSpace ? '&nbsp;' : '') + currentTranscript + (needsTrailingSpace ? '&nbsp;' : '');
            
            // Safer way to insert HTML
            const fragment = range.createContextualFragment(htmlToInsert);
            range.insertNode(fragment);
            
            // Move cursor to end of inserted content
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);

            // Trigger change detection for React
            targetEl.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }
      }
    };

    recognition.onend = () => {
      setTimeout(() => {
        if (isRecordingRef.current && recognitionRef.current === recognition) {
          startRecognition();
        }
      }, 100);
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed' || event.error === 'no-speech') {
        setIsRecording(false);
        recognitionRef.current = null;
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [questions]);

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      isRecordingRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      return;
    }

    if (!activeField) {
      setModal({
        isOpen: true,
        title: 'সিলেকশন প্রয়োজন',
        message: "ভয়েস ইনপুট ব্যবহার করতে প্রথমে যেকোনো একটি টেক্সট ফিল্ডে ক্লিক করুন।",
        type: 'alert'
      });
      return;
    }

    startRecognition();
  };

  const getDownloadFileName = (ext: string) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `Easy_question_maker_${year}-${month}-${day}-${hours}-${minutes}-${seconds}.${ext}`;
  };

  // --- Exports ---

  const exportWord = async () => {
    const headerParagraphs: Paragraph[] = [];
    
    if (headerHtml) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(headerHtml, 'text/html');
      
      // Simple line extraction from rich editor
      // We look for block elements or just use innerText split by newlines
      const text = doc.body.innerText || "";
      const lines = text.split('\n').map(l => l.trim()).filter(l => l !== "");
      
      lines.forEach(line => {
        headerParagraphs.push(new Paragraph({
          children: [new TextRun({ text: line, bold: true })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 }
        }));
      });
    }

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          ...headerParagraphs,
          new Paragraph({
            text: "",
            border: { bottom: { color: "000000", space: 1, style: BorderStyle.SINGLE, size: 6 } },
            spacing: { after: 400 }
          }),
          ...questions.flatMap((q, index) => {
            if (q.isPageBreak) {
              return [new Paragraph({ text: "", pageBreakBefore: true })];
            }
            return [
              new Paragraph({
                children: [
                  new TextRun({ text: `${getQuestionLabel(index, paperLang)}: `, bold: true }),
                  new TextRun(q.text.replace(/<[^>]*>/g, ''))
                ],
                spacing: { before: 240 },
                alignment: q.alignment === 'center' ? AlignmentType.CENTER : 
                           q.alignment === 'right' ? AlignmentType.RIGHT : 
                           q.alignment === 'justify' ? AlignmentType.JUSTIFIED : AlignmentType.LEFT
              }),
              ...q.subQuestions.map((sq, sIndex) =>
                new Paragraph({
                  children: [
                    new TextRun({ text: `${sq.manualLabel || getSubLabel(sIndex, paperLang)} `, bold: true }),
                    new TextRun(sq.text.replace(/<[^>]*>/g, ''))
                  ],
                  indent: { left: 720 },
                  spacing: { before: 120 },
                  alignment: sq.alignment === 'center' ? AlignmentType.CENTER : 
                             sq.alignment === 'right' ? AlignmentType.RIGHT : 
                             sq.alignment === 'justify' ? AlignmentType.JUSTIFIED : AlignmentType.LEFT
                })
              )
            ];
          }),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, getDownloadFileName('docx'));
  };

  const handlePrint = () => {
    window.print();
  };

  const getNativeNumber = (num: number, l: Language) => {
    const digits: Record<string, string[]> = {
      'bn-BD': ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'],
      'ar-SA': ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
      'ur-PK': ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'],
      'en-US': ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
    };
    const targetDigits = digits[l] || digits['en-US'];
    return num.toString().split('').map(d => targetDigits[parseInt(d)] || d).join('');
  };

  const getQuestionLabel = (index: number, l: Language) => {
    if (l === 'ar-SA') {
      const ordinals = [
        'الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس',
        'السادس', 'السابع', 'الثامن', 'التاسع', 'العاشر',
        'الحادي عشر', 'الثاني عشر', 'الثالث عشر', 'الرابع عشر', 'الخامس عشر',
        'السادس عشر', 'السابع عشر', 'الثامن عشر', 'التاسع عشر', 'العشرون'
      ];
      return ordinals[index] ? `${translations['ar-SA'].question} ${ordinals[index]}` : `${translations['ar-SA'].question} ${getNativeNumber(index + 1, l)}`;
    }
    if (l === 'en-US') {
      return getNativeNumber(index + 1, l);
    }
    if (l === 'ur-PK') {
      const ordinals = [
        'اول', 'دوم', 'سوم', 'چہارم', 'پنجم',
        'ششم', 'ہفتم', 'ہشتم', 'نہم', 'دہم',
        'گیارہواں', 'بارہواں', 'تیرہواں', 'چودہواں', 'پندرہواں'
      ];
      return ordinals[index] ? `${translations['ur-PK'].question} ${ordinals[index]}` : `${translations['ur-PK'].question} ${getNativeNumber(index + 1, l)}`;
    }
    return `${translations[l].question} ${getNativeNumber(index + 1, l)}`;
  };

  const getSubLabel = (index: number, l: Language) => {
    if (l === 'ar-SA' || l === 'ur-PK') {
      const arabicAlphas = ['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح', 'ط', 'ي'];
      return `(${arabicAlphas[index] || index + 1})`;
    }
    if (l === 'bn-BD') {
      const bengaliAlphas = ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ', 'ছ', 'জ', 'ঝ', 'ঞ'];
      return `(${bengaliAlphas[index] || index + 1})`;
    }
    return `(${String.fromCharCode(97 + index)})`;
  };

  const getFontClass = (l: Language) => {
    switch (l) {
      case 'ar-SA':
      case 'ur-PK':
      case 'fa-IR':
        return 'font-rtl-mixed';
      case 'en-US': return 'font-english';
      default: return 'font-serif-bn';
    }
  };

  if (!isClient) return null;

  return (
    <div className={`min-h-screen pb-20`}>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 no-print shadow-sm">
        <div className="max-w-ultra mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3 py-3 md:h-16 md:py-0 px-4">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-2 rounded-xl text-white shadow-lg shadow-emerald-100">
              <FileText size={20} className="md:w-6 md:h-6" />
            </div>
            <h1 className="text-lg md:text-xl font-bold text-slate-900">{uiT.title}</h1>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4">
            <div className="bg-slate-100 p-1 rounded-xl flex gap-1 no-print">
              {[
                { code: 'bn-BD', label: 'বাংলা' },
                { code: 'en-US', label: 'English' },
                { code: 'ar-SA', label: 'عربي' },
                { code: 'ur-PK', label: 'اردو' }
              ].map((l) => (
                <button
                  key={l.code}
                  onClick={() => { setPaperLang(l.code as Language); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${paperLang === l.code ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {l.label}
                </button>
              ))}
            </div>

            <div className="h-6 w-px bg-slate-200 mx-2 hidden md:block" />

            <div className="flex gap-2">
              <button onClick={resetPaper} className="px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600" title={uiT.reset}>
                <RotateCcw size={16} /> <span className="hidden md:inline">{uiT.reset}</span>
              </button>
              <div className="h-8 w-px bg-slate-200 mx-1" />
              <button onClick={() => setView('edit')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${view === 'edit' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                <Edit3 size={16} /> {uiT.edit}
              </button>
              <button onClick={() => setView('preview')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${view === 'preview' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                <Eye size={16} /> {uiT.preview}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-ultra mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {view === 'edit' ? (
            <motion.div key="edit" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8 no-print">

              <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-slate-200">
                  <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                    <Edit3 size={20} className="text-emerald-600" />
                    হেডার সেকশন
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={backupHeader} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all flex items-center gap-1" title="হেডার ব্যাকআপ করুন">
                      <Download size={14} /> ব্যাকআপ
                    </button>
                    <button onClick={() => restoreInputRef.current?.click()} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-600 hover:bg-amber-100 transition-all flex items-center gap-1" title="ব্যাকআপ থেকে রিস্টোর করুন">
                      <Upload size={14} /> রিস্টোর
                    </button>
                    <input
                      ref={restoreInputRef}
                      type="file"
                      accept=".qheader,.json"
                      onChange={restoreHeader}
                      className="hidden"
                    />
                    <button onClick={saveDraft} className="btn-secondary text-sm"><Save size={16} /> {uiT.saveDraft}</button>
                    {headerHtml && (
                      <button
                        onClick={() => {
                          setHeaderHtml('');
                          if (headerEditorRef.current) headerEditorRef.current.innerHTML = '';
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-50 text-red-500 hover:bg-red-100 transition-all flex items-center gap-1"
                      >
                        <Trash2 size={14} /> ক্লিয়ার
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <div className="text-xs text-slate-400 mb-2 flex items-center gap-1.5">
                    <Globe size={12} />
                    <span>সরাসরি টাইপ করুন অথবা Word ফাইল থেকে কপি-পেস্ট করুন — ফরম্যাটিং সংরক্ষিত থাকবে</span>
                  </div>
                  <div
                    ref={headerEditorRef}
                    contentEditable
                    suppressContentEditableWarning
                    className={`header-rich-editor input-field min-h-[180px] p-6 ${getFontClass(paperLang)} ${isRTL ? 'rtl' : 'ltr'}`}
                    style={{ fontSize: `${headerBaseFontSize}px` }}
                    data-placeholder="এখানে হেডার টাইপ করুন বা Word থেকে পেস্ট করুন..."
                    onInput={(e) => {
                      setHeaderHtml(e.currentTarget.innerHTML);
                    }}
                    onFocus={() => setActiveField({ id: 'headerEditor', type: 'header', fieldName: 'madrasaName' })}
                    onPaste={(e) => {
                      e.preventDefault();
                      const clipboardData = e.clipboardData;
                      
                      // Try HTML first (Word copies as HTML)
                      let html = clipboardData.getData('text/html');
                      
                      if (html) {
                        // Sanitize Word HTML
                        const sanitized = sanitizeWordHtml(html);
                        
                        // Insert at cursor position
                        const selection = window.getSelection();
                        if (selection && selection.rangeCount > 0) {
                          const range = selection.getRangeAt(0);
                          range.deleteContents();
                          
                          const fragment = range.createContextualFragment(sanitized);
                          range.insertNode(fragment);
                          
                          // Move cursor to end
                          range.collapse(false);
                          selection.removeAllRanges();
                          selection.addRange(range);
                        }
                      } else {
                        // Fallback to plain text
                        const text = clipboardData.getData('text/plain');
                        const selection = window.getSelection();
                        if (selection && selection.rangeCount > 0) {
                          const range = selection.getRangeAt(0);
                          range.deleteContents();
                          // Convert newlines to <br> for plain text
                          const lines = text.split('\n');
                          const fragment = document.createDocumentFragment();
                          lines.forEach((line, i) => {
                            fragment.appendChild(document.createTextNode(line));
                            if (i < lines.length - 1) {
                              fragment.appendChild(document.createElement('br'));
                            }
                          });
                          range.insertNode(fragment);
                          range.collapse(false);
                          selection.removeAllRanges();
                          selection.addRange(range);
                        }
                      }
                      
                      // Update state
                      if (headerEditorRef.current) {
                        setHeaderHtml(headerEditorRef.current.innerHTML);
                      }
                    }}
                  />
                </div>
              </section>


              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold flex items-center gap-2"><FileText size={24} className="text-emerald-600" /> {t.question} List</h2>
                  <div className="flex gap-2">
                    <button onClick={addPageBreak} className="btn-secondary"><RotateCcw size={18} className="rotate-90" /> {uiT.addPageBreak || 'Add Page Break'}</button>
                    <button onClick={addQuestion} className="btn-primary"><Plus size={18} /> {uiT.addQuestion}</button>
                  </div>
                </div>

                <div className={isRTL ? 'rtl' : 'ltr'}>
                  <div className="space-y-6">
                    {questions.map((q, index) => (
                      q.isPageBreak ? (
                        <div key={q.id} className="flex items-center gap-4 no-print py-4">
                          <div className="flex-1 h-px bg-slate-200 border-dashed border-b-2" />
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Next Page Starts Here</span>
                          <button onClick={() => removeQuestion(q.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={16} /></button>
                          <div className="flex-1 h-px bg-slate-200 border-dashed border-b-2" />
                        </div>
                      ) : (
                        <div key={q.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative group">
                          <div className="flex items-start gap-4">
                            <div className="bg-emerald-100 text-emerald-700 w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0">{getNativeNumber(index + 1, paperLang)}</div>
                            <div className="flex-1 space-y-4">
                              <EditableText
                                id={`editable-${q.id}`}
                                value={q.text}
                                onChange={(val: string) => updateQuestionText(q.id, val)}
                                onFocus={() => setActiveField({ id: q.id, type: 'question' })}
                                style={{
                                  fontSize: `${q.fontSize || 18}px`,
                                  fontWeight: q.isBold ? 'bold' : 'normal',
                                  textDecoration: `${q.isUnderline ? 'underline' : ''} ${q.isOverline ? 'overline' : ''}`.trim(),
                                  textAlign: q.alignment || (isRTL ? 'right' : 'left')
                                }}
                                className={`input-field min-h-[80px] p-4 ${getFontClass(paperLang)}`}
                                placeholder={t.placeholderQuestion}
                              />
                              <div className="pl-6 border-l-2 border-slate-100 space-y-3">
                                {q.subQuestions.map((sq, sqIndex) => (
                                  <div key={sq.id} className="flex gap-2">
                                    <input
                                      type="text"
                                      value={sq.manualLabel || getSubLabel(sqIndex, paperLang)}
                                      onChange={(e) => updateSubQuestionLabel(q.id, sq.id, e.target.value)}
                                      className="w-12 text-slate-400 mt-1 font-medium bg-transparent outline-none text-center"
                                    />
                                    <EditableText
                                      id={`editable-${sq.id}`}
                                      value={sq.text}
                                      onChange={(val: string) => updateSubQuestionText(q.id, sq.id, val)}
                                      onFocus={() => setActiveField({ id: sq.id, type: 'subquestion', qId: q.id })}
                                      style={{
                                        fontSize: `${sq.fontSize || 16}px`,
                                        fontWeight: sq.isBold ? 'bold' : 'normal',
                                        textDecoration: `${sq.isUnderline ? 'underline' : ''} ${sq.isOverline ? 'overline' : ''}`.trim(),
                                        textAlign: sq.alignment || (isRTL ? 'right' : 'left')
                                      }}
                                      className={`input-field min-h-[40px] p-2 ${getFontClass(paperLang)} flex-1`}
                                      placeholder={t.placeholderSubQuestion}
                                    />
                                    <button onClick={() => removeSubQuestion(q.id, sq.id)} className="text-slate-300 hover:text-red-500 p-2"><Trash2 size={16} /></button>
                                  </div>
                                ))}
                                <button onClick={() => addSubQuestion(q.id)} className="text-emerald-600 hover:text-emerald-700 text-sm font-bold flex items-center gap-1 mt-2">
                                  <Plus size={16} /> {t.addSubQuestion}
                                </button>
                              </div>
                            </div>
                            <button onClick={() => removeQuestion(q.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 p-2 transition-all">
                              <Trash2 size={20} />
                            </button>
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              </section>
            </motion.div>
          ) : (
            <motion.div key="preview" className="space-y-8">
              <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center justify-center gap-3 md:gap-4 no-print">
                <button onClick={exportWord} className="btn-primary bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm"><FileText size={16} /> {uiT.downloadWord}</button>
                <button onClick={handlePrint} className="btn-secondary text-xs sm:text-sm col-span-2 sm:col-span-1"><Printer size={16} /> {uiT.print}</button>
              </div>

              <div className="preview-container">
                <div ref={previewRef} id="printable-paper" className="w-full flex flex-col items-center">
                  {questions.reduce((acc, q) => {
                    if (q.isPageBreak) {
                      acc.push([]);
                    } else {
                      acc[acc.length - 1].push(q);
                    }
                    return acc;
                  }, [[]] as Question[][]).map((pageQuestions, pageIndex) => (
                    <React.Fragment key={pageIndex}>
                      {pageIndex > 0 && (
                        <div className="w-full flex items-center justify-center gap-4 my-12 no-print">
                          <div className="h-px flex-1 bg-slate-300" />
                          <span className="px-4 py-1 rounded-full bg-slate-200 text-slate-500 text-xs font-bold uppercase tracking-widest">পরবর্তী পাতা</span>
                          <div className="h-px flex-1 bg-slate-300" />
                        </div>
                      )}
                      <div 
                        className={`paper-preview print-area ${isRTL ? 'rtl' : 'ltr'} shadow-2xl relative`}
                        style={{ breakAfter: 'page' }}
                      >
                      {pageIndex === 0 && (
                        headerHtml ? (
                          <div
                            className={`preview-header-content border-b-2 border-slate-900 pb-4 mb-8 ${getFontClass(paperLang)} ${isRTL ? 'rtl' : 'ltr'}`}
                            style={{ fontSize: `${headerBaseFontSize}px` }}
                            dangerouslySetInnerHTML={{ __html: headerHtml }}
                          />
                        ) : (
                          <div className="text-center text-slate-400 italic border-b-2 border-slate-900 pb-4 mb-8 py-6">
                            হেডার সেকশনে কিছু লিখুন বা পেস্ট করুন
                          </div>
                        )
                      )}

                      <div className="space-y-8">
                        {pageQuestions.map((q, qIndex) => {
                          // Find original index for label
                          const originalIndex = questions.findIndex(origQ => origQ.id === q.id);
                          return (
                            <div key={q.id} className="space-y-4">
                              <div className="flex gap-3">
                                <span className="font-bold whitespace-nowrap" style={{ fontSize: `${q.fontSize || 18}px` }}>{getQuestionLabel(originalIndex, paperLang)}:</span>
                                <p
                                  contentEditable suppressContentEditableWarning
                                  onBlur={(e) => updateQuestionText(q.id, e.currentTarget.innerHTML)}
                                  style={{
                                    fontSize: `${q.fontSize || 18}px`,
                                    fontWeight: q.isBold ? 'bold' : 'normal',
                                    textDecoration: `${q.isUnderline ? 'underline' : ''} ${q.isOverline ? 'overline' : ''}`.trim(),
                                    textAlign: q.alignment || (isRTL ? 'right' : 'left')
                                  }}
                                  className={`flex-1 outline-none hover:bg-slate-50 transition-colors rounded px-2 py-1 ${getFontClass(paperLang)} leading-relaxed`}
                                  dangerouslySetInnerHTML={{ __html: q.text }}
                                />
                              </div>
                              {q.subQuestions.length > 0 && (
                                <div className="grid grid-cols-1 gap-3 pl-8">
                                  {q.subQuestions.map((sq, sqIndex) => (
                                    <div key={sq.id} className="flex gap-3">
                                      <span className="font-medium whitespace-nowrap">{sq.manualLabel || getSubLabel(sqIndex, paperLang)}</span>
                                      <p
                                        contentEditable suppressContentEditableWarning
                                        onBlur={(e) => updateSubQuestionText(q.id, sq.id, e.currentTarget.innerHTML)}
                                        style={{ fontSize: `${sq.fontSize || 16}px`, textAlign: sq.alignment || (isRTL ? 'right' : 'left') }}
                                        className={`flex-1 outline-none hover:bg-slate-50 transition-colors rounded px-2 py-1 ${getFontClass(paperLang)}`}
                                        dangerouslySetInnerHTML={{ __html: sq.text }}
                                      />
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </React.Fragment>
                ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* International-Standard Floating Control Bar */}
      <div className="floating-sidebar no-print" style={{
        position: 'fixed',
        bottom: '24px',
        left: '20px',
        right: '20px',
        display: 'flex',
        justifyContent: 'center',
        zIndex: 100,
        pointerEvents: 'none'
      }}>
        <div className="control-panel" style={{
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(24px) saturate(200%)',
          WebkitBackdropFilter: 'blur(24px) saturate(200%)',
          border: '1px solid rgba(255, 255, 255, 0.5)',
          boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.05)',
          borderRadius: '32px',
          display: 'flex',
          flexDirection: 'row' as const,
          padding: '10px 20px',
          gap: '14px',
          width: 'auto',
          maxWidth: '95vw',
          justifyContent: 'center',
          overflowX: 'auto' as const,
          pointerEvents: 'auto' as const
        }}>
          {/* 6. Alignment Tools (Leftmost) - hidden on narrow screens */}
          {isWideScreen && (
          <div className="tool-group">
            <button
              onClick={() => updateAlignment('left')}
              className={`control-btn ${getAlignmentActive() === 'left' ? 'active' : ''}`}
            >
              <AlignLeft size={18} />
            </button>
            <button
              onClick={() => updateAlignment('center')}
              className={`control-btn ${getAlignmentActive() === 'center' ? 'active' : ''}`}
            >
              <AlignCenter size={18} />
            </button>
            <button
              onClick={() => updateAlignment('right')}
              className={`control-btn ${getAlignmentActive() === 'right' ? 'active' : ''}`}
            >
              <AlignRight size={18} />
            </button>
            <button
              onClick={() => updateAlignment('justify')}
              className={`control-btn ${getAlignmentActive() === 'justify' ? 'active' : ''}`}
            >
              <AlignJustify size={18} />
            </button>
          </div>
          )}

          {/* 5. Size Tools - hidden on narrow screens */}
          {isWideScreen && (
          <div className="tool-group">
            <button
              onClick={() => adjustFontSize(2)}
              className="control-btn"
              title="A+"
            >
              <span className="font-bold">A+</span>
            </button>
            <button
              onClick={() => adjustFontSize(-2)}
              className="control-btn"
              title="A-"
            >
              <span className="font-bold">A-</span>
            </button>
          </div>
          )}

          {/* 4. Underline & Overline Tools - hidden on narrow screens */}
          {isWideScreen && (
          <div className="tool-group">
            <button
              onClick={toggleUnderline}
              className={`control-btn ${isFormatActive('underline') ? 'active' : ''}`}
            >
              <span className="underline text-lg">U</span>
            </button>
            <button
              onClick={toggleOverline}
              className={`control-btn ${isFormatActive('overline') ? 'active' : ''}`}
            >
              <span className="overline text-lg">O</span>
            </button>
          </div>
          )}

          {/* 3. Bold Tool - hidden on narrow screens */}
          {isWideScreen && (
          <div className="tool-group">
            <button
              onClick={toggleBold}
              className={`control-btn ${isFormatActive('bold') ? 'active' : ''}`}
            >
              <span className="font-bold text-lg">B</span>
            </button>
          </div>
          )}

          {/* 2. Lang Tools */}
          <div className="tool-group">
            {[
              { code: 'ur-PK', label: 'UR' },
              { code: 'ar-SA', label: 'AR' },
              { code: 'en-US', label: 'EN' },
              { code: 'bn-BD', label: 'BN' }
            ].map((l) => (
              <button
                key={l.code}
                onClick={() => {
                  setVoiceLang(l.code as Language);
                }}
                className={`control-btn control-btn-large ${voiceLang === l.code ? 'active' : ''}`}
              >
                {l.label}
              </button>
            ))}
          </div>

          {/* 1. Voice Tool (Rightmost) */}
          <div className="tool-group">
            <button
              onClick={toggleRecording}
              className={`control-btn ${isRecording ? 'active' : ''}`}
              title={t.voiceStart}
            >
              {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Premium Custom Modal */}
      <AnimatePresence>
        {modal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModal(prev => ({ ...prev, isOpen: false }))}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className={`p-3 rounded-2xl ${modal.type === 'confirm' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>
                    <AlertTriangle size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">{modal.title}</h3>
                </div>
                <p className="text-slate-600 leading-relaxed mb-8">
                  {modal.message}
                </p>
                <div className="flex gap-3">
                  {modal.type === 'confirm' ? (
                    <>
                      <button
                        onClick={() => setModal(prev => ({ ...prev, isOpen: false }))}
                        className="flex-1 px-6 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-all"
                      >
                        বাতিল
                      </button>
                      <button
                        onClick={() => {
                          modal.onConfirm?.();
                          setModal(prev => ({ ...prev, isOpen: false }));
                        }}
                        className="flex-1 px-6 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg shadow-red-200 transition-all"
                      >
                        নিশ্চিত করুন
                      </button>
                    </>
                  ) : (
                    <button onClick={() => setModal(prev => ({ ...prev, isOpen: false }))} className="w-full px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all">ঠিক আছে</button>
                  )}
                </div>
              </div>
              <button onClick={() => setModal(prev => ({ ...prev, isOpen: false }))} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { margin: 0; size: auto; }
        }
      ` }} />
    </div>
  );
}
