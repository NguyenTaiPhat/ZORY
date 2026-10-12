'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Save,
  Check,
  Plus,
  Wand2,
  FileText,
  Globe,
  Users,
  ArrowLeft,
  X,
  Zap,
  Trash2,
  BookOpen,
  ScrollText,
  ChevronLeft,
  ChevronRight,
  List,
  GitBranch,
  RotateCw,
  RotateCcw,
  AlertTriangle,
  ExternalLink,
  ArrowRight,
  Camera,
  Edit3,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
} from 'lucide-react';
import { cleanAiLiteratureOutput } from '@/lib/ai/cleaner';
import { formatThousands } from '@/lib/utils';
import { LorebookManager } from './LorebookManager';
import { CoverPickerModal } from './CoverPickerModal';

interface StudioWorkspaceProps {
  initialProject: any;
}

export function StudioWorkspace({ initialProject }: StudioWorkspaceProps) {
  const router = useRouter();
  const [project, setProject] = useState(initialProject);
  const [activeTab, setActiveTab] = useState<'editor' | 'world' | 'characters'>('editor');
  const [isDeletingProject, setIsDeletingProject] = useState(false);
  const [deleteProjectModalOpen, setDeleteProjectModalOpen] = useState(false);
  const [coverModalOpen, setCoverModalOpen] = useState(false);

  // Xuất bản công khai states
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccessInfo, setPublishSuccessInfo] = useState<{
    bookId: string;
    slug: string;
    chapterCount: number;
  } | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  const handlePublishProject = async () => {
    setIsPublishing(true);
    setPublishError(null);
    try {
      const currentChs = [...chapters];
      if (currentChs[activeChapterIndex]) {
        const isHidden = currentChapter.status === 'HIDDEN';
        const hasContent = chapterContent.trim().length > 30;
        const chapterStatus = isHidden ? 'HIDDEN' : hasContent ? 'PUBLISHED' : 'DRAFT';
        currentChs[activeChapterIndex] = {
          ...currentChapter,
          title: chapterTitle,
          content: chapterContent,
          wordCount,
          status: chapterStatus,
        };
      }
      await fetch(`/api/studio/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updatedChapters: currentChs,
        }),
      });

      const res = await fetch(`/api/studio/projects/${project.id}/publish`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi xuất bản tác phẩm');
      }
      const slug = data.slug || data.bookSlug;
      const chapterCount = data.chapterCount ?? data.chaptersPublished ?? chapters.length;
      setPublishSuccessInfo({
        bookId: data.bookId,
        slug,
        chapterCount,
      });
      setProject((prev: any) => ({
        ...prev,
        publishedBookId: data.bookId,
        publishedBookSlug: slug,
      }));
      setChapters((prev) =>
        prev.map((c) => ({
          ...c,
          status:
            c.status === 'HIDDEN'
              ? 'HIDDEN'
              : c.content && c.content.trim().length > 30
              ? 'PUBLISHED'
              : c.status || 'DRAFT',
        }))
      );
    } catch (err: any) {
      setPublishError(err.message || 'Không thể xuất bản tác phẩm');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleConfirmDeleteProject = async () => {
    setDeleteProjectModalOpen(false);
    setIsDeletingProject(true);
    try {
      const res = await fetch(`/api/studio/projects/${project.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        router.push('/studio');
      } else {
        alert('Lỗi khi xóa bản thảo');
      }
    } catch {
      alert('Không thể kết nối đến máy chủ');
    } finally {
      setIsDeletingProject(false);
    }
  };

  // Chapter Editor States
  const [chapters, setChapters] = useState<any[]>(() => {
    return (project.studioChapters || []).map((ch: any) => ({
      ...ch,
      status:
        ch.status === 'HIDDEN'
          ? 'HIDDEN'
          : ch.status === 'PUBLISHED'
          ? 'PUBLISHED'
          : ch.content && ch.content.trim().length > 30
          ? 'PUBLISHED'
          : ch.status || 'DRAFT',
    }));
  });
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const currentChapter = chapters[activeChapterIndex] || {
    chapterNumber: 1,
    title: 'Chương 1',
    content: '',
  };

  const [chapterTitle, setChapterTitle] = useState(currentChapter.title || '');
  const [chapterContent, setChapterContent] = useState(currentChapter.content || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [mobileChapterListOpen, setMobileChapterListOpen] = useState(false);

  // Đồng bộ tiêu đề tab trình duyệt theo tên tác phẩm & chương đang biên tập
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const activeCh = chapters[activeChapterIndex] || currentChapter;
      const chName = chapterTitle || activeCh?.title;
      if (chName && project?.title) {
        document.title = `${chName} — ${project.title} | ZORY Studio`;
      } else if (project?.title) {
        document.title = `${project.title} — Xưởng Sáng Tác | ZORY`;
      }
    }
  }, [activeChapterIndex, chapters, currentChapter?.title, chapterTitle, project?.title]);

  // AI Modal States
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiOperation, setAiOperation] = useState<'CONTINUE' | 'REWRITE' | 'SUMMARIZE'>('CONTINUE');
  const [aiInstruction, setAiInstruction] = useState('');
  const [aiLength, setAiLength] = useState<'epic' | 'detailed' | 'standard' | 'short'>('epic');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // AI Co-Writer Direction States (Định hướng tình tiết trước khi sinh văn)
  const [aiStep, setAiStep] = useState<1 | 2>(1);
  const [directionLoading, setDirectionLoading] = useState(false);
  const [directionOptions, setDirectionOptions] = useState<
    Array<{ id: string; tag: string; title: string; summary: string }>
  >([]);
  const [selectedDirectionId, setSelectedDirectionId] = useState<string | null>(null);
  const [customDirection, setCustomDirection] = useState('');
  const [activeDirectionSummary, setActiveDirectionSummary] = useState('');
  const [expandedDirectionIds, setExpandedDirectionIds] = useState<Record<string, boolean>>({});

  const captureSelection = () => {
    const textarea = textareaRef.current;
    if (!textarea) return { text: '', range: null };
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    if (typeof start === 'number' && typeof end === 'number' && end > start) {
      const text = textarea.value.substring(start, end);
      return { text, range: { start, end } };
    }
    return { text: '', range: null };
  };

  const handleTextareaSelect = () => {
    const { text, range } = captureSelection();
    if (text && range) {
      setSelectedText(text);
      setSelectionRange(range);
    }
  };

  // Branching Suggestions State
  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [branchLoading, setBranchLoading] = useState(false);
  const [branchResult, setBranchResult] = useState('');

  const handleSuggestBranches = async () => {
    setBranchLoading(true);
    setBranchResult('');
    setBranchModalOpen(true);
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'PROMPT',
          prompt: `Nhiệm vụ: Bạn là chuyên gia biên kịch tiểu thuyết tương tác. Hãy phân tích đoạn kết sau và đề xuất chính xác 3 ngã rẽ cốt truyện kịch tính tiếp theo (Branching Paths):\n\nĐOẠN KẾT CHƯƠNG:\n"""${chapterContent.slice(-1200) || currentChapter.summary || project.premise}"""\n\nYêu cầu: Viết rõ Nhánh A, Nhánh B, Nhánh C. Mỗi nhánh gồm: Tên lựa chọn hành động + Tóm tắt ngắn biến cố xảy ra theo nhánh đó.`,
          projectId: project.id,
          projectGenre: project.genre,
          projectPremise: project.premise,
          systemPrompt: `Thể loại tác phẩm: ${project.genre}. Đề tài: ${project.premise}.`,
          length: 'standard',
        }),
      });
      const data = await res.json();
      if (res.ok && data.content) {
        setBranchResult(cleanAiLiteratureOutput(data.content));
      } else {
        alert(data.error || 'Lỗi khi gọi AI');
      }
    } catch {
      alert('Không thể kết nối đến máy chủ');
    } finally {
      setBranchLoading(false);
    }
  };

  // Token Quota States (Reset sau mỗi 5h)
  const [tokenQuota, setTokenQuota] = useState<{
    remaining: number;
    quota: number;
    countdown: string;
    lastUsed?: number;
  }>({
    remaining: 50000,
    quota: 50000,
    countdown: '5 giờ',
  });

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data?.user?.aiQuota) {
          setTokenQuota({
            remaining: data.user.aiQuota.remaining,
            quota: data.user.aiQuota.quota,
            countdown: data.user.aiQuota.countdown,
          });
        }
      })
      .catch(() => {});
  }, []);

  // World Bible State
  const [worldBibleText, setWorldBibleText] = useState(
    typeof project.worldBible === 'string'
      ? project.worldBible
      : JSON.stringify(project.worldBible || {}, null, 2)
  );
  const [worldSaving, setWorldSaving] = useState(false);

  // Characters State
  const [characters, setCharacters] = useState<any[]>(project.characters || []);
  const [newCharName, setNewCharName] = useState('');
  const [newCharRole, setNewCharRole] = useState('Nhân vật chính');
  const [newCharAppearance, setNewCharAppearance] = useState('');
  const [newCharPersonality, setNewCharPersonality] = useState('');
  const [newCharGoals, setNewCharGoals] = useState('');
  const [newCharAbilities, setNewCharAbilities] = useState('');

  const wordCount = chapterContent.trim() ? chapterContent.trim().split(/\s+/).length : 0;

  const handleSelectChapter = (index: number) => {
    const updatedList = [...chapters];
    const isHidden = currentChapter.status === 'HIDDEN';
    const hasContent = chapterContent.trim().length > 30;
    const chapterStatus = isHidden ? 'HIDDEN' : hasContent ? 'PUBLISHED' : 'DRAFT';
    updatedList[activeChapterIndex] = {
      ...currentChapter,
      title: chapterTitle,
      content: chapterContent,
      wordCount,
      status: chapterStatus,
    };
    setChapters(updatedList);
    setActiveChapterIndex(index);
    const target = updatedList[index];
    if (target) {
      setChapterTitle(target.title || `Chương ${target.chapterNumber}`);
      setChapterContent(target.content || '');
    }
  };

  const handleAddChapter = () => {
    const nextNumber = chapters.length + 1;
    const newCh = {
      chapterNumber: nextNumber,
      title: `Chương ${nextNumber}: Tiêu đề mới`,
      content: '',
      status: 'DRAFT',
    };
    const updated = [...chapters, newCh];
    setChapters(updated);
    setActiveChapterIndex(updated.length - 1);
    setChapterTitle(newCh.title);
    setChapterContent('');
  };

  const handleToggleChapterPublishStatus = async () => {
    const isCurrentlyPublic =
      currentChapter.status === 'PUBLISHED' ||
      (!currentChapter.status && chapterContent.trim().length > 30) ||
      (currentChapter.status !== 'HIDDEN' && chapterContent.trim().length > 30);

    const nextStatus = isCurrentlyPublic ? 'HIDDEN' : 'PUBLISHED';

    const updatedList = [...chapters];
    updatedList[activeChapterIndex] = {
      ...currentChapter,
      title: chapterTitle,
      content: chapterContent,
      wordCount,
      status: nextStatus,
    };
    setChapters(updatedList);

    try {
      setIsSaving(true);
      const res = await fetch(`/api/studio/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updatedChapters: updatedList,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data?.project?.publishedBookSlug) {
        setProject((prev: any) => ({
          ...prev,
          publishedBookId: data.project.publishedBookId,
          publishedBookSlug: data.project.publishedBookSlug,
        }));
      }
      setSaveMessage(
        nextStatus === 'PUBLISHED'
          ? 'Đã công khai chương'
          : 'Đã ẩn chương (chưa xong)'
      );
      setTimeout(() => setSaveMessage(''), 2500);
    } catch {
      setSaveMessage('Lỗi cập nhật');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteChapter = async (indexToDelete: number) => {
    if (chapters.length <= 1) {
      alert('Bản thảo cần có ít nhất 1 chương.');
      return;
    }
    const target = chapters[indexToDelete];
    const confirmDelete = window.confirm(
      `Bạn có chắc muốn xóa Chương ${target?.chapterNumber}: "${target?.title}"?`
    );
    if (!confirmDelete) return;

    const remaining = chapters
      .filter((_, idx) => idx !== indexToDelete)
      .map((ch, idx) => ({
        ...ch,
        chapterNumber: idx + 1,
      }));

    setChapters(remaining);
    const nextIndex = Math.max(0, Math.min(indexToDelete, remaining.length - 1));
    setActiveChapterIndex(nextIndex);
    const nextActive = remaining[nextIndex];
    if (nextActive) {
      setChapterTitle(nextActive.title);
      setChapterContent(nextActive.content || '');
    }

    try {
      await fetch(`/api/studio/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updatedChapters: remaining,
        }),
      });
    } catch {}
  };

  const handleSaveChapter = async () => {
    setIsSaving(true);
    setSaveMessage('');
    try {
      const isHidden = currentChapter.status === 'HIDDEN';
      const hasContent = chapterContent.trim().length > 30;
      const chapterStatus = isHidden ? 'HIDDEN' : hasContent ? 'PUBLISHED' : 'DRAFT';

      const updatedList = [...chapters];
      updatedList[activeChapterIndex] = {
        ...currentChapter,
        title: chapterTitle,
        content: chapterContent,
        wordCount,
        status: chapterStatus,
      };
      setChapters(updatedList);

      const res = await fetch(`/api/studio/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updatedChapters: updatedList,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (data?.project?.publishedBookSlug) {
        setProject((prev: any) => ({
          ...prev,
          publishedBookId: data.project.publishedBookId,
          publishedBookSlug: data.project.publishedBookSlug,
        }));
      }

      setSaveMessage(
        project.publishedBookSlug || data?.project?.publishedBookSlug
          ? 'Đã lưu & đồng bộ truyện'
          : 'Đã lưu bản nháp'
      );
      setTimeout(() => setSaveMessage(''), 2500);
    } catch (err) {
      setSaveMessage('Lỗi lưu bản nháp');
    } finally {
      setIsSaving(false);
    }
  };

  const fetchDirections = async () => {
    setDirectionLoading(true);
    setDirectionOptions([]);
    setSelectedDirectionId(null);
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'SUGGEST_DIRECTIONS',
          prompt: chapterContent ? chapterContent.slice(-800) : (currentChapter.summary || project.premise || ''),
          projectId: project.id,
          projectGenre: project.genre,
          projectPremise: project.premise,
          systemPrompt: `Thể loại tác phẩm: ${project.genre}. Đề tài: ${project.premise}. Ngữ cảnh thế giới: ${worldBibleText}. Phong cách: ${project.writingStyle}`,
        }),
      });
      const data = await res.json();
      if (res.ok && data.directions && Array.isArray(data.directions)) {
        setDirectionOptions(data.directions);
        if (data.directions.length > 0) {
          const first = data.directions[0];
          setSelectedDirectionId(first.id);
          setCustomDirection(`${first.title}: ${first.summary}`);
          setExpandedDirectionIds({ [first.id]: true });
        }
      }
    } catch (err) {
      console.warn('Lỗi lấy gợi ý hướng đi:', err);
    } finally {
      setDirectionLoading(false);
    }
  };

  const handleOpenAiModal = (
    operation: 'CONTINUE' | 'REWRITE' | 'SUMMARIZE',
    initialInstr: string = ''
  ) => {
    setAiOperation(operation);
    setAiResult('');
    setAiInstruction(initialInstr);

    const { text, range } = captureSelection();
    if (text && range) {
      setSelectedText(text);
      setSelectionRange(range);
    } else {
      if (operation === 'REWRITE') {
        setSelectedText(chapterContent);
        setSelectionRange(null);
      } else {
        setSelectedText('');
        setSelectionRange(null);
      }
    }

    if (operation === 'CONTINUE') {
      setAiStep(1);
      setSelectedDirectionId(null);
      setCustomDirection('');
      setActiveDirectionSummary('');
      setExpandedDirectionIds({});
      fetchDirections();
    } else {
      setAiStep(2);
      setActiveDirectionSummary('');
    }

    setAiModalOpen(true);
  };

  const handleProceedToProse = () => {
    let summary = '';
    if (customDirection.trim()) {
      summary = customDirection.trim();
    } else if (selectedDirectionId) {
      const opt = directionOptions.find((d) => d.id === selectedDirectionId);
      if (opt) {
        summary = `${opt.title}: ${opt.summary}`;
      }
    }
    setActiveDirectionSummary(summary);
    setAiStep(2);
  };

  const handleSkipDirections = () => {
    setActiveDirectionSummary('');
    setAiStep(2);
  };

  const handleTriggerAi = async () => {
    setAiLoading(true);
    setAiResult('');
    try {
      const textToRewrite = selectedText || chapterContent;
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: aiOperation,
          prompt: chapterContent || (currentChapter.summary ? `Cốt truyện chương: ${currentChapter.summary}` : ''),
          selectedText: aiOperation === 'REWRITE' ? textToRewrite : (selectedText || (chapterContent ? chapterContent.slice(-800) : '')),
          instruction: aiInstruction,
          directionSummary: activeDirectionSummary,
          length: aiLength,
          projectId: project.id,
          projectGenre: project.genre,
          projectPremise: project.premise,
          systemPrompt: `Thể loại tác phẩm: ${project.genre}. Đề tài: ${project.premise}. Ngữ cảnh thế giới: ${worldBibleText}. Phong cách: ${project.writingStyle}`,
        }),
      });

      const data = await res.json();
      if (res.ok && data.content) {
        const cleaned = cleanAiLiteratureOutput(data.content);
        setAiResult(cleaned);
        if (typeof data.remainingTokens === 'number') {
          setTokenQuota({
            remaining: data.remainingTokens,
            quota: data.quota || 50000,
            countdown: data.resetCountdown || '5 giờ',
            lastUsed: data.tokensUsed,
          });
        }
      } else {
        alert(data.error || 'Lỗi khi gọi AI');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyAiResult = () => {
    if (!aiResult) return;
    const cleaned = cleanAiLiteratureOutput(aiResult);
    if (aiOperation === 'CONTINUE') {
      setChapterContent((prev: string) => (prev ? `${prev}\n\n${cleaned}` : cleaned));
    } else if (aiOperation === 'REWRITE') {
      if (selectionRange && typeof selectionRange.start === 'number' && typeof selectionRange.end === 'number') {
        // Thay thế đúng đoạn văn bản đã bôi đen, bảo toàn phần trước và phần sau của chương
        setChapterContent((prev: string) => {
          const before = prev.substring(0, selectionRange.start);
          const after = prev.substring(selectionRange.end);
          return before + cleaned + after;
        });
      } else {
        // Trau chuốt toàn bộ chương
        setChapterContent(cleaned);
      }
    }
    setAiModalOpen(false);
  };

  const handleSaveWorldBible = async () => {
    setWorldSaving(true);
    try {
      await fetch(`/api/studio/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ worldBible: worldBibleText }),
      });
      alert('Đã cập nhật World Bible');
    } catch (err) {
      alert('Lỗi cập nhật World Bible');
    } finally {
      setWorldSaving(false);
    }
  };

  const handleAddCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCharName.trim()) return;

    const newChar = {
      name: newCharName,
      role: newCharRole,
      appearance: newCharAppearance,
      personality: newCharPersonality,
      goals: newCharGoals,
      abilities: newCharAbilities,
    };

    setCharacters([...characters, newChar]);
    setNewCharName('');
    setNewCharAppearance('');
    setNewCharPersonality('');
    setNewCharGoals('');
    setNewCharAbilities('');
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-5 min-w-0 max-w-full overflow-x-hidden">
      {/* Workbench Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3.5 pb-4 border-b border-border min-w-0 max-w-full">
        <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
          <Link
            href="/studio"
            className="p-2 border border-border bg-surface hover:bg-surface-elevated text-text-secondary hover:text-text-primary transition shrink-0 mt-0.5 sm:mt-0"
            title="Quay lại danh sách dự án"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <span className="label-caps text-primary text-[10px]">BẢN THẢO ĐANG BIÊN TẬP</span>
            <h1 className="font-sans text-lg sm:text-2xl font-bold text-text-primary tracking-tight truncate mt-0.5">
              {project.title}
            </h1>
            <p className="text-[11px] sm:text-xs font-sans text-text-secondary mt-0.5 truncate">
              THỂ LOẠI: <span className="font-semibold text-text-primary">{project.genre}</span> • PHONG CÁCH: {project.writingStyle}
            </p>
          </div>
        </div>

        {/* Tab Switcher & Actions */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full xl:w-auto min-w-0 max-w-full pb-1">
          <div className="flex items-center gap-1 border border-border p-1 bg-surface text-xs font-sans font-medium shrink-0">
            <button
              onClick={() => setActiveTab('editor')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 transition text-xs shrink-0 ${
                activeTab === 'editor'
                  ? 'bg-text-primary text-background font-bold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">BIÊN SOẠN</span>
            </button>
            <button
              onClick={() => setActiveTab('world')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 transition text-xs shrink-0 ${
                activeTab === 'world'
                  ? 'bg-text-primary text-background font-bold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Globe className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">WORLD BIBLE</span>
            </button>
            <button
              onClick={() => setActiveTab('characters')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 transition text-xs shrink-0 ${
                activeTab === 'characters'
                  ? 'bg-text-primary text-background font-bold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">LOREBOOK & SƠ ĐỒ</span>
            </button>
          </div>

          {/* Nút Tùy chỉnh Ảnh bìa */}
          <button
            onClick={() => setCoverModalOpen(true)}
            title="Tùy chỉnh hoặc tải lên ảnh bìa tác phẩm"
            className="flex items-center gap-1.5 px-3 py-2 border border-border bg-surface hover:bg-surface-elevated text-text-primary text-xs font-sans font-bold transition shrink-0"
          >
            <Camera className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline">ẢNH BÌA</span>
          </button>

          {/* Nút Xem trang sách công khai nếu đã xuất bản */}
          {project.publishedBookSlug && (
            <Link
              href={`/book/${project.publishedBookSlug}`}
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-sans font-bold transition shrink-0"
              title="Xem trang sách công khai"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>TRANG SÁCH</span>
            </Link>
          )}

          {/* Nút Xuất bản / Cập nhật thư viện */}
          <button
            onClick={() => {
              setPublishModalOpen(true);
              setPublishSuccessInfo(null);
              setPublishError(null);
            }}
            disabled={isPublishing}
            title={project.publishedBookSlug ? 'Cập nhật nội dung lên thư viện ZORY' : 'Xuất bản tác phẩm cho mọi người cùng đọc'}
            className={`flex items-center gap-1.5 px-3 py-2 border text-xs font-sans font-bold transition shrink-0 ${
              project.publishedBookSlug
                ? 'border-border bg-surface hover:bg-surface-elevated text-text-primary'
                : 'border-primary bg-primary hover:bg-primary/90 text-white shadow-sm'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{project.publishedBookSlug ? 'CẬP NHẬT XUẤT BẢN' : 'XUẤT BẢN LÊN ZORY'}</span>
          </button>

          {/* Nút Xóa Dự Án */}
          <button
            onClick={() => setDeleteProjectModalOpen(true)}
            disabled={isDeletingProject}
            title="Xóa vĩnh viễn dự án bản thảo này"
            className="flex items-center gap-1 px-2.5 sm:px-3 py-2 border border-border bg-surface hover:bg-rose-500/10 hover:border-rose-500/30 text-text-secondary hover:text-rose-500 text-xs font-sans font-semibold transition shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">XÓA DỰ ÁN</span>
          </button>
        </div>
      </div>

      {/* TAB 1: BIÊN SOẠN CHƯƠNG */}
      {activeTab === 'editor' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start min-w-0 max-w-full">
          {/* Cột trái: Danh sách chương & Cốt truyện (Ẩn trên mobile, hiện trên desktop) */}
          <div className="hidden lg:block lg:col-span-3 space-y-4 min-w-0">
            {/* Tóm tắt cốt truyện tổng thể */}
            <div className="border border-border bg-surface p-3.5 space-y-1.5">
              <div className="flex items-center gap-1.5 text-text-tertiary">
                <ScrollText className="w-3.5 h-3.5 text-primary" />
                <span className="label-caps text-[10px]">CỐT TRUYỆN DỰ ÁN</span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed line-clamp-3 font-sans">
                {project.outlines?.[0]?.synopsis || project.premise}
              </p>
            </div>

            {/* Danh sách mục lục */}
            <div className="border border-border bg-surface p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <span className="label-caps">MỤC LỤC BẢN THẢO ({chapters.length})</span>
                <button
                  onClick={handleAddChapter}
                  className="p-1 border border-border bg-surface-elevated hover:bg-primary hover:text-white transition"
                  title="Thêm chương mới"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1.5 max-h-[550px] overflow-y-auto pr-1">
                {chapters.map((ch, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectChapter(idx)}
                    className={`w-full text-left p-2.5 text-xs font-sans transition flex flex-col gap-1 border ${
                      idx === activeChapterIndex
                        ? 'border-primary bg-primary/10 text-primary font-bold'
                        : 'border-transparent text-text-primary hover:bg-surface-elevated'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="truncate flex-1 mr-1.5">
                        [{ch.chapterNumber.toString().padStart(2, '0')}] {ch.title}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {ch.status === 'PUBLISHED' || (!ch.status && ch.content && ch.content.trim().length > 30) ? (
                          <span className="text-[9.5px] font-sans font-semibold px-1 py-0.2 rounded-xs border border-emerald-500/40 bg-emerald-500/10 text-emerald-400">
                            Công khai
                          </span>
                        ) : (
                          <span className="text-[9.5px] font-sans font-semibold px-1 py-0.2 rounded-xs border border-amber-500/40 bg-amber-500/10 text-amber-400">
                            Ẩn
                          </span>
                        )}
                        {ch.content ? (
                          <span className="text-[10px] font-sans font-normal text-text-tertiary">
                            {ch.content.trim().split(/\s+/).length} từ
                          </span>
                        ) : (
                          <span className="text-[10px] font-sans font-normal text-text-tertiary italic">
                            Dự thảo
                          </span>
                        )}
                      </div>
                    </div>
                    {ch.summary && (
                      <span className="text-[10.5px] font-sans font-normal text-text-secondary line-clamp-1 italic text-left">
                        {ch.summary}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Cột phải: Editor & AI Actions */}
          <div className="lg:col-span-9 border border-border bg-surface p-3.5 sm:p-7 space-y-4 min-w-0 max-w-full overflow-x-hidden">
            {/* Mobile Chapter Navigation (< lg) */}
            <div className="lg:hidden flex items-center justify-between gap-1.5 p-2 bg-surface-elevated border border-border">
              <button
                onClick={() => {
                  if (activeChapterIndex > 0) handleSelectChapter(activeChapterIndex - 1);
                }}
                disabled={activeChapterIndex === 0}
                className="p-1.5 border border-border bg-surface text-text-primary disabled:opacity-30 transition"
                title="Chương trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => setMobileChapterListOpen(true)}
                className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 border border-border bg-surface text-xs font-sans font-semibold text-text-primary truncate"
              >
                <List className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="truncate">
                  [{currentChapter.chapterNumber.toString().padStart(2, '0')}] {chapterTitle || currentChapter.title}
                </span>
              </button>

              <button
                onClick={() => {
                  if (activeChapterIndex < chapters.length - 1) handleSelectChapter(activeChapterIndex + 1);
                }}
                disabled={activeChapterIndex >= chapters.length - 1}
                className="p-1.5 border border-border bg-surface text-text-primary disabled:opacity-30 transition"
                title="Chương sau"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Editor Action Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3.5 border-b border-border min-w-0 max-w-full">
              {/* Row 1: AI Tools */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0 max-w-full">
                <button
                  onClick={() => handleOpenAiModal('CONTINUE')}
                  className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-sans font-semibold transition shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI VIẾT TIẾP</span>
                </button>
                <button
                  onClick={() => handleOpenAiModal('REWRITE')}
                  className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 border border-border bg-surface-elevated hover:bg-primary/10 text-text-primary text-xs font-sans font-medium transition"
                >
                  <Wand2 className="w-3.5 h-3.5 text-primary" />
                  <span>TRAU CHUỐT</span>
                </button>
                <button
                  onClick={() => handleOpenAiModal('SUMMARIZE')}
                  className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 border border-border bg-surface-elevated hover:bg-primary/10 text-text-primary text-xs font-sans font-medium transition"
                >
                  <span>TÓM TẮT</span>
                </button>
                <button
                  onClick={handleSuggestBranches}
                  className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 border border-border bg-surface-elevated hover:bg-primary/10 text-primary text-xs font-sans font-semibold transition"
                  title="AI đề xuất 3 ngã rẽ cốt truyện kịch tính"
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">NGÃ RẼ</span>
                </button>
                <div className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-sans border border-border bg-surface-elevated text-text-secondary">
                  <Zap className="w-3 h-3 text-primary" />
                  <span suppressHydrationWarning>
                    Còn <strong>{formatThousands(tokenQuota.remaining)}</strong>
                  </span>
                </div>
              </div>

              {/* Row 2: Word Count & Save */}
              <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 font-sans pt-1 sm:pt-0 min-w-0 max-w-full flex-wrap">
                <span suppressHydrationWarning className="text-[11px] sm:text-xs text-text-secondary truncate">
                  {formatThousands(wordCount)} từ ({formatThousands(chapterContent.length)} ký tự)
                </span>
                {saveMessage && (
                  <span className="text-xs font-sans font-semibold text-success flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>{saveMessage}</span>
                  </span>
                )}
                <button
                  onClick={handleSaveChapter}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-text-primary text-background hover:bg-primary hover:text-white border border-border text-xs font-sans font-semibold transition disabled:opacity-40"
                  title={project.publishedBookSlug ? 'Lưu nội dung và tự động đồng bộ ngay lập tức sang trang đọc truyện' : 'Lưu bản thảo vào Studio'}
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'ĐANG LƯU...' : (project.publishedBookSlug ? 'LƯU & ĐỒNG BỘ TRUYỆN' : 'LƯU BẢN NHÁP')}</span>
                </button>
              </div>
            </div>

            {/* Cốt truyện dự kiến của chương này (nếu có) */}
            {currentChapter.summary && (
              <div className="p-3 border border-border/80 bg-surface-elevated/70 text-xs font-sans space-y-1 min-w-0 max-w-full break-words">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="font-mono text-[10.5px] sm:text-[11px] text-text-tertiary uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-primary" />
                    Cốt truyện định hướng:
                  </span>
                  {!chapterContent.trim() && (
                    <button
                      onClick={() => {
                        handleOpenAiModal(
                          'CONTINUE',
                          `Triển khai thành chính văn hoàn chỉnh từ cốt truyện: "${currentChapter.summary}"`
                        );
                      }}
                      className="text-[11px] font-sans font-semibold text-primary hover:underline flex items-center gap-1 self-start sm:self-auto"
                    >
                      <Sparkles className="w-3 h-3" />
                      AI viết chương này theo cốt truyện
                    </button>
                  )}
                </div>
                <p className="text-text-secondary leading-relaxed font-sans italic text-xs sm:text-sm break-words">
                  {currentChapter.summary}
                </p>
              </div>
            )}

            {/* Thanh trạng thái chương & Đánh dấu Ẩn / Công khai */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-surface-elevated/70 border border-border text-xs font-sans">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-[11px] text-text-secondary uppercase">
                  TRẠNG THÁI CHƯƠNG {currentChapter.chapterNumber}:
                </span>
                {currentChapter.status === 'HIDDEN' ||
                (!currentChapter.status && !chapterContent.trim()) ||
                (currentChapter.status === 'DRAFT' && !chapterContent.trim()) ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs border border-amber-500/40 bg-amber-500/10 text-amber-500 font-semibold text-[11px]">
                    <EyeOff className="w-3 h-3" />
                    <span>ĐANG ẨN (CHƯA VIẾT XONG / BẢN THẢO)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs border border-emerald-500/40 bg-emerald-500/10 text-emerald-500 font-semibold text-[11px]">
                    <Eye className="w-3 h-3" />
                    <span>CÔNG KHAI (ĐÃ ĐĂNG LÊN TRUYỆN)</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleChapterPublishStatus}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 border text-xs font-semibold transition ${
                    currentChapter.status === 'HIDDEN' ||
                    (!currentChapter.status && !chapterContent.trim()) ||
                    (currentChapter.status === 'DRAFT' && !chapterContent.trim())
                      ? 'border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400'
                      : 'border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400'
                  }`}
                  title={
                    currentChapter.status === 'HIDDEN' ||
                    (!currentChapter.status && !chapterContent.trim()) ||
                    (currentChapter.status === 'DRAFT' && !chapterContent.trim())
                      ? 'Bấm để công khai chương này cho độc giả cùng đọc'
                      : 'Bấm để ẩn chương này nếu chưa viết xong'
                  }
                >
                  {currentChapter.status === 'HIDDEN' ||
                  (!currentChapter.status && !chapterContent.trim()) ||
                  (currentChapter.status === 'DRAFT' && !chapterContent.trim()) ? (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>ĐÁNH DẤU CÔNG KHAI</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>ẨN CHƯƠNG (CHƯA XONG)</span>
                    </>
                  )}
                </button>

                {chapters.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleDeleteChapter(activeChapterIndex)}
                    className="p-1 border border-border hover:border-rose-500/40 hover:bg-rose-500/10 text-text-secondary hover:text-rose-500 transition"
                    title="Xóa chương này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Tiêu đề chương */}
            <div className="min-w-0 max-w-full">
              <input
                type="text"
                value={chapterTitle}
                onChange={(e) => setChapterTitle(e.target.value)}
                placeholder="Nhập tiêu đề chương..."
                className="w-full min-w-0 max-w-full font-sans text-lg sm:text-2xl font-bold bg-transparent border-b border-border focus:border-primary pb-2 text-text-primary focus:outline-none"
              />
            </div>

            {/* Textarea nội dung */}
            <div className="min-w-0 max-w-full">
              <textarea
                ref={textareaRef}
                value={chapterContent}
                onChange={(e) => setChapterContent(e.target.value)}
                onSelect={handleTextareaSelect}
                onKeyUp={handleTextareaSelect}
                onMouseUp={handleTextareaSelect}
                placeholder="Khởi đầu bản thảo tại đây... Từng câu chữ mở ra vũ trụ văn học."
                rows={16}
                className="w-full min-w-0 max-w-full box-border p-3 sm:p-5 font-serif text-base sm:text-lg leading-relaxed border border-border bg-surface-elevated text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-primary reader-content"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WORLD BIBLE */}
      {activeTab === 'world' && (
        <div className="border border-border bg-surface p-6 sm:p-8 space-y-5 max-w-5xl mx-auto">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <span className="label-caps">TÀI LIỆU NỀN TẢNG</span>
              <h2 className="font-sans text-lg font-bold text-text-primary">
                World Bible (Thiết Lập Thế Giới Hư Cấu)
              </h2>
              <p className="text-xs text-text-secondary">
                Dữ liệu bối cảnh làm mốc quy chiếu tri thức cho mọi câu lệnh sinh văn học của AI.
              </p>
            </div>
            <button
              onClick={handleSaveWorldBible}
              disabled={worldSaving}
              className="px-4 py-2 bg-text-primary text-background hover:bg-primary hover:text-white text-xs font-mono border border-border transition"
            >
              {worldSaving ? 'ĐANG LƯU...' : 'LƯU WORLD BIBLE'}
            </button>
          </div>

          <textarea
            value={worldBibleText}
            onChange={(e) => setWorldBibleText(e.target.value)}
            rows={16}
            placeholder="Quy tắc vũ trụ, tôn ti trật tự, hệ thống ma pháp / tu luyện, địa lý và lịch sử cổ xưa..."
            className="w-full p-4 text-xs font-mono border border-border bg-surface-elevated text-text-primary focus:outline-none focus:border-primary leading-relaxed"
          />
        </div>
      )}

      {/* TAB 3: LOREBOOK & SƠ ĐỒ NHÂN VẬT */}
      {activeTab === 'characters' && (
        <LorebookManager projectId={project.id} projectTitle={project.title} />
      )}
    </div>

    {/* MODAL MỤC LỤC CHƯƠNG TRÊN MOBILE */}
    {mobileChapterListOpen && (
      <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-4 !m-0">
        <div className="w-full sm:max-w-md bg-surface border-t sm:border border-border p-4 sm:p-6 space-y-3.5 max-h-[85vh] flex flex-col">
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <span className="label-caps">MỤC LỤC BẢN THẢO ({chapters.length})</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  handleAddChapter();
                  setMobileChapterListOpen(false);
                }}
                className="px-2 py-1 text-xs border border-border bg-surface-elevated text-primary font-bold flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Thêm</span>
              </button>
              <button
                onClick={() => setMobileChapterListOpen(false)}
                className="p-1 text-text-secondary hover:text-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {chapters.map((ch, idx) => (
              <button
                key={idx}
                onClick={() => {
                  handleSelectChapter(idx);
                  setMobileChapterListOpen(false);
                }}
                className={`w-full text-left p-2.5 text-xs font-mono transition flex flex-col gap-1 border ${
                  idx === activeChapterIndex
                    ? 'border-primary bg-primary/10 text-primary font-bold'
                    : 'border-border bg-surface-elevated text-text-primary'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="truncate flex-1 mr-1.5">
                    [{ch.chapterNumber.toString().padStart(2, '0')}] {ch.title}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {ch.status === 'PUBLISHED' || (!ch.status && ch.content && ch.content.trim().length > 30) ? (
                      <span className="text-[9.5px] font-sans font-semibold px-1 py-0.2 rounded-xs border border-emerald-500/40 bg-emerald-500/10 text-emerald-400">
                        Công khai
                      </span>
                    ) : (
                      <span className="text-[9.5px] font-sans font-semibold px-1 py-0.2 rounded-xs border border-amber-500/40 bg-amber-500/10 text-amber-400">
                        Ẩn
                      </span>
                    )}
                    <span className="text-[10px] font-sans font-normal text-text-tertiary">
                      {ch.content ? `${ch.content.trim().split(/\s+/).length} từ` : 'Dự thảo'}
                    </span>
                  </div>
                </div>
                {ch.summary && (
                  <span className="text-[10.5px] font-sans font-normal text-text-secondary line-clamp-1 italic text-left">
                    {ch.summary}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    )}

    {/* POPUP GỢI Ý NGÃ RẼ CỐT TRUYỆN */}
    {branchModalOpen && (
      <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3 sm:p-4 !m-0">
          <div className="w-full max-w-2xl bg-surface border border-border p-4 sm:p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-primary" />
                <h3 className="label-caps text-text-primary text-xs sm:text-sm">
                  AI GỢI Ý NGÃ RẼ CỐT TRUYỆN ĐA VŨ TRỤ
                </h3>
              </div>
              <button
                onClick={() => setBranchModalOpen(false)}
                className="p-1 text-text-secondary hover:text-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {branchLoading ? (
              <div className="p-12 text-center space-y-3 font-mono text-xs text-text-secondary">
                <Sparkles className="w-6 h-6 text-primary animate-spin mx-auto" />
                <p>AI đang phân tích cao trào và tạo 3 nhánh rẽ kịch tính...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-surface-elevated border border-border text-xs sm:text-sm font-serif leading-relaxed whitespace-pre-line text-text-primary">
                  {branchResult}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-[11px] font-mono text-text-muted">
                    Bạn có thể sao chép một nhánh để định hướng cho chương kế tiếp.
                  </span>
                  <button
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(branchResult);
                        alert('Đã sao chép các ngã rẽ vào clipboard!');
                      }
                    }}
                    className="px-4 py-2 bg-text-primary text-background hover:bg-primary hover:text-white font-mono text-xs font-bold transition"
                  >
                    SAO CHÉP NGÃ RẼ
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* POPUP TRỢ LÝ AI (PREVIEW & CONFIRM) */}
      {aiModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3 sm:p-4 !m-0">
          <div className="w-full max-w-2xl bg-surface border border-border p-4 sm:p-7 space-y-4 sm:space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="label-caps text-text-primary text-xs sm:text-sm">
                  {aiOperation === 'CONTINUE'
                    ? 'AI ĐỒNG TÁC GIẢ: VIẾT TIẾP BẢN THẢO'
                    : aiOperation === 'REWRITE'
                    ? 'AI TRAU CHUỐT VĂN PHONG'
                    : 'AI TÓM TẮT BẢN THẢO'}
                </h3>
              </div>
              <button
                onClick={() => setAiModalOpen(false)}
                className="p-1 text-text-secondary hover:text-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stepper Tabs (Chỉ hiển thị cho luồng VIẾT TIẾP) */}
            {aiOperation === 'CONTINUE' && (
              <div className="grid grid-cols-2 gap-2 p-1 bg-surface-elevated border border-border text-xs font-sans">
                <button
                  type="button"
                  onClick={() => setAiStep(1)}
                  className={`flex items-center justify-center gap-2 py-2 px-3 transition font-medium ${
                    aiStep === 1
                      ? 'bg-surface text-primary font-bold shadow-xs border border-border'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${
                      aiStep === 1
                        ? 'bg-primary text-white font-bold'
                        : activeDirectionSummary
                        ? 'bg-emerald-500/20 text-emerald-400 font-bold'
                        : 'bg-border text-text-secondary'
                    }`}
                  >
                    {activeDirectionSummary && aiStep === 2 ? '✓' : '1'}
                  </span>
                  <span>01. ĐỊNH HƯỚNG TÌNH TIẾT</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (directionOptions.length > 0 || customDirection.trim() || activeDirectionSummary) {
                      handleProceedToProse();
                    }
                  }}
                  className={`flex items-center justify-center gap-2 py-2 px-3 transition font-medium ${
                    aiStep === 2
                      ? 'bg-surface text-primary font-bold shadow-xs border border-border'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${
                      aiStep === 2 ? 'bg-primary text-white font-bold' : 'bg-border text-text-secondary'
                    }`}
                  >
                    2
                  </span>
                  <span>02. SINH CHÍNH VĂN</span>
                </button>
              </div>
            )}

            {/* BƯỚC 1: ĐỊNH HƯỚNG TÌNH TIẾT (CHỈ DÀNH CHO CONTINUE Ở BƯỚC 1) */}
            {aiOperation === 'CONTINUE' && aiStep === 1 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <p className="text-[11px] font-sans text-text-secondary leading-relaxed">
                    AI đã đọc phân đoạn gần nhất để gợi ý 3 hướng diễn biến tiếp theo. Chọn 1 hướng hoặc tự phác thảo ý tưởng riêng:
                  </p>
                  <button
                    type="button"
                    onClick={fetchDirections}
                    disabled={directionLoading}
                    title="Phân tích lại và tạo gợi ý mới"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-sans border border-border bg-surface-elevated hover:bg-surface text-text-secondary hover:text-text-primary transition shrink-0 disabled:opacity-50"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${directionLoading ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Tạo lại gợi ý</span>
                  </button>
                </div>

                {directionLoading ? (
                  <div className="space-y-3 py-2">
                    <div className="flex items-center justify-center gap-2 text-xs text-text-secondary py-3">
                      <Sparkles className="w-4 h-4 text-primary animate-spin" />
                      <span>AI đang phân tích mạch truyện và tạo 3 hướng đi kịch tính...</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="p-3.5 border border-border bg-surface-elevated/50 space-y-2.5 animate-pulse"
                        >
                          <div className="w-16 h-4 bg-border/60 rounded" />
                          <div className="w-3/4 h-4 bg-border/60 rounded" />
                          <div className="space-y-1.5 pt-1">
                            <div className="w-full h-3 bg-border/40 rounded" />
                            <div className="w-5/6 h-3 bg-border/40 rounded" />
                            <div className="w-4/6 h-3 bg-border/40 rounded" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
                    {directionOptions.map((opt) => {
                      const isSelected = selectedDirectionId === opt.id;
                      const isExpanded = expandedDirectionIds[opt.id] ?? isSelected;
                      const tagColor =
                        opt.tag === 'CAO TRÀO'
                          ? 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                          : opt.tag === 'BÍ ẨN'
                          ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                          : opt.tag === 'TÂM LÝ'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                          : 'bg-primary/10 text-primary border-primary/30';

                      return (
                        <div
                          key={opt.id}
                          onClick={() => {
                            setSelectedDirectionId(opt.id);
                            setCustomDirection(`${opt.title}: ${opt.summary}`);
                            setExpandedDirectionIds((prev) => ({ ...prev, [opt.id]: true }));
                          }}
                          className={`cursor-pointer p-3.5 border transition space-y-2.5 flex flex-col justify-between text-left relative ${
                            isSelected
                              ? 'border-primary bg-primary/10 ring-1 ring-primary shadow-xs'
                              : 'border-border bg-surface-elevated hover:border-text-tertiary hover:bg-surface'
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span
                                className={`label-caps text-[9px] px-1.5 py-0.5 border rounded-xs font-mono ${tagColor}`}
                              >
                                {opt.tag}
                              </span>
                              <div
                                className={`w-4 h-4 rounded-full border flex items-center justify-center text-[9px] ${
                                  isSelected
                                    ? 'border-primary bg-primary text-white font-bold'
                                    : 'border-border text-transparent'
                                }`}
                              >
                                ✓
                              </div>
                            </div>
                            <h4 className="font-sans font-bold text-xs text-text-primary leading-snug">
                              {opt.title}
                            </h4>
                            <p
                              className={`text-[11px] font-sans text-text-secondary leading-relaxed ${
                                isExpanded ? 'whitespace-pre-wrap' : 'line-clamp-4'
                              }`}
                            >
                              {opt.summary}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[10px] font-mono text-text-tertiary">
                            <span>Hướng {opt.id}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedDirectionIds((prev) => ({
                                  ...prev,
                                  [opt.id]: !isExpanded,
                                }));
                              }}
                              className="text-text-muted hover:text-primary transition flex items-center gap-0.5"
                              title={isExpanded ? 'Thu gọn tóm tắt' : 'Xem toàn bộ nội dung'}
                            >
                              <span>{isExpanded ? 'Thu gọn' : 'Xem hết'}</span>
                              {isExpanded ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Ô tự phác thảo hoặc chỉnh sửa thêm ý riêng */}
                <div className="space-y-1.5 pt-2 border-t border-border/60">
                  <div className="flex items-center justify-between gap-2">
                    <label className="block text-xs font-mono font-bold text-text-primary flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5 text-primary" />
                      <span>
                        {selectedDirectionId
                          ? `TÙY BIẾN / CHỈNH SỬA THÊM Ý RIÊNG CHO HƯỚNG ${selectedDirectionId}:`
                          : 'HOẶC PHÁC THẢO Ý TƯỞNG CỦA RIÊNG BẠN:'}
                      </span>
                    </label>
                    {selectedDirectionId && (
                      <button
                        type="button"
                        onClick={() => {
                          const opt = directionOptions.find((d) => d.id === selectedDirectionId);
                          if (opt) {
                            setCustomDirection(`${opt.title}: ${opt.summary}`);
                          }
                        }}
                        className="text-[10px] font-sans text-text-muted hover:text-primary transition flex items-center gap-1 shrink-0"
                        title="Khôi phục lại gợi ý gốc của AI"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Đặt lại ý gốc AI</span>
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={3}
                    value={customDirection}
                    onChange={(e) => {
                      setCustomDirection(e.target.value);
                    }}
                    placeholder="Bấm chọn 1 hướng ở trên để chỉnh sửa câu chữ, hoặc tự gõ toàn bộ ý tưởng theo ý bạn tại đây..."
                    className="w-full p-2.5 text-xs font-sans border border-border bg-surface-elevated text-text-primary focus:outline-none focus:border-primary resize-y leading-relaxed"
                  />
                  <div className="flex items-center justify-between text-[10px] font-sans text-text-tertiary">
                    <span>
                      💡 Bạn có thể xem trọn vẹn văn bản ở trên hoặc thoải mái thêm thắt ý riêng vào ô này; AI sẽ viết bám sát 100% nội dung bạn đã chỉnh sửa.
                    </span>
                    {customDirection.trim() && (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomDirection('');
                          setSelectedDirectionId(null);
                        }}
                        className="text-text-muted hover:text-rose-500 transition shrink-0 ml-2"
                      >
                        Xóa ô này
                      </button>
                    )}
                  </div>
                </div>

                {/* Footer hành động Bước 1 */}
                <div className="flex items-center justify-between gap-3 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={handleSkipDirections}
                    className="px-3.5 py-2 border border-border text-xs font-sans text-text-secondary hover:text-text-primary transition"
                  >
                    BỎ QUA (VIẾT TỰ DO)
                  </button>
                  <button
                    type="button"
                    disabled={directionLoading || (!selectedDirectionId && !customDirection.trim())}
                    onClick={handleProceedToProse}
                    className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-sans font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-40"
                  >
                    <span>TIẾP TỤC VỚI HƯỚNG NÀY</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              /* BƯỚC 2: SINH CHÍNH VĂN (HOẶC CHẾ ĐỘ REWRITE/SUMMARIZE) */
              <>
                {aiOperation === 'REWRITE' ? (
                  <div className="p-3.5 border border-primary/30 bg-primary/5 space-y-2">
                    <div className="font-semibold text-xs text-primary flex items-center gap-1.5 font-sans">
                      <Wand2 className="w-3.5 h-3.5" />
                      <span>Chế độ: Trau chuốt & Gọt dũa câu từ tự nhiên</span>
                    </div>
                    <p className="text-[11px] font-sans text-text-secondary leading-relaxed">
                      {selectionRange ? (
                        <>
                          Đang trau chuốt <strong>đoạn văn bản đã chọn ({selectedText.trim().split(/\s+/).filter(Boolean).length} từ)</strong>. AI giữ nguyên 100% cốt truyện, nhân vật và sự kiện; chỉ sửa câu văn lủng củng, sượng gạo cho tự nhiên, mượt mà và giàu cảm xúc hơn.
                        </>
                      ) : (
                        <>
                          Đang trau chuốt <strong>toàn bộ chương ({wordCount} từ)</strong>. AI giữ nguyên tình tiết gốc, gọt dũa từ ngữ trôi chảy, tự nhiên và xóa bỏ cảm giác dịch máy.
                        </>
                      )}
                    </p>
                    {selectedText && selectionRange && (
                      <div className="pt-2 border-t border-border/50">
                        <span className="block text-[10px] font-mono text-text-tertiary mb-1">
                          ĐOẠN TRÍCH ĐÃ BÔI ĐEN:
                        </span>
                        <div className="p-2.5 bg-surface border border-border text-xs font-serif italic text-text-secondary max-h-24 overflow-y-auto reader-content">
                          "{selectedText}"
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Banner hiển thị hướng đi đã chốt (nếu có) */}
                    {aiOperation === 'CONTINUE' && activeDirectionSummary && (
                      <div className="p-3 border border-primary/30 bg-primary/10 flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <span className="label-caps text-[9px] text-primary block">
                            HƯỚNG ĐI ĐÃ DUYỆT (AI BÁM SÁT 100%):
                          </span>
                          <p className="text-xs font-sans text-text-primary font-medium leading-relaxed">
                            {activeDirectionSummary}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAiStep(1)}
                          className="text-[11px] font-sans text-primary hover:underline shrink-0 flex items-center gap-1 mt-0.5"
                        >
                          <ArrowLeft className="w-3 h-3" />
                          <span>Đổi hướng</span>
                        </button>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="block text-xs font-mono text-text-secondary">
                        DUNG LƯỢNG SINH VĂN MONG MUỐN:
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <button
                          type="button"
                          onClick={() => setAiLength('epic')}
                          className={`py-2 px-1.5 sm:px-2.5 text-xs font-sans border transition text-center ${
                            aiLength === 'epic'
                              ? 'border-primary bg-primary/15 text-primary font-bold ring-1 ring-primary'
                              : 'border-border bg-surface-elevated text-text-secondary hover:text-text-primary'
                          }`}
                        >
                          <div className="font-semibold text-xs flex items-center justify-center gap-1">
                            <span>Đại chương</span>
                            <span className="text-[9px] bg-primary text-white px-1 rounded-xs">VIP</span>
                          </div>
                          <div className="text-[10px] text-text-tertiary">~2500 - 3500 từ</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAiLength('detailed')}
                          className={`py-2 px-1.5 sm:px-2.5 text-xs font-sans border transition text-center ${
                            aiLength === 'detailed'
                              ? 'border-primary bg-primary/15 text-primary font-bold ring-1 ring-primary'
                              : 'border-border bg-surface-elevated text-text-secondary hover:text-text-primary'
                          }`}
                        >
                          <div className="font-semibold text-xs">Cảnh dài</div>
                          <div className="text-[10px] text-text-tertiary">~1800 - 2200 từ</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAiLength('standard')}
                          className={`py-2 px-1.5 sm:px-2.5 text-xs font-sans border transition text-center ${
                            aiLength === 'standard'
                              ? 'border-primary bg-primary/15 text-primary font-bold ring-1 ring-primary'
                              : 'border-border bg-surface-elevated text-text-secondary hover:text-text-primary'
                          }`}
                        >
                          <div className="font-semibold text-xs">Tiêu chuẩn</div>
                          <div className="text-[10px] text-text-tertiary">~1000 - 1400 từ</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAiLength('short')}
                          className={`py-2 px-1.5 sm:px-2.5 text-xs font-sans border transition text-center ${
                            aiLength === 'short'
                              ? 'border-primary bg-primary/15 text-primary font-bold ring-1 ring-primary'
                              : 'border-border bg-surface-elevated text-text-secondary hover:text-text-primary'
                          }`}
                        >
                          <div className="font-semibold text-xs">Ngắn gọn</div>
                          <div className="text-[10px] text-text-tertiary">~500 - 700 từ</div>
                        </button>
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <label className="block text-xs font-mono text-text-secondary">
                    CHỈ DẪN BIÊN TẬP BỔ SUNG (TÙY CHỌN):
                  </label>
                  <input
                    type="text"
                    value={aiInstruction}
                    onChange={(e) => setAiInstruction(e.target.value)}
                    placeholder="Ví dụ: Giữ giọng văn cổ điển, tăng cảm xúc bi tráng..."
                    className="w-full p-2.5 text-xs font-mono border border-border bg-surface-elevated text-text-primary focus:outline-none focus:border-primary"
                  />
                </div>

                <button
                  onClick={handleTriggerAi}
                  disabled={aiLoading}
                  className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-mono font-semibold border border-border transition disabled:opacity-40"
                >
                  {aiLoading ? 'AI ĐANG SINH VĂN...' : 'TẠO BẢN ĐỀ XUẤT'}
                </button>
              </>
            )}

            {aiResult && (
              <div className="space-y-3 pt-3 border-t border-border">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <span className="label-caps text-xs">
                    BẢN SOẠN THẢO ĐỀ XUẤT:
                  </span>
                  <div className="inline-flex flex-wrap items-center gap-1.5 px-2 py-1 text-[10px] sm:text-[11px] font-sans border border-primary/30 bg-primary/10 text-primary self-start sm:self-auto">
                    <Zap className="w-3 h-3 text-primary shrink-0" />
                    <span suppressHydrationWarning>
                      Còn: <strong>{formatThousands(tokenQuota.remaining)}</strong> tokens
                    </span>
                    {tokenQuota.lastUsed ? (
                      <span className="text-text-secondary">(-{formatThousands(tokenQuota.lastUsed)})</span>
                    ) : null}
                    <span className="text-text-tertiary">• Reset sau: {tokenQuota.countdown}</span>
                  </div>
                </div>
                <div className="p-3.5 sm:p-4 border border-border bg-surface-elevated font-serif text-sm leading-relaxed text-text-primary max-h-56 sm:max-h-64 overflow-y-auto whitespace-pre-line reader-content">
                  {aiResult}
                </div>

                <div className="grid grid-cols-2 sm:flex sm:justify-end gap-2 pt-2">
                  <button
                    onClick={() => setAiModalOpen(false)}
                    className="px-4 py-2 border border-border text-xs font-sans text-text-secondary hover:text-text-primary"
                  >
                    HỦY
                  </button>
                  <button
                    onClick={handleApplyAiResult}
                    className="px-4 py-2 bg-text-primary text-background hover:bg-primary hover:text-white text-xs font-sans font-semibold border border-border transition"
                  >
                    {selectionRange
                      ? 'THAY THẾ ĐOẠN ĐÃ CHỌN'
                      : aiOperation === 'CONTINUE'
                      ? 'CHÈN VÀO BẢN THẢO'
                      : 'ÁP DỤNG VÀO BẢN THẢO'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN XÓA DỰ ÁN BẢN THẢO */}
      {deleteProjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 !m-0 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-surface border border-border p-5 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-sm bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <span className="label-caps text-rose-500 text-[10px]">HÀNH ĐỘNG NGUY HIỂM</span>
                <h3 className="font-sans text-base font-bold text-text-primary">
                  Xóa Vĩnh Viễn Dự Án
                </h3>
              </div>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed font-sans">
              Bạn có chắc chắn muốn xóa vĩnh viễn dự án bản thảo <strong>"{project.title}"</strong> không? Toàn bộ {chapters.length} chương, tài liệu World Bible và các hồ sơ Lorebook liên quan sẽ bị xóa hoàn toàn.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setDeleteProjectModalOpen(false)}
                className="px-4 py-2 border border-border text-xs font-sans font-medium text-text-secondary hover:text-text-primary transition"
              >
                HỦY
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteProject}
                disabled={isDeletingProject}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-sans font-bold transition shadow-sm disabled:opacity-50"
              >
                {isDeletingProject ? 'ĐANG XÓA...' : 'XÓA DỰ ÁN'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XUẤT BẢN DỰ ÁN LÊN THƯ VIỆN ZORY */}
      {publishModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 !m-0 animate-in fade-in duration-150">
          <div className="bg-surface border border-border p-6 max-w-lg w-full space-y-5 shadow-2xl">
            {!publishSuccessInfo ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 border border-primary/30 bg-primary/10 text-primary rounded">
                    <Globe className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-sans text-base font-bold text-text-primary">
                      {project.publishedBookSlug
                        ? 'Cập Nhật Xuất Bản Lên Thư Viện'
                        : 'Xuất Bản Tác Phẩm Ra Công Khai'}
                    </h3>
                    <span className="text-[11px] font-sans text-text-secondary">
                      ĐỒNG BỘ TOÀN BỘ CHƯƠNG VÀ LOREBOOK LÊN NỀN TẢNG ZORY
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-surface-elevated border border-border text-xs font-sans space-y-2">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Tác phẩm:</span>
                    <strong className="text-text-primary font-bold text-right truncate max-w-[280px]">
                      {project.title}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Thể loại:</span>
                    <span className="text-primary font-semibold">{project.genre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Quy mô hiện tại:</span>
                    <span className="text-text-primary font-medium">
                      {chapters.length} chương ({chapters.filter((c) => c.status === 'PUBLISHED').length} công khai, {chapters.filter((c) => c.status === 'DRAFT' || c.status === 'HIDDEN' || !c.status).length} ẩn)
                    </span>
                  </div>
                </div>

                <p className="text-xs font-sans text-text-secondary leading-relaxed">
                  Khi cập nhật, các chương được đánh dấu <strong>CÔNG KHAI</strong> sẽ lập tức hiển thị trên <strong>Khám Phá</strong> và <strong>Trang Đọc Truyện</strong>. Các chương đánh dấu <strong>ẨN</strong> sẽ được giữ riêng tư cho bạn tiếp tục hoàn thiện.
                </p>

                {publishError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-sans">
                    {publishError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                  <button
                    type="button"
                    disabled={isPublishing}
                    onClick={() => setPublishModalOpen(false)}
                    className="px-4 py-2 border border-border text-xs font-bold font-sans text-text-secondary hover:text-text-primary transition"
                  >
                    HỦY BỎ
                  </button>
                  <button
                    type="button"
                    disabled={isPublishing}
                    onClick={handlePublishProject}
                    className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-bold font-sans transition flex items-center gap-1.5"
                  >
                    {isPublishing ? (
                      <>
                        <RotateCw className="w-3.5 h-3.5 animate-spin" />
                        <span>ĐANG ĐỒNG BỘ...</span>
                      </>
                    ) : (
                      <>
                        <Globe className="w-3.5 h-3.5" />
                        <span>XÁC NHẬN XUẤT BẢN</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-emerald-400">
                  <div className="p-2.5 border border-emerald-500/30 bg-emerald-500/10 rounded">
                    <Check className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-sans text-base font-bold text-text-primary">
                      Xuất Bản Thành Công!
                    </h3>
                    <span className="text-[11px] font-sans text-emerald-400">
                      TÁC PHẨM ĐÃ HIỆN DIỆN CÔNG KHAI TRÊN ZORY
                    </span>
                  </div>
                </div>

                <p className="text-xs font-sans text-text-secondary leading-relaxed">
                  Tác phẩm <strong className="text-text-primary">"{project.title}"</strong> cùng{' '}
                  <strong className="text-text-primary">{publishSuccessInfo.chapterCount} chương</strong> và dữ liệu lorebook đã được đưa lên thư viện. Mọi người có thể đọc ngay bây giờ!
                </p>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Link
                    href={`/book/${publishSuccessInfo.slug || project.publishedBookSlug || ''}`}
                    target="_blank"
                    className="px-3 py-2.5 bg-surface-elevated hover:bg-border border border-border text-text-primary text-xs font-bold font-sans text-center transition flex items-center justify-center gap-1.5"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-primary" />
                    <span>XEM TRANG SÁCH</span>
                    <ExternalLink className="w-3 h-3 text-text-tertiary" />
                  </Link>
                  <Link
                    href={`/read/${publishSuccessInfo.slug || project.publishedBookSlug || ''}/1`}
                    target="_blank"
                    className="px-3 py-2.5 bg-primary hover:bg-primary/90 text-white text-xs font-bold font-sans text-center transition flex items-center justify-center gap-1.5"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>ĐỌC CHƯƠNG 1</span>
                  </Link>
                </div>

                <div className="flex justify-end pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => {
                      setPublishModalOpen(false);
                      setPublishSuccessInfo(null);
                    }}
                    className="px-4 py-2 border border-border text-xs font-bold font-sans text-text-secondary hover:text-text-primary transition"
                  >
                    ĐÓNG
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL TÙY CHỈNH ẢNH BÌA TÁC PHẨM */}
      <CoverPickerModal
        isOpen={coverModalOpen}
        onClose={() => setCoverModalOpen(false)}
        currentCoverUrl={project.coverUrl || null}
        bookTitle={project.title}
        genre={project.genre}
        projectId={project.id}
        bookSlug={project.publishedBookSlug || undefined}
        onSave={(newUrl) => {
          setProject((prev: any) => ({ ...prev, coverUrl: newUrl }));
        }}
      />
    </>
  );
}
