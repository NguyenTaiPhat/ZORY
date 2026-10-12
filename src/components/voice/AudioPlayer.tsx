'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
  List,
  Clock,
  BookOpen,
  ArrowLeft,
  ChevronRight,
  Headphones,
  Globe,
  Sparkles,
} from 'lucide-react';
import {
  segmentBilingualText,
  findBestVoiceForLang,
  SpeechSegment,
} from '@/lib/tts/bilingualDetector';

interface AudioPlayerProps {
  book: {
    id: string;
    title: string;
    slug: string;
    coverUrl: string | null;
    authorName: string | null;
  };
  chapters: {
    id: string;
    chapterNumber: number;
    title: string;
    content: string;
    wordCount: number;
  }[];
}

export function AudioPlayer({ book, chapters }: AudioPlayerProps) {
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const currentChapter = chapters[currentChapterIndex] || chapters[0];

  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [chapterListOpen, setChapterListOpen] = useState(false);
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);

  // Bilingual State & References
  const [activeLang, setActiveLang] = useState<'vi-VN' | 'en-US'>('vi-VN');
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number>(0);
  const [hasVietnameseVoice, setHasVietnameseVoice] = useState<boolean>(true);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [ttsEngine, setTtsEngine] = useState<'cloud' | 'local'>('cloud');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const segmentsRef = useRef<SpeechSegment[]>([]);
  const segmentIdxRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);
  const timerTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Dọn dẹp audio khi component unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Lắng nghe nạp danh sách giọng đọc của trình duyệt
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const updateVoices = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) {
        setAvailableVoices(v);
        const viVoice = findBestVoiceForLang('vi-VN', v);
        setHasVietnameseVoice(!!viVoice);
        if (!viVoice) {
          setTtsEngine('cloud');
        }
      }
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Phân tích các phân đoạn song ngữ khi đổi chương
  useEffect(() => {
    if (currentChapter) {
      const segs = segmentBilingualText(currentChapter.content);
      segmentsRef.current = segs;
      segmentIdxRef.current = 0;
      setActiveSegmentIndex(0);
      setProgressPercent(0);

      if (segs.length > 0) {
        setActiveLang(segs[0].lang);
      }

      if (isPlayingRef.current) {
        stopSpeech();
        startSpeechQueue();
      }
    }
  }, [currentChapterIndex]);

  // Hẹn giờ ngủ
  useEffect(() => {
    if (timerTimeoutRef.current) clearTimeout(timerTimeoutRef.current);
    if (sleepTimerMinutes && isPlaying) {
      timerTimeoutRef.current = setTimeout(() => {
        stopSpeech();
        setIsPlaying(false);
        isPlayingRef.current = false;
        setSleepTimerMinutes(null);
        alert('Đã tắt ZORY Voice theo hẹn giờ ngủ.');
      }, sleepTimerMinutes * 60 * 1000);
    }
    return () => {
      if (timerTimeoutRef.current) clearTimeout(timerTimeoutRef.current);
    };
  }, [sleepTimerMinutes, isPlaying]);

  const speakCurrentSegment = () => {
    const segs = segmentsRef.current;
    if (segmentIdxRef.current >= segs.length) {
      // Hết chương
      setIsPlaying(false);
      isPlayingRef.current = false;
      setProgressPercent(100);
      if (currentChapterIndex < chapters.length - 1) {
        setCurrentChapterIndex((prev) => prev + 1);
      }
      return;
    }

    const seg = segs[segmentIdxRef.current];
    setActiveSegmentIndex(segmentIdxRef.current);
    setActiveLang(seg.lang);

    // Tính toán tiến độ %
    const percent = Math.min(
      100,
      Math.round(((segmentIdxRef.current + 1) / Math.max(1, segs.length)) * 100)
    );
    setProgressPercent(percent);

    // Dừng phát âm trước đó
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    const voices =
      typeof window !== 'undefined' && 'speechSynthesis' in window
        ? window.speechSynthesis.getVoices()
        : [];
    const matchedVoice = findBestVoiceForLang(seg.lang, voices);

    // QUY TẮC VÀNG: Tiếng Việt nếu không có giọng tiếng Việt trên máy HOẶC chọn ttsEngine 'cloud'
    // -> Bắt buộc dùng Cloud TTS, TUYỆT ĐỐI không dùng giọng tiếng Anh đọc tiếng Việt!
    const shouldUseCloud = seg.lang === 'vi-VN' && (!matchedVoice || ttsEngine === 'cloud');

    if (shouldUseCloud) {
      const audioUrl = `/api/tts?text=${encodeURIComponent(seg.text)}&lang=vi`;
      const audio = new Audio(audioUrl);
      audio.playbackRate = speed;
      audio.volume = isMuted ? 0 : volume;
      audioRef.current = audio;

      audio.onended = () => {
        if (!isPlayingRef.current) return;
        segmentIdxRef.current += 1;
        speakCurrentSegment();
      };

      audio.onerror = (e) => {
        console.warn('Lỗi Cloud TTS, chuyển câu tiếp:', e);
        if (!isPlayingRef.current) return;
        segmentIdxRef.current += 1;
        if (segmentIdxRef.current < segs.length) {
          speakCurrentSegment();
        } else {
          setIsPlaying(false);
          isPlayingRef.current = false;
        }
      };

      audio.play().catch((err) => {
        console.warn('Không thể tự động phát audio Cloud:', err);
      });
      return;
    }

    // Nếu là tiếng Anh hoặc máy có sẵn giọng tiếng Việt chất lượng cao (Edge Hoài My/Nam Minh)
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(seg.text);
      utterance.lang = seg.lang;
      utterance.rate = speed;
      utterance.volume = isMuted ? 0 : volume;

      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.onend = () => {
        if (!isPlayingRef.current) return;
        segmentIdxRef.current += 1;
        speakCurrentSegment();
      };

      utterance.onerror = (e) => {
        if (!isPlayingRef.current) return;
        segmentIdxRef.current += 1;
        if (segmentIdxRef.current < segs.length) {
          speakCurrentSegment();
        } else {
          setIsPlaying(false);
          isPlayingRef.current = false;
        }
      };

      window.speechSynthesis.speak(utterance);
    }
  };

  const startSpeechQueue = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    isPlayingRef.current = true;
    setIsPlaying(true);
    speakCurrentSegment();
  };

  const stopSpeech = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    isPlayingRef.current = false;
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (isPlaying) {
      stopSpeech();
    } else {
      startSpeechQueue();
    }
  };

  const handleSkip = (seconds: number) => {
    const step = Math.round(seconds / 4);
    const segs = segmentsRef.current;
    const newIdx = Math.max(0, Math.min(segs.length - 1, segmentIdxRef.current + step));
    segmentIdxRef.current = newIdx;
    setActiveSegmentIndex(newIdx);

    const percent = Math.min(
      100,
      Math.round(((newIdx + 1) / Math.max(1, segs.length)) * 100)
    );
    setProgressPercent(percent);

    if (isPlayingRef.current) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      speakCurrentSegment();
    }
  };

  const handlePrevChapter = () => {
    if (currentChapterIndex > 0) {
      stopSpeech();
      setCurrentChapterIndex((prev) => prev - 1);
    }
  };

  const handleNextChapter = () => {
    if (currentChapterIndex < chapters.length - 1) {
      stopSpeech();
      setCurrentChapterIndex((prev) => prev + 1);
    }
  };

  const handleSpeedChange = () => {
    const speeds = [0.75, 1.0, 1.25, 1.5, 2.0];
    const nextIdx = (speeds.indexOf(speed) + 1) % speeds.length;
    const newSpeed = speeds[nextIdx];
    setSpeed(newSpeed);

    if (isPlayingRef.current) {
      window.speechSynthesis.cancel();
      setTimeout(speakCurrentSegment, 50);
    }
  };

  const currentSegment = segmentsRef.current[activeSegmentIndex];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <Link
          href={`/book/${book.slug}`}
          className="inline-flex items-center gap-2 text-xs font-medium text-text-secondary hover:text-text-primary transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Hồ sơ tác phẩm</span>
        </Link>

        <div className="flex items-center gap-4">
          <span className="label-caps hidden sm:inline-block">ZORY DUAL-ENGINE AUDIO DECK</span>
          <Link
            href={`/read/${book.slug}/${currentChapter.chapterNumber}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border bg-surface text-xs font-medium text-text-primary hover:border-primary transition"
          >
            <BookOpen className="w-3.5 h-3.5 text-primary" />
            <span>Chuyển sang bản in</span>
          </Link>
        </div>
      </div>

      {/* Main Console Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 border border-border bg-surface">
        {/* Book Jacket Art Column */}
        <div className="lg:col-span-5 p-8 sm:p-12 border-b lg:border-b-0 lg:border-r border-border flex flex-col items-center justify-center bg-surface-elevated/40">
          <div className="w-52 sm:w-60 book-cover-frame book-spine-effect">
            <div className="aspect-[2/3] w-full overflow-hidden bg-surface">
              <img
                src={book.coverUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600'}
                alt={book.title}
                className="w-full h-full object-cover contrast-[1.05]"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col items-center gap-2 text-center">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-primary animate-pulse' : 'bg-text-secondary/40'}`} />
              <span className="label-caps">
                {isPlaying ? 'ĐANG PHÁT AUDIO' : 'TRÌNH PHÁT TẠM DỪNG'}
              </span>
            </div>

            {/* Smart Language Detection Badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm border border-border bg-surface text-[11px] font-mono">
              <Globe className="w-3 h-3 text-primary" />
              <span>NGÔN NGỮ HIỆN TẠI:</span>
              <strong className={activeLang === 'vi-VN' ? 'text-primary' : 'text-emerald-600'}>
                {activeLang === 'vi-VN' ? 'TIẾNG VIỆT (vi-VN)' : 'ENGLISH (en-US)'}
              </strong>
            </div>

            {/* Engine Status Badge */}
            <div className="mt-2.5 p-2.5 border border-primary/30 bg-primary/10 text-xs font-sans text-text-primary max-w-xs text-left flex items-start gap-2 shadow-xs">
              <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-[11px] text-primary">
                    {ttsEngine === 'cloud' || !hasVietnameseVoice
                      ? 'ZORY CLOUD AI VOICE'
                      : 'HỆ ĐIỀU HÀNH VOICE'}
                  </span>
                  <span className="text-[9px] uppercase px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 font-bold rounded-xs">
                    CHUẨN TIẾNG VIỆT
                  </span>
                </div>
                <p className="text-[10.5px] text-text-secondary leading-tight">
                  {ttsEngine === 'cloud' || !hasVietnameseVoice
                    ? 'Đang phát âm chuẩn xác Tiếng Việt qua AI Đám Mây (tự nhiên 100%, không lo thiếu giọng trên Windows).'
                    : 'Đang dùng giọng đọc tích hợp sẵn trên hệ điều hành.'}
                </p>
              </div>
            </div>

            {hasVietnameseVoice && (
              <button
                type="button"
                onClick={() => {
                  setTtsEngine(ttsEngine === 'cloud' ? 'local' : 'cloud');
                  if (isPlayingRef.current) {
                    stopSpeech();
                    setTimeout(startSpeechQueue, 150);
                  }
                }}
                className="text-[10.5px] font-sans font-semibold text-text-tertiary hover:text-primary transition underline mt-1"
              >
                Chuyển sang {ttsEngine === 'cloud' ? 'giọng thiết bị' : 'giọng ZORY Cloud AI'}
              </button>
            )}
          </div>
        </div>

        {/* Audio Console Deck */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between space-y-8">
          {/* Metadata */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="label-caps">
                CHƯƠNG {currentChapter.chapterNumber} / {chapters.length}
              </span>
              <span className="text-[11px] font-mono text-text-secondary">
                {currentChapter.wordCount.toLocaleString()} TỪ • {segmentsRef.current.length} CÂU
              </span>
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
              {book.title}
            </h1>
            <p className="text-sm text-text-primary font-medium">
              {currentChapter.title}
            </p>
            <p className="text-xs text-text-secondary">
              Tác giả: {book.authorName || 'Vô danh'} • Tự động nhận diện & phát âm chuẩn song ngữ Việt - Anh
            </p>
          </div>

          {/* Currently Spoken Line Preview */}
          {currentSegment && (
            <div className="p-3.5 border border-border bg-surface-elevated/70 text-xs leading-relaxed space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono text-text-secondary">
                <span>CÂU ĐANG ĐỌC:</span>
                <span className={`px-1.5 py-0.2 rounded-sm border ${
                  currentSegment.lang === 'vi-VN'
                    ? 'border-primary/40 text-primary bg-primary/5'
                    : 'border-emerald-500/40 text-emerald-600 bg-emerald-500/5'
                }`}>
                  {currentSegment.lang === 'vi-VN' ? 'GIỌNG VIỆT' : 'ENGLISH VOICE'}
                </span>
              </div>
              <p className="font-serif italic text-text-primary text-sm">
                &ldquo;{currentSegment.text}&rdquo;
              </p>
            </div>
          )}

          {/* Precision Timeline */}
          <div className="space-y-2 pt-2">
            <div className="w-full bg-border h-1 relative overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-200"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-mono text-text-secondary">
              <span>TIẾN ĐỘ: {progressPercent}% ({activeSegmentIndex + 1}/{segmentsRef.current.length || 1})</span>
              <span>TỐC ĐỘ: {speed}X</span>
            </div>
          </div>

          {/* Primary Controls Deck */}
          <div className="flex items-center justify-center gap-5 py-2">
            <button
              onClick={handlePrevChapter}
              disabled={currentChapterIndex === 0}
              className="p-2 border border-border hover:bg-surface-elevated text-text-primary disabled:opacity-20 transition"
              title="Chương trước"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleSkip(-15)}
              className="p-2 border border-border hover:bg-surface-elevated text-text-primary transition"
              title="Lùi 15s"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlay}
              className="w-14 h-14 bg-text-primary text-background hover:bg-primary hover:text-white flex items-center justify-center transition border border-border active:scale-95"
              title={isPlaying ? 'Tạm dừng' : 'Bắt đầu phát'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            <button
              onClick={() => handleSkip(15)}
              className="p-2 border border-border hover:bg-surface-elevated text-text-primary transition"
              title="Tới 15s"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            <button
              onClick={handleNextChapter}
              disabled={currentChapterIndex === chapters.length - 1}
              className="p-2 border border-border hover:bg-surface-elevated text-text-primary disabled:opacity-20 transition"
              title="Chương sau"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Secondary Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-border text-xs">
            <button
              onClick={handleSpeedChange}
              className="px-3 py-1.5 border border-border bg-surface hover:bg-surface-elevated text-text-primary font-mono text-xs transition"
              title="Chuyển tốc độ đọc"
            >
              TỐC ĐỘ: {speed}x
            </button>

            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-text-secondary" />
              <select
                value={sleepTimerMinutes || ''}
                onChange={(e) =>
                  setSleepTimerMinutes(e.target.value ? Number(e.target.value) : null)
                }
                className="bg-surface border border-border px-2 py-1 text-xs text-text-primary focus:outline-none"
              >
                <option value="">Không hẹn giờ</option>
                <option value="15">Hẹn 15 phút</option>
                <option value="30">Hẹn 30 phút</option>
                <option value="45">Hẹn 45 phút</option>
                <option value="60">Hẹn 60 phút</option>
              </select>
            </div>

            <button
              onClick={() => setChapterListOpen(!chapterListOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-border bg-surface hover:bg-surface-elevated text-text-primary font-medium transition"
            >
              <List className="w-3.5 h-3.5 text-primary" />
              <span>Mục lục ({chapters.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Chapter Index Drawer / Sheet */}
      {chapterListOpen && (
        <div className="border border-border bg-surface p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h3 className="label-caps">MỤC LỤC TÁC PHẨM TOÀN TẬP</h3>
            <span className="text-xs font-mono text-text-secondary">{chapters.length} CHƯƠNG</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {chapters.map((ch, idx) => (
              <button
                key={ch.id}
                onClick={() => {
                  stopSpeech();
                  setCurrentChapterIndex(idx);
                  setChapterListOpen(false);
                }}
                className={`p-3 text-left text-xs transition flex justify-between items-center border ${
                  idx === currentChapterIndex
                    ? 'border-primary bg-primary/10 text-primary font-bold'
                    : 'border-border bg-surface hover:bg-surface-elevated text-text-primary'
                }`}
              >
                <span className="truncate pr-2">
                  <span className="font-mono opacity-60 mr-1.5">[{ch.chapterNumber.toString().padStart(2, '0')}]</span>
                  {ch.title}
                </span>
                <ChevronRight className="w-3.5 h-3.5 opacity-40 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Literary Prose Excerpt Display */}
      <div className="border border-border bg-surface p-8 sm:p-12 space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <span className="label-caps">VĂN BẢN ĐANG PHÁT THANH</span>
          <span className="text-xs font-mono text-text-secondary">CHƯƠNG {currentChapter.chapterNumber}</span>
        </div>

        <div className="font-serif text-base sm:text-lg leading-relaxed text-text-primary space-y-5 max-h-[32rem] overflow-y-auto pr-3">
          {currentChapter.content.split(/\n\s*\n/).map((para, i) => (
            <p key={i} className="indent-6 text-justify">
              {para}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
