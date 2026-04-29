"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Mic, MicOff, Plus, Trash2, Download, Printer,
  ChevronRight, Eye, Edit3, Globe, Save, FileText, RotateCcw, AlertTriangle, X,
  AlignLeft, AlignCenter, AlignRight, AlignJustify
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
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
    title: 'মাদ্রাসা প্রশ্ন নির্মাতা',
    madrasaName: 'মাদ্রাসার নাম',
    examTitle: 'পরীক্ষার নাম',
    subject: 'বিষয়',
    class: 'জামাত/শ্রেণি',
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
    title: 'مولد أسئلة المدرسة',
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
    title: 'Madrasa Question Maker',
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
    title: 'مدرسہ سوالیہ پرچہ بنانے والا',
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

const DEFAULT_HEADER: HeaderData = {
  madrasaName: '',
  examTitle: '',
  fields: [
    { id: 'subject', label: 'বিষয়', value: '' },
    { id: 'class', label: 'জামাত/শ্রেণি', value: '' },
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
    if (ref.current && ref.current.innerHTML !== value) {
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
  // --- State ---
  const [lang, setLang] = useState<Language>('bn-BD');
  const [paperLang, setPaperLang] = useState<Language>('bn-BD');
  const [voiceLang, setVoiceLang] = useState<Language>('bn-BD');
  const [header, setHeader] = useState<HeaderData>(DEFAULT_HEADER);
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
  const activeFieldRef = useRef<any>(null);
  const voiceLangRef = useRef<Language>('bn-BD');
  const isRecordingRef = useRef<boolean>(false);
  const [headerSizes, setHeaderSizes] = useState<Record<string, number>>({});
  const [headerWeights, setHeaderWeights] = useState<Record<string, boolean>>({});
  const [headerUnderlines, setHeaderUnderlines] = useState<Record<string, boolean>>({});
  const [headerOverlines, setHeaderOverlines] = useState<Record<string, boolean>>({});
  const [headerAlignments, setHeaderAlignments] = useState<Record<string, 'left' | 'center' | 'right' | 'justify'>>({});
  const [isClient, setIsClient] = useState(false);
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm?: () => void;
    type: 'alert' | 'confirm';
  }>({ isOpen: false, title: '', message: '', type: 'alert' });

  // --- Refs ---
  const previewRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

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

  // Global KeyDown for Smart Space Management (Prevent Double Spaces)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.contentEditable === 'true' && e.key === ' ') {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const textBefore = range.startContainer.textContent?.slice(0, range.startOffset) || '';
          if (textBefore.endsWith(' ') || textBefore.endsWith('\u00A0')) {
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
          headerAlignments: sHeaderAlignments
        } = JSON.parse(saved);

        // Migration logic for older versions
        let migHeader = sHeader;
        if (migHeader && !migHeader.fields) {
          migHeader = {
            madrasaName: sHeader.madrasaName || '',
            examTitle: sHeader.examTitle || '',
            fields: [
              { id: 'subject', label: 'বিষয়', value: sHeader.subjectName || '' },
              { id: 'class', label: 'জামাত/শ্রেণি', value: sHeader.className || '' },
              { id: 'date', label: 'তারিখ', value: sHeader.date || '' },
              { id: 'time', label: 'সময়', value: sHeader.time || '' },
              { id: 'fullMarks', label: 'পূর্ণমান', value: sHeader.fullMarks || '' },
            ]
          };
        }

        setHeader(migHeader);
        setQuestions(sQuestions);
        if (sHeaderSizes) setHeaderSizes(sHeaderSizes);
        if (sHeaderWeights) setHeaderWeights(sHeaderWeights);
        if (sHeaderUnderlines) setHeaderUnderlines(sHeaderUnderlines);
        if (sHeaderOverlines) setHeaderOverlines(sHeaderOverlines);
        if (sHeaderAlignments) setHeaderAlignments(sHeaderAlignments);
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
      header, questions, lang, paperLang, headerSizes, headerWeights, headerUnderlines, headerOverlines, headerAlignments
    }));
  }, [header, questions, lang, paperLang, headerSizes, headerWeights, headerUnderlines, headerOverlines, headerAlignments]);

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
    if (!('webkitSpeechRecognition' in window) && !('speechRecognition' in window)) {
      setModal({
        isOpen: true,
        title: 'Error',
        message: "Voice recognition is not supported in this browser.",
        type: 'alert'
      });
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).speechRecognition;
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
          const transcript = event.results[i][0].transcript.trim();
          if (!transcript) return;
          
          const fontClass = voiceLangRef.current === 'ar-SA' ? 'font-naskh' : voiceLangRef.current === 'ur-PK' ? 'font-nastaliq' : '';
          currentTranscript += fontClass ? `<span class="${fontClass}">${transcript}</span>` : transcript;
        }
      }

      if (currentTranscript) {
        const activeEl = document.activeElement as HTMLElement;
        if (activeEl && activeEl.contentEditable === 'true') {
          // Add a space before if needed
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            
            // Check before
            const preRange = range.cloneRange();
            preRange.selectNodeContents(activeEl);
            preRange.setEnd(range.startContainer, range.startOffset);
            const textBefore = preRange.toString();
            const needsLeadingSpace = textBefore.length > 0 && !textBefore.endsWith(' ') && !textBefore.endsWith('\n');

            // Check after
            const postRange = range.cloneRange();
            postRange.selectNodeContents(activeEl);
            postRange.setStart(range.endContainer, range.endOffset);
            const textAfter = postRange.toString();
            const needsTrailingSpace = textAfter.length > 0 && !textAfter.startsWith(' ') && !textAfter.startsWith('\n');
            
            const htmlToInsert = (needsLeadingSpace ? '&nbsp;' : '') + currentTranscript + (needsTrailingSpace ? '&nbsp;' : '');
            document.execCommand('insertHTML', false, htmlToInsert);
          } else {
            document.execCommand('insertHTML', false, currentTranscript);
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
        title: 'Selection Required',
        message: "Please click on a text field first to use voice input.",
        type: 'alert'
      });
      return;
    }

    startRecognition();
  };

  // --- Exports ---
  const exportPDF = async () => {
    if (!previewRef.current) return;
    const canvas = await html2canvas(previewRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${header.madrasaName || 'Question'}_Paper.pdf`);
  };

  const exportWord = async () => {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: header.madrasaName,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: header.examTitle,
            alignment: AlignmentType.CENTER,
          }),
          ...header.fields.map(f => new Paragraph({
            text: `${f.label}: ${f.value}`,
            alignment: AlignmentType.CENTER,
          })),
          new Paragraph({
            text: "",
            border: { bottom: { color: "000000", space: 1, style: BorderStyle.SINGLE, size: 6 } },
          }),
          ...questions.flatMap((q, index) => [
            new Paragraph({
              text: `${getQuestionLabel(index, paperLang)}: ${q.text.replace(/<[^>]*>/g, '')}`,
              spacing: { before: 200 },
            }),
            ...q.subQuestions.map((sq, sIndex) =>
              new Paragraph({
                text: `   (${getSubLabel(sIndex, paperLang)}) ${sq.text.replace(/<[^>]*>/g, '')}`,
                indent: { left: 720 },
              })
            )
          ]),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${header.madrasaName || 'Question'}_Paper.docx`);
  };

  const handlePrint = () => {
    window.print();
  };

  const isRTL = paperLang === 'ar-SA' || paperLang === 'ur-PK' || paperLang === 'fa-IR';
  const t = translations[paperLang];
  const uiT = translations['bn-BD'];

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
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 no-print">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-2 rounded-xl text-white">
              <FileText size={24} />
            </div>
            <h1 className="text-xl font-bold hidden md:block">{uiT.title}</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-slate-100 p-1 rounded-xl flex gap-1 no-print">
              {[
                { code: 'bn-BD', label: 'বাংলা' },
                { code: 'en-US', label: 'English' },
                { code: 'ar-SA', label: 'عربي' },
                { code: 'ur-PK', label: 'اردو' }
              ].map((l) => (
                <button
                  key={l.code}
                  onClick={() => {
                    setPaperLang(l.code as Language);
                    setVoiceLang(l.code as Language);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${paperLang === l.code ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {l.label}
                </button>
              ))}
            </div>

            <div className="h-6 w-px bg-slate-200 mx-2 hidden md:block" />

            <div className="flex gap-2">
              <button
                onClick={resetPaper}
                className="px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600"
                title={uiT.reset}
              >
                <RotateCcw size={16} /> <span className="hidden md:inline">{uiT.reset}</span>
              </button>

              <div className="h-8 w-px bg-slate-200 mx-1" />

              <button
                onClick={() => setView('edit')}
                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${view === 'edit' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                <Edit3 size={16} /> {uiT.edit}
              </button>
              <button
                onClick={() => setView('preview')}
                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${view === 'preview' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                <Eye size={16} /> {uiT.preview}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {view === 'edit' ? (
            <motion.div
              key="edit"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8 no-print"
            >
              <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Edit3 size={20} className="text-emerald-600" /> Header Details
                  </h2>
                  <button onClick={saveDraft} className="btn-secondary text-sm">
                    <Save size={16} /> {uiT.saveDraft}
                  </button>
                </div>

                <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${isRTL ? 'rtl' : 'ltr'}`}>
                  <div className="md:col-span-2 relative">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">{t.madrasaName}</label>
                    <div className="relative">
                      <EditableText
                        value={header.madrasaName}
                        onChange={(val: string) => setHeader({ ...header, madrasaName: val })}
                        onFocus={() => setActiveField({ id: 'madrasaName', type: 'header', fieldName: 'madrasaName' })}
                        style={{
                          fontSize: `${headerSizes.madrasaName || 24}px`,
                          fontWeight: headerWeights.madrasaName ? 'bold' : 'normal',
                          textDecoration: `${headerUnderlines.madrasaName ? 'underline' : ''} ${headerOverlines.madrasaName ? 'overline' : ''}`.trim(),
                          textAlign: headerAlignments.madrasaName || (isRTL ? 'right' : 'left')
                        }}
                        className={`input-field min-h-[44px] ${getFontClass(paperLang)}`}
                        placeholder={t.madrasaName}
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">{t.examTitle}</label>
                    <div className="relative">
                      <EditableText
                        value={header.examTitle}
                        onChange={(val: string) => setHeader({ ...header, examTitle: val })}
                        onFocus={() => setActiveField({ id: 'examTitle', type: 'header', fieldName: 'examTitle' })}
                        style={{
                          fontSize: `${headerSizes.examTitle || 20}px`,
                          fontWeight: headerWeights.examTitle ? 'bold' : 'normal',
                          textDecoration: `${headerUnderlines.examTitle ? 'underline' : ''} ${headerOverlines.examTitle ? 'overline' : ''}`.trim(),
                          textAlign: headerAlignments.examTitle || (isRTL ? 'right' : 'left')
                        }}
                        className="input-field min-h-[44px]"
                        placeholder={t.examTitle}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {header.fields?.map((f) => (
                      <div key={f.id} className="relative group bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="flex items-center justify-between mb-1">
                          <input
                            type="text"
                            value={f.label}
                            onChange={(e) => updateHeaderField(f.id, 'label', e.target.value)}
                            className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-transparent outline-none focus:text-emerald-600 w-full"
                            placeholder="বক্সের নাম"
                          />
                          <button
                            onClick={() => removeHeaderField(f.id)}
                            className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                          <EditableText
                            value={f.value}
                            onChange={(val: string) => updateHeaderField(f.id, 'value', val)}
                            onFocus={() => setActiveField({ id: f.id, type: 'header', fieldName: 'dynamic', fieldId: f.id })}
                            style={{
                              fontSize: `${headerSizes[f.id] || 16}px`,
                              fontWeight: headerWeights[f.id] ? 'bold' : 'normal',
                              textDecoration: `${headerUnderlines[f.id] ? 'underline' : ''} ${headerOverlines[f.id] ? 'overline' : ''}`.trim(),
                              textAlign: headerAlignments[f.id] || (isRTL ? 'right' : 'left')
                            }}
                            className="w-full bg-white rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 transition-all min-h-[40px]"
                            placeholder={f.label}
                          />
                      </div>
                    ))}
                    <button
                      onClick={addHeaderField}
                      className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-4 text-slate-400 hover:border-emerald-300 hover:text-emerald-600 transition-all gap-1"
                    >
                      <Plus size={20} />
                      <span className="text-[10px] font-bold uppercase">নতুন বক্স</span>
                    </button>
                  </div>
                </div>
              </section>

              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <FileText size={24} className="text-emerald-600" /> {t.question} List
                  </h2>
                  <div className="flex gap-2">
                    <button onClick={addPageBreak} className="btn-secondary">
                      <RotateCcw size={18} className="rotate-90" /> {uiT.addPageBreak || 'Add Page Break'}
                    </button>
                    <button onClick={addQuestion} className="btn-primary">
                      <Plus size={18} /> {uiT.addQuestion}
                    </button>
                  </div>
                </div>

                <div className={isRTL ? 'rtl' : 'ltr'}>
                  <div className="space-y-6">
                    {questions.map((q, index) => (
                      q.isPageBreak ? (
                        <div key={q.id} className="flex items-center gap-4 no-print py-4">
                          <div className="flex-1 h-px bg-slate-200 border-dashed border-b-2" />
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Next Page Starts Here</span>
                          <button onClick={() => removeQuestion(q.id)} className="text-slate-300 hover:text-red-500">
                            <Trash2 size={16} />
                          </button>
                          <div className="flex-1 h-px bg-slate-200 border-dashed border-b-2" />
                        </div>
                      ) : (
                        <div key={q.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative group">
                          <div className="flex items-start gap-4">
                            <div className="bg-emerald-100 text-emerald-700 w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                              {getNativeNumber(index + 1, paperLang)}
                            </div>
                            <div className="flex-1 space-y-4">
                              <div className="relative">
                                <EditableText
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
                              </div>

                              <div className="pl-6 border-l-2 border-slate-100 space-y-3">
                                {q.subQuestions.map((sq, sqIndex) => (
                                  <div key={sq.id} className="flex gap-2">
                                    <input
                                      type="text"
                                      value={sq.manualLabel || getSubLabel(sqIndex, paperLang)}
                                      onChange={(e) => updateSubQuestionLabel(q.id, sq.id, e.target.value)}
                                      className="w-12 text-slate-400 mt-1 font-medium bg-transparent outline-none text-center"
                                    />
                                    <div className="relative flex-1">
                                      <EditableText
                                        value={sq.text}
                                        onChange={(val: string) => updateSubQuestionText(q.id, sq.id, val)}
                                        onFocus={() => setActiveField({ id: sq.id, type: 'subquestion', qId: q.id })}
                                        style={{
                                          fontSize: `${sq.fontSize || 16}px`,
                                          fontWeight: sq.isBold ? 'bold' : 'normal',
                                          textDecoration: `${sq.isUnderline ? 'underline' : ''} ${sq.isOverline ? 'overline' : ''}`.trim(),
                                          textAlign: sq.alignment || (isRTL ? 'right' : 'left')
                                        }}
                                        className={`input-field min-h-[40px] p-2 ${getFontClass(paperLang)}`}
                                        placeholder={t.placeholderSubQuestion}
                                      />
                                    </div>
                                    <button onClick={() => removeSubQuestion(q.id, sq.id)} className="text-slate-300 hover:text-red-500 p-2 transition-colors">
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                ))}
                                <button onClick={() => addSubQuestion(q.id)} className="text-emerald-600 hover:text-emerald-700 text-sm font-bold flex items-center gap-1 mt-2">
                                  <Plus size={16} /> {t.addSubQuestion}
                                </button>
                              </div>
                            </div>

                            <button
                              onClick={() => removeQuestion(q.id)}
                              className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 p-2 transition-all"
                            >
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
            <motion.div
              key="preview"
              className="space-y-8"
            >
              <div className="flex flex-wrap items-center justify-center gap-4 no-print">
                <button onClick={exportPDF} className="btn-primary">
                  <Download size={18} /> {uiT.downloadPDF}
                </button>
                <button onClick={exportWord} className="btn-primary bg-blue-600 hover:bg-blue-700">
                  <FileText size={18} /> {uiT.downloadWord}
                </button>
                <button onClick={handlePrint} className="btn-secondary">
                  <Printer size={18} /> {uiT.print}
                </button>
              </div>

              <div
                ref={previewRef}
                className={`paper-preview print-area ${isRTL ? 'rtl' : 'ltr'}`}
                id="printable-paper"
              >
                <div className="text-center space-y-2 mb-6">
                  <h1
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => setHeader({ ...header, madrasaName: e.currentTarget.innerHTML })}
                    style={{
                      fontSize: `${headerSizes.madrasaName || 24}px`,
                      fontWeight: headerWeights.madrasaName ? 'bold' : 'normal',
                      textDecoration: `${headerUnderlines.madrasaName ? 'underline' : ''} ${headerOverlines.madrasaName ? 'overline' : ''}`.trim(),
                      textAlign: headerAlignments.madrasaName || (isRTL ? 'right' : 'left')
                    }}
                    className={`outline-none hover:bg-slate-50 transition-colors rounded px-2 py-1 ${getFontClass(paperLang)}`}
                    dangerouslySetInnerHTML={{ __html: header.madrasaName || 'Madrasa Name' }}
                  />
                  <h2
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => setHeader({ ...header, examTitle: e.currentTarget.innerHTML })}
                    style={{
                      fontSize: `${headerSizes.examTitle || 20}px`,
                      fontWeight: headerWeights.examTitle ? 'bold' : 'normal',
                      textDecoration: `${headerUnderlines.examTitle ? 'underline' : ''} ${headerOverlines.examTitle ? 'overline' : ''}`.trim(),
                      textAlign: headerAlignments.examTitle || (isRTL ? 'right' : 'left')
                    }}
                    className={`outline-none hover:bg-slate-50 transition-colors rounded px-2 py-1 ${getFontClass(paperLang)}`}
                    dangerouslySetInnerHTML={{ __html: header.examTitle || 'Exam Title' }}
                  />
                </div>

                <div className="border-b-2 border-slate-900 pb-4 mb-8">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-4">
                    {header.fields?.map(f => (
                      <div key={f.id} className="flex gap-2 text-sm">
                        <span
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => updateHeaderField(f.id, 'label', e.currentTarget.textContent || '')}
                          className="font-bold whitespace-nowrap outline-none hover:bg-slate-50 px-1 rounded"
                        >
                          {f.label}
                        </span>
                        <span className="font-bold -ml-2">:</span>
                        <span
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => updateHeaderField(f.id, 'value', e.currentTarget.innerHTML)}
                          style={{
                            fontSize: `${headerSizes[f.id] || 16}px`,
                            fontWeight: headerWeights[f.id] ? 'bold' : 'normal',
                            textDecoration: `${headerUnderlines[f.id] ? 'underline' : ''} ${headerOverlines[f.id] ? 'overline' : ''}`.trim(),
                            textAlign: headerAlignments[f.id] || (isRTL ? 'right' : 'left')
                          }}
                          className="outline-none hover:bg-slate-50 px-1 rounded flex-1 min-w-[20px]"
                          dangerouslySetInnerHTML={{ __html: f.value }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-8">
                  {questions.map((q, index) => (
                    q.isPageBreak ? (
                      <div key={q.id} className="page-break" style={{ breakBefore: 'page', height: '20px' }} />
                    ) : (
                      <div key={q.id} className="space-y-4">
                        <div className="flex gap-3">
                          <span className="font-bold whitespace-nowrap" style={{ fontSize: `${q.fontSize || 18}px` }}>{getQuestionLabel(index, paperLang)}:</span>
                          <p
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => updateQuestionText(q.id, e.currentTarget.innerHTML)}
                            style={{
                              fontSize: `${q.fontSize || 18}px`,
                              fontWeight: q.isBold ? 'bold' : 'normal',
                              textDecoration: `${q.isUnderline ? 'underline' : ''} ${q.isOverline ? 'overline' : ''}`.trim(),
                              textAlign: q.alignment || (isRTL ? 'right' : 'left')
                            }}
                            className={`flex-1 outline-none hover:bg-slate-50 transition-colors rounded px-2 py-1 -mt-1 ${getFontClass(paperLang)} leading-relaxed`}
                            dangerouslySetInnerHTML={{ __html: q.text }}
                          />
                        </div>

                        {q.subQuestions.length > 0 && (
                          <div className="grid grid-cols-1 gap-3 pl-8">
                            {q.subQuestions.map((sq, sqIndex) => (
                              <div key={sq.id} className="flex gap-3">
                                <span
                                  contentEditable
                                  suppressContentEditableWarning
                                  onBlur={(e) => updateSubQuestionLabel(q.id, sq.id, e.currentTarget.textContent || '')}
                                  className="font-medium whitespace-nowrap outline-none hover:bg-slate-50 px-1 rounded"
                                  style={{
                                    fontSize: `${sq.fontSize || 16}px`,
                                    fontWeight: sq.isBold ? 'bold' : 'normal'
                                  }}
                                >
                                  {sq.manualLabel || getSubLabel(sqIndex, paperLang)}
                                </span>
                                <p
                                  contentEditable
                                  suppressContentEditableWarning
                                  onBlur={(e) => updateSubQuestionText(q.id, sq.id, e.currentTarget.innerHTML)}
                                  style={{ 
                                    fontSize: `${sq.fontSize || 16}px`,
                                    textAlign: sq.alignment || (isRTL ? 'right' : 'left')
                                  }}
                                  className={`flex-1 outline-none hover:bg-slate-50 transition-colors rounded px-2 py-1 -mt-1 ${getFontClass(paperLang)}`}
                                  dangerouslySetInnerHTML={{ __html: sq.text }}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Sidebar */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 no-print z-50">
        <div className="bg-white p-3 rounded-2xl shadow-2xl border border-slate-100 flex flex-col gap-4">
          <button
            onClick={toggleRecording}
            className={`p-4 rounded-xl transition-all duration-300 shadow-lg ${isRecording ? 'bg-red-500 text-white animate-pulse scale-110' : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:scale-105'}`}
            title={t.voiceStart}
          >
            {isRecording ? <MicOff size={24} /> : <Mic size={24} />}
          </button>

          <div className="h-px bg-slate-100 mx-2" />

          {/* Language Selection Buttons */}
          <div className="flex flex-col gap-2">
            {[
              { code: 'bn-BD', label: 'বাংলা' },
              { code: 'en-US', label: 'English' },
              { code: 'ar-SA', label: 'العربية' },
              { code: 'ur-PK', label: 'اردو' }
            ].map((l) => (
              <button
                key={l.code}
                onClick={() => setVoiceLang(l.code as Language)}
                className={`w-full px-3 py-2 rounded-xl text-[10px] font-bold transition-all shadow-sm whitespace-nowrap ${voiceLang === l.code ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-500 hover:bg-emerald-50'}`}
              >
                {l.label}
              </button>
            ))}
          </div>

          <div className="h-px bg-slate-100 mx-2" />

          {/* Font Size Controls */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => adjustFontSize(2)}
              className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 font-bold transition-all shadow-sm flex items-center justify-center"
              title="Increase Font Size"
            >
              A+
            </button>
            <button
              onClick={() => adjustFontSize(-2)}
              className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 font-bold transition-all shadow-sm flex items-center justify-center"
              title="Decrease Font Size"
            >
              A-
            </button>
          </div>

          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={toggleBold}
            className="p-3 rounded-xl bg-slate-50 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm font-bold text-lg"
            title="Toggle Bold"
          >
            B
          </button>

          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={toggleUnderline}
            className="p-3 rounded-xl bg-slate-50 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm font-bold text-lg"
            title="Toggle Underline"
            style={{ textDecoration: 'underline' }}
          >
            U
          </button>

          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={toggleOverline}
            className="p-3 rounded-xl bg-slate-50 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm font-bold text-lg"
            title="Toggle Overline"
            style={{ textDecoration: 'overline' }}
          >
            O
          </button>

          <div className="h-px bg-slate-100 mx-2" />

          {/* Alignment Controls */}
          <div className="grid grid-cols-2 gap-1 px-1">
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => updateAlignment('left')}
              className={`p-2 rounded-lg transition-all flex items-center justify-center ${activeField ? 'bg-slate-50 text-slate-600 hover:bg-indigo-50' : 'bg-slate-50/50 text-slate-300 cursor-not-allowed'}`}
              title="Align Left"
            >
              <AlignLeft size={16} />
            </button>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => updateAlignment('center')}
              className={`p-2 rounded-lg transition-all flex items-center justify-center ${activeField ? 'bg-slate-50 text-slate-600 hover:bg-indigo-50' : 'bg-slate-50/50 text-slate-300 cursor-not-allowed'}`}
              title="Align Center"
            >
              <AlignCenter size={16} />
            </button>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => updateAlignment('right')}
              className={`p-2 rounded-lg transition-all flex items-center justify-center ${activeField ? 'bg-slate-50 text-slate-600 hover:bg-indigo-50' : 'bg-slate-50/50 text-slate-300 cursor-not-allowed'}`}
              title="Align Right"
            >
              <AlignRight size={16} />
            </button>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => updateAlignment('justify')}
              className={`p-2 rounded-lg transition-all flex items-center justify-center ${activeField ? 'bg-slate-50 text-slate-600 hover:bg-indigo-50' : 'bg-slate-50/50 text-slate-300 cursor-not-allowed'}`}
              title="Align Justify"
            >
              <AlignJustify size={16} />
            </button>
          </div>

          <div className="h-px bg-slate-100 mx-2" />

          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => applyFont('font-naskh')}
            className="p-3 rounded-xl bg-slate-50 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 transition-all shadow-sm font-bold text-xs"
            title="Arabic Font (Naskh)"
          >
            ع
          </button>

          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => applyFont('font-nastaliq')}
            className="p-3 rounded-xl bg-slate-50 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 transition-all shadow-sm font-bold text-xs"
            title="Urdu Font (Nastaliq)"
          >
            اردو
          </button>
        </div>

        {isRecording && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-xs font-bold shadow-sm whitespace-nowrap border border-red-100"
          >
            {t.voiceStart}
          </motion.div>
        )}
      </div>

      {/* Custom Modal */}
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
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
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
                    <button
                      onClick={() => setModal(prev => ({ ...prev, isOpen: false }))}
                      className="w-full px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all"
                    >
                      ঠিক আছে
                    </button>
                  )}
                </div>
              </div>
              <button
                onClick={() => setModal(prev => ({ ...prev, isOpen: false }))}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Printing Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            margin: 0;
            size: auto;
          }
        }
      ` }} />
    </div>
  );
}
