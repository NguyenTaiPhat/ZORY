'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  List,
  X,
  Square,
  Volume2,
  Globe,
  ChevronDown,
  Check,
} from 'lucide-react';
import {
  segmentBilingualText,
  findBestVoiceForLang,
  SpeechSegment,
} from '@/lib/tts/bilingualDetector';
import { InlineParagraphItem } from './InlineParagraphItem';
import { InlineCommentDrawer } from './InlineCommentDrawer';
import { BranchingChoicesSection } from './BranchingChoicesSection';

interface ZoryReaderProps {
  book: {
    id: string;
    title: string;
    slug: string;
    authorName: string | null;
  };
  chapter: {
    id: string;
    chapterNumber: number;
    title: string;
    content: string;
    wordCount: number;
  };
  prevChapter: { id: string; chapterNumber: number; title: string } | null;
  nextChapter: { id: string; chapterNumber: number; title: string } | null;
  allChapters: { id: string; chapterNumber: number; title: string }[];
  initialProgress?: number;
}

export function ZoryReader({
  book,
  chapter,
  prevChapter,
  nextChapter,
  allChapters,
  initialProgress = 0,
}: ZoryReaderProps) {
  const router = useRouter();
  const contentRef = useRef<HTMLDivElement>(null);

  // Settings
  const [readerTheme, setReaderTheme] = useState<'light' | 'sepia' | 'dark'>('light');
  const [fontSize, setFontSize] = useState<number>(18);
  const [lineHeight] = useState<number>(1.85);
  const [readerWidth, setReaderWidth] = useState<'narrow' | 'medium' | 'wide'>('medium');
  const [fontFamily, setFontFamily] = useState<'serif' | 'sans'>('serif');

  // UI States
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [progressPercent, setProgressPercent] = useState<number>(initialProgress);

  // TTS Bilingual Voice State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeLang, setActiveLang] = useState<'vi-VN' | 'en-US'>('vi-VN');
  const [ttsSpeed, setTtsSpeed] = useState<number>(1.0);
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false);
  const ttsSpeedRef = useRef<number>(1.0);
  const segmentsRef = useRef<SpeechSegment[]>([]);
  const segmentIdxRef = useRef<number>(0);
  const isSpeakingRef = useRef<boolean>(false);
  const readerAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentBlobUrlRef = useRef<string | null>(null);

  // Đồng bộ tiêu đề tab theo tên chương & tên truyện
  useEffect(() => {
    if (typeof document !== 'undefined' && book?.title && chapter?.title) {
      const chName = chapter.title.startsWith('Chương')
        ? chapter.title
        : `Chương ${chapter.chapterNumber}: ${chapter.title}`;
      document.title = `${chName} — ${book.title} | ZORY`;
    }
  }, [book?.title, chapter?.title, chapter?.chapterNumber]);

  // Inline Paragraph Interactions State
  const [interactions, setInteractions] = useState<{
    reactions: Record<number, Record<string, number>>;
    userReactions: Record<number, string>;
    commentsCount: Record<number, number>;
  }>({
    reactions: {},
    userReactions: {},
    commentsCount: {},
  });
  const [activeCommentParagraph, setActiveCommentParagraph] = useState<{
    index: number;
    text: string;
  } | null>(null);

  const getGuestId = useCallback(() => {
    if (typeof window === 'undefined') return 'guest';
    let gId = localStorage.getItem('zory_guest_id');
    if (!gId) {
      gId = 'g_' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem('zory_guest_id', gId);
    }
    return gId;
  }, []);

  const fetchInteractions = useCallback(async () => {
    try {
      const gId = getGuestId();
      const res = await fetch(`/api/chapters/${chapter.id}/inline-interactions?guestId=${encodeURIComponent(gId)}`);
      if (res.ok) {
        const data = await res.json();
        setInteractions({
          reactions: data.reactions || {},
          userReactions: data.userReactions || {},
          commentsCount: data.commentsCount || {},
        });
      }
    } catch {}
  }, [chapter.id, getGuestId]);

  useEffect(() => {
    fetchInteractions();
  }, [fetchInteractions]);

  const handleReact = async (paragraphIndex: number, reaction: string) => {
    // Optimistic UI update
    setInteractions((prev) => {
      const current = prev.userReactions[paragraphIndex];
      const isRemoving = current === reaction;
      const nextUserReaction = isRemoving ? '' : reaction;

      const pReactions = { ...(prev.reactions[paragraphIndex] || {}) };
      if (current) {
        pReactions[current] = Math.max(0, (pReactions[current] || 1) - 1);
        if (pReactions[current] === 0) delete pReactions[current];
      }
      if (!isRemoving) {
        pReactions[reaction] = (pReactions[reaction] || 0) + 1;
      }

      return {
        ...prev,
        userReactions: {
          ...prev.userReactions,
          [paragraphIndex]: nextUserReaction,
        },
        reactions: {
          ...prev.reactions,
          [paragraphIndex]: pReactions,
        },
      };
    });

    try {
      const res = await fetch(`/api/chapters/${chapter.id}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paragraphIndex,
          reaction,
          guestId: getGuestId(),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.reactions) {
          setInteractions((prev) => ({
            ...prev,
            reactions: {
              ...prev.reactions,
              [paragraphIndex]: data.reactions,
            },
            userReactions: {
              ...prev.userReactions,
              [paragraphIndex]: data.currentReaction || '',
            },
          }));
        }
      } else {
        fetchInteractions();
      }
    } catch {
      fetchInteractions();
    }
  };
  useEffect(() => {
    const savedTheme = localStorage.getItem('zory_reader_theme') as any;
    if (savedTheme) setReaderTheme(savedTheme);

    const savedSize = localStorage.getItem('zory_reader_font_size');
    if (savedSize) setFontSize(Number(savedSize));

    const savedWidth = localStorage.getItem('zory_reader_width') as any;
    if (savedWidth) setReaderWidth(savedWidth);

    const savedFont = localStorage.getItem('zory_reader_font') as any;
    if (savedFont) setFontFamily(savedFont);

    const savedSpeed = localStorage.getItem('zory_tts_speed');
    if (savedSpeed) {
      const parsed = parseFloat(savedSpeed);
      if (!isNaN(parsed) && parsed > 0) {
        setTtsSpeed(parsed);
        ttsSpeedRef.current = parsed;
      }
    }
  }, []);

  const saveProgress = useCallback(
    (percent: number, scroll: number) => {
      fetch('/api/reader/progress', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: book.id,
          chapterId: chapter.id,
          progressPercent: percent,
          scrollPosition: scroll,
        }),
      }).catch(() => {});
    },
    [book.id, chapter.id]
  );

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const currentScroll = window.scrollY;
        const currentPercent = Math.min(100, Math.max(0, Math.round((currentScroll / totalHeight) * 100)));
        setProgressPercent(currentPercent);

        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          saveProgress(currentPercent, currentScroll);
        }, 1200);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, [saveProgress]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'ArrowLeft' && prevChapter) {
        router.push(`/read/${book.slug}/${prevChapter.chapterNumber}`);
      } else if (e.key === 'ArrowRight' && nextChapter) {
        router.push(`/read/${book.slug}/${nextChapter.chapterNumber}`);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prevChapter, nextChapter, book.slug, router]);

  const speakSegment = async () => {
    const segs = segmentsRef.current;
    if (segmentIdxRef.current >= segs.length) {
      setIsSpeaking(false);
      isSpeakingRef.current = false;
      return;
    }

    const seg = segs[segmentIdxRef.current];
    setActiveLang(seg.lang);

    // Dừng audio cũ & giải phóng blob url
    if (readerAudioRef.current) {
      readerAudioRef.current.pause();
      readerAudioRef.current = null;
    }
    if (currentBlobUrlRef.current) {
      URL.revokeObjectURL(currentBlobUrlRef.current);
      currentBlobUrlRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    const voices =
      typeof window !== 'undefined' && 'speechSynthesis' in window
        ? window.speechSynthesis.getVoices()
        : [];
    const voice = findBestVoiceForLang(seg.lang, voices);

    // Tiếng Việt không có giọng máy -> Dùng Cloud AI TTS qua fetch (đính kèm đầy đủ nonce & token)
    if (seg.lang === 'vi-VN' && !voice) {
      const audioUrl = `/api/tts?text=${encodeURIComponent(seg.text)}&lang=vi`;
      try {
        const res = await fetch(audioUrl);
        if (!res.ok) {
          throw new Error(`Cloud TTS error ${res.status}`);
        }
        if (!isSpeakingRef.current) return;

        const blob = await res.blob();
        if (!isSpeakingRef.current) return;

        const blobUrl = URL.createObjectURL(blob);
        currentBlobUrlRef.current = blobUrl;

        const audio = new Audio(blobUrl);
        audio.playbackRate = ttsSpeedRef.current;
        readerAudioRef.current = audio;

        audio.onended = () => {
          if (currentBlobUrlRef.current === blobUrl) {
            URL.revokeObjectURL(blobUrl);
            currentBlobUrlRef.current = null;
          }
          if (!isSpeakingRef.current) return;
          segmentIdxRef.current += 1;
          speakSegment();
        };

        audio.onerror = () => {
          if (currentBlobUrlRef.current === blobUrl) {
            URL.revokeObjectURL(blobUrl);
            currentBlobUrlRef.current = null;
          }
          if (!isSpeakingRef.current) return;
          segmentIdxRef.current += 1;
          if (segmentIdxRef.current < segs.length) {
            speakSegment();
          } else {
            setIsSpeaking(false);
            isSpeakingRef.current = false;
          }
        };

        await audio.play().catch(console.warn);
      } catch (err) {
        console.warn('Lỗi Cloud TTS, chuyển câu tiếp:', err);
        if (!isSpeakingRef.current) return;
        segmentIdxRef.current += 1;
        if (segmentIdxRef.current < segs.length) {
          speakSegment();
        } else {
          setIsSpeaking(false);
          isSpeakingRef.current = false;
        }
      }
      return;
    }

    // Tiếng Anh hoặc có sẵn giọng tiếng Việt tích hợp
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(seg.text);
      utterance.lang = seg.lang;
      utterance.rate = ttsSpeedRef.current;

      if (voice) {
        utterance.voice = voice;
      }

      utterance.onend = () => {
        if (!isSpeakingRef.current) return;
        segmentIdxRef.current += 1;
        speakSegment();
      };

      utterance.onerror = () => {
        if (!isSpeakingRef.current) return;
        segmentIdxRef.current += 1;
        if (segmentIdxRef.current < segs.length) {
          speakSegment();
        } else {
          setIsSpeaking(false);
          isSpeakingRef.current = false;
        }
      };

      window.speechSynthesis.speak(utterance);
    }
  };

  const changeTtsSpeed = (newSpeed: number) => {
    setTtsSpeed(newSpeed);
    ttsSpeedRef.current = newSpeed;
    if (typeof window !== 'undefined') {
      localStorage.setItem('zory_tts_speed', String(newSpeed));
    }

    if (readerAudioRef.current) {
      readerAudioRef.current.playbackRate = newSpeed;
    } else if (isSpeakingRef.current && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      speakSegment();
    }
  };

  const toggleTTS = () => {
    if (isSpeaking) {
      if (readerAudioRef.current) {
        readerAudioRef.current.pause();
        readerAudioRef.current = null;
      }
      if (currentBlobUrlRef.current) {
        URL.revokeObjectURL(currentBlobUrlRef.current);
        currentBlobUrlRef.current = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      return;
    }

    if (readerAudioRef.current) {
      readerAudioRef.current.pause();
      readerAudioRef.current = null;
    }
    if (currentBlobUrlRef.current) {
      URL.revokeObjectURL(currentBlobUrlRef.current);
      currentBlobUrlRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    segmentsRef.current = segmentBilingualText(chapter.content);
    segmentIdxRef.current = 0;
    isSpeakingRef.current = true;
    setIsSpeaking(true);
    speakSegment();
  };

  useEffect(() => {
    return () => {
      if (readerAudioRef.current) {
        readerAudioRef.current.pause();
        readerAudioRef.current = null;
      }
      if (currentBlobUrlRef.current) {
        URL.revokeObjectURL(currentBlobUrlRef.current);
        currentBlobUrlRef.current = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      isSpeakingRef.current = false;
    };
  }, [chapter.id]);

  const getThemeClass = () => {
    if (readerTheme === 'sepia') return 'reader-theme-sepia';
    if (readerTheme === 'dark') return 'reader-theme-dark';
    return 'reader-theme-light';
  };

  const getWidthClass = () => {
    if (readerWidth === 'narrow') return 'max-w-2xl';
    if (readerWidth === 'wide') return 'max-w-4xl';
    return 'max-w-3xl';
  };

  const getHeaderBgClass = () => {
    if (readerTheme === 'sepia') return 'bg-[#F4EEDD] border-[#E2DBD0]';
    if (readerTheme === 'dark') return 'bg-[#0E0D13] border-[#242032]';
    return 'bg-[#FAF9F6] border-[#E2DBD0]';
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${getThemeClass()}`}>
      {/* Top Hairline Progress */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-border/40 z-50">
        <div
          className="h-full bg-primary transition-all duration-150"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Floating Reader Header (Sole Top Header) */}
      <header className={`sticky top-0 z-40 border-b px-4 sm:px-6 py-3 transition-colors ${getHeaderBgClass()}`}>
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={`/book/${book.slug}`}
              className="p-1.5 border border-border/80 hover:bg-black/5 dark:hover:bg-white/5 transition flex-shrink-0"
              title="Quay lại tác phẩm"
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>

            <div className="min-w-0">
              <h1 className="text-xs sm:text-sm font-semibold truncate leading-tight">
                {book.title}
              </h1>
              <p className="text-[11px] font-mono opacity-70 truncate">
                CHƯƠNG {chapter.chapterNumber}: {chapter.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Audio Toggle & Speed Selector */}
            <div className="relative flex items-center">
              <button
                onClick={toggleTTS}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border transition ${
                  isSpeaking
                    ? 'bg-primary text-white border-primary'
                    : 'border-border/80 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
                title={isSpeaking ? 'Dừng đọc' : 'Đọc giọng nói (ZORY Voice)'}
              >
                {isSpeaking ? (
                  <>
                    <Square className="w-3 h-3 fill-current" />
                    <span className="hidden sm:inline">
                      DỪNG [{activeLang === 'vi-VN' ? 'VI' : 'EN'}]
                    </span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-primary" />
                    <span className="hidden sm:inline">NGHE (VI/EN)</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setSpeedMenuOpen(!speedMenuOpen)}
                className={`flex items-center gap-0.5 px-2 py-1.5 text-xs font-mono border border-l-0 transition ${
                  isSpeaking
                    ? 'bg-primary/90 text-white border-primary hover:bg-primary'
                    : 'border-border/80 text-text-primary hover:bg-black/5 dark:hover:bg-white/5'
                }`}
                title="Tùy chỉnh tốc độ đọc"
              >
                <span>{ttsSpeed}x</span>
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>

              {/* Dropdown chỉnh tốc độ đọc */}
              {speedMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setSpeedMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1.5 z-50 w-36 py-1 bg-surface border border-border shadow-xl">
                    <div className="px-3 py-1 text-[10px] font-mono text-text-secondary border-b border-border/80 mb-0.5">
                      TỐC ĐỘ ĐỌC (TTS)
                    </div>
                    {[0.75, 1.0, 1.25, 1.5, 1.75, 2.0].map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          changeTtsSpeed(s);
                          setSpeedMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-mono transition text-left ${
                          ttsSpeed === s
                            ? 'bg-primary/10 text-primary font-bold'
                            : 'text-text-primary hover:bg-surface-elevated'
                        }`}
                      >
                        <span>{s}x</span>
                        {s === 1.0 && <span className="text-[10px] opacity-60">Chuẩn</span>}
                        {s === 1.25 && <span className="text-[10px] opacity-60">Nhanh</span>}
                        {s === 1.5 && <span className="text-[10px] opacity-60">1.5x</span>}
                        {s === 2.0 && <span className="text-[10px] opacity-60">2.0x</span>}
                        {ttsSpeed === s && <Check className="w-3.5 h-3.5 text-primary ml-auto" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Index Drawer Button */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="p-2 border border-border/80 hover:bg-black/5 dark:hover:bg-white/5 transition"
              title="Mục lục chương"
            >
              <List className="w-4 h-4" />
            </button>

            {/* Typography & Display Settings */}
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className="p-2 border border-border/80 hover:bg-black/5 dark:hover:bg-white/5 transition"
              title="Tùy chỉnh đọc"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Reader Settings Modal */}
      {settingsOpen && (
        <div className="fixed top-14 right-4 sm:right-12 z-50 w-72 p-5 bg-surface border border-border shadow-xl text-text-primary space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="label-caps">TÙY CHỈNH ĐỌC SÁCH</span>
            <button
              onClick={() => setSettingsOpen(false)}
              className="p-1 text-text-secondary hover:text-text-primary"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Canvas Tone */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono uppercase text-text-secondary">Chế độ trang giấy:</span>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  setReaderTheme('light');
                  localStorage.setItem('zory_reader_theme', 'light');
                }}
                className={`py-1.5 text-xs font-medium border text-[#252331] bg-[#FAF9F6] ${
                  readerTheme === 'light' ? 'border-primary ring-1 ring-primary' : 'border-border'
                }`}
              >
                Giấy ngà
              </button>
              <button
                onClick={() => {
                  setReaderTheme('sepia');
                  localStorage.setItem('zory_reader_theme', 'sepia');
                }}
                className={`py-1.5 text-xs font-medium border text-[#433A2E] bg-[#F4EEDD] ${
                  readerTheme === 'sepia' ? 'border-primary ring-1 ring-primary' : 'border-border'
                }`}
              >
                Sepia
              </button>
              <button
                onClick={() => {
                  setReaderTheme('dark');
                  localStorage.setItem('zory_reader_theme', 'dark');
                }}
                className={`py-1.5 text-xs font-medium border text-[#DDD9E8] bg-[#0E0D13] ${
                  readerTheme === 'dark' ? 'border-primary ring-1 ring-primary' : 'border-border'
                }`}
              >
                Hắc diện
              </button>
            </div>
          </div>

          {/* Font Size */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-mono text-text-secondary">
              <span>CỠ CHỮ:</span>
              <span>{fontSize}PX</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const s = Math.max(14, fontSize - 1);
                  setFontSize(s);
                  localStorage.setItem('zory_reader_font_size', String(s));
                }}
                className="px-2 py-1 text-xs border border-border bg-surface-elevated font-mono"
              >
                A-
              </button>
              <input
                type="range"
                min="14"
                max="28"
                value={fontSize}
                onChange={(e) => {
                  const s = Number(e.target.value);
                  setFontSize(s);
                  localStorage.setItem('zory_reader_font_size', String(s));
                }}
                className="flex-1 accent-primary"
              />
              <button
                onClick={() => {
                  const s = Math.min(28, fontSize + 1);
                  setFontSize(s);
                  localStorage.setItem('zory_reader_font_size', String(s));
                }}
                className="px-2 py-1 text-xs border border-border bg-surface-elevated font-mono"
              >
                A+
              </button>
            </div>
          </div>

          {/* Width */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono uppercase text-text-secondary">Khổ giấy:</span>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {(['narrow', 'medium', 'wide'] as const).map((w) => (
                <button
                  key={w}
                  onClick={() => {
                    setReaderWidth(w);
                    localStorage.setItem('zory_reader_width', w);
                  }}
                  className={`py-1.5 border capitalize ${
                    readerWidth === w
                      ? 'border-primary bg-primary/10 text-primary font-bold'
                      : 'border-border text-text-primary bg-surface-elevated'
                  }`}
                >
                  {w === 'narrow' ? 'Hẹp' : w === 'medium' ? 'Vừa' : 'Rộng'}
                </button>
              ))}
            </div>
          </div>

          {/* Typography Face */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono uppercase text-text-secondary">Bộ phông:</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => {
                  setFontFamily('serif');
                  localStorage.setItem('zory_reader_font', 'serif');
                }}
                className={`py-1.5 border font-serif ${
                  fontFamily === 'serif'
                    ? 'border-primary bg-primary/10 text-primary font-bold'
                    : 'border-border bg-surface-elevated'
                }`}
              >
                Lora (Văn học)
              </button>
              <button
                onClick={() => {
                  setFontFamily('sans');
                  localStorage.setItem('zory_reader_font', 'sans');
                }}
                className={`py-1.5 border font-sans ${
                  fontFamily === 'sans'
                    ? 'border-primary bg-primary/10 text-primary font-bold'
                    : 'border-border bg-surface-elevated'
                }`}
              >
                Inter (Hiện đại)
              </button>
            </div>
          </div>

          {/* Audio TTS Playback Speed */}
          <div className="space-y-1.5 pt-2 border-t border-border">
            <div className="flex justify-between text-[11px] font-mono text-text-secondary">
              <span>TỐC ĐỘ GIỌNG ĐỌC:</span>
              <span className="text-primary font-bold">{ttsSpeed}X</span>
            </div>
            <div className="grid grid-cols-6 gap-1 text-xs font-mono">
              {[0.75, 1.0, 1.25, 1.5, 1.75, 2.0].map((s) => (
                <button
                  key={s}
                  onClick={() => changeTtsSpeed(s)}
                  className={`py-1 border text-center transition ${
                    ttsSpeed === s
                      ? 'border-primary bg-primary/10 text-primary font-bold'
                      : 'border-border text-text-secondary hover:text-text-primary bg-surface-elevated'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Chapter Index Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex">
          <div className="w-80 max-w-[85vw] h-full bg-surface border-r border-border p-6 flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="label-caps">MỤC LỤC ({allChapters.length})</h3>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1 text-text-secondary hover:text-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 pr-1">
              {allChapters.map((ch) => (
                <Link
                  key={ch.id}
                  href={`/read/${book.slug}/${ch.chapterNumber}`}
                  onClick={() => setDrawerOpen(false)}
                  className={`block p-2.5 text-xs transition border ${
                    ch.chapterNumber === chapter.chapterNumber
                      ? 'border-primary bg-primary/10 text-primary font-bold'
                      : 'border-transparent text-text-primary hover:bg-surface-elevated'
                  }`}
                >
                  <span className="font-mono opacity-50 mr-2">[{ch.chapterNumber.toString().padStart(2, '0')}]</span>
                  {ch.title}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex-1" onClick={() => setDrawerOpen(false)} />
        </div>
      )}

      {/* Main Prose Canvas */}
      <main
        ref={contentRef}
        className={`mx-auto px-3.5 sm:px-6 py-7 sm:py-16 ${getWidthClass()}`}
      >
        <div className="text-center space-y-2 mb-8 sm:mb-12 pb-5 sm:pb-6 border-b border-border/80">
          <span className="label-caps text-[10px] sm:text-[11px]">
            {book.title}
          </span>
          <h2 className="font-serif text-xl sm:text-3xl font-bold tracking-normal break-words mt-1">
            Chương {chapter.chapterNumber}: {chapter.title}
          </h2>
          <p className="text-[11px] sm:text-xs font-mono opacity-60">
            {chapter.wordCount.toLocaleString()} TỪ • BẢN BIÊN TẬP CHUẨN
          </p>
        </div>

        {/* Prose text */}
        <div
          className={`space-y-5 sm:space-y-6 ${
            fontFamily === 'serif' ? 'reader-content font-serif' : 'font-sans'
          }`}
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: lineHeight,
          }}
        >
          {chapter.content.split(/\n\s*\n/).map((para, index) => (
            <InlineParagraphItem
              key={index}
              index={index}
              text={para.trim()}
              reactions={interactions.reactions[index]}
              userReaction={interactions.userReactions[index]}
              commentsCount={interactions.commentsCount[index] || 0}
              onReact={(reaction) => handleReact(index, reaction)}
              onOpenComments={() =>
                setActiveCommentParagraph({ index, text: para.trim() })
              }
            />
          ))}
        </div>

        {/* Inline Comment Drawer */}
        {activeCommentParagraph && (
          <InlineCommentDrawer
            isOpen={!!activeCommentParagraph}
            onClose={() => setActiveCommentParagraph(null)}
            chapterId={chapter.id}
            paragraphIndex={activeCommentParagraph.index}
            paragraphText={activeCommentParagraph.text}
            onCommentAdded={() => {
              setInteractions((prev) => ({
                ...prev,
                commentsCount: {
                  ...prev.commentsCount,
                  [activeCommentParagraph.index]:
                    (prev.commentsCount[activeCommentParagraph.index] || 0) + 1,
                },
              }));
            }}
          />
        )}

        {/* CỐT TRUYỆN PHÂN NHÁNH (BRANCHING CHOICES) */}
        <BranchingChoicesSection
          chapterId={chapter.id}
          chapterNumber={chapter.chapterNumber}
          bookSlug={book.slug}
          allChapters={allChapters}
        />

        {/* Bottom Chapter Switcher */}
        <div className="mt-16 pt-8 border-t border-border/80 flex items-center justify-between gap-4">
          {prevChapter ? (
            <Link
              href={`/read/${book.slug}/${prevChapter.chapterNumber}`}
              className="inline-flex items-center gap-2 px-4 py-2 border border-border hover:border-primary text-xs font-mono transition"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>CHƯƠNG TRƯỚC</span>
            </Link>
          ) : (
            <div className="opacity-40 text-xs px-4 py-2 font-mono">
              [ĐẦU TÁC PHẨM]
            </div>
          )}

          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="text-xs font-mono opacity-60 hover:opacity-100 transition"
          >
            ĐẦU TRANG ↑
          </button>

          {nextChapter ? (
            <Link
              href={`/read/${book.slug}/${nextChapter.chapterNumber}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-text-primary text-background hover:bg-primary hover:text-white text-xs font-mono transition border border-border"
            >
              <span>CHƯƠNG SAU</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <div className="opacity-40 text-xs px-4 py-2 font-mono">
              [HẾT TÁC PHẨM]
            </div>
          )}
        </div>
      </main>

      {/* Floating Audio Bar when Speaking */}
      {isSpeaking && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-lg w-[calc(100%-2rem)] bg-surface/95 backdrop-blur-md border border-primary/40 shadow-2xl px-3.5 py-2 flex items-center justify-between gap-2.5 text-text-primary">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse flex-shrink-0" />
            <div className="text-[11px] font-mono flex items-center gap-1.5 truncate">
              <span className="font-semibold text-primary uppercase">Đang đọc</span>
              <span className="text-text-secondary">[{activeLang === 'vi-VN' ? 'VI' : 'EN'}]</span>
            </div>
          </div>

          {/* Quick Speed Pills */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {[0.75, 1.0, 1.25, 1.5, 2.0].map((s) => (
              <button
                key={s}
                onClick={() => changeTtsSpeed(s)}
                className={`px-1.5 py-0.5 text-[11px] font-mono border transition ${
                  ttsSpeed === s
                    ? 'border-primary bg-primary text-white font-bold'
                    : 'border-border/70 hover:border-primary text-text-secondary hover:text-text-primary bg-surface-elevated'
                }`}
                title={`Đặt tốc độ ${s}x`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Stop Button */}
          <button
            onClick={toggleTTS}
            className="p-1 border border-red-500/40 text-red-500 hover:bg-red-500 hover:text-white transition flex-shrink-0"
            title="Dừng đọc"
          >
            <Square className="w-3 h-3 fill-current" />
          </button>
        </div>
      )}
    </div>
  );
}
