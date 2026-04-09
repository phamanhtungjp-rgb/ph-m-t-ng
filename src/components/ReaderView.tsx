import { ArrowLeft, ArrowRight, Settings, Menu, X, ChevronLeft, ChevronRight, List, AlertTriangle } from 'lucide-react';
import { Novel, Chapter } from '../types';
import { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType, auth } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

interface ReaderViewProps {
  novel: Novel;
  chapter: Chapter;
  onBack: () => void;
  onChapterChange: (chapter: Chapter) => void;
}

export default function ReaderView({ novel, chapter, onBack, onChapterChange }: ReaderViewProps) {
  const [fontSize, setFontSize] = useState(22);
  const [theme, setTheme] = useState<'light' | 'sepia' | 'dark'>('sepia');
  const [fontFamily, setFontFamily] = useState<'serif' | 'sans'>('serif');
  const [showSettings, setShowSettings] = useState(false);
  const [showChapterList, setShowChapterList] = useState(false);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);

  // Auto-hide controls on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsControlsVisible(false);
        setShowSettings(false);
      } else if (currentScrollY < lastScrollY) {
        setIsControlsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const toggleControls = () => {
    setIsControlsVisible(!isControlsVisible);
  };

  // Save progress when chapter changes
  useEffect(() => {
    const saveProgress = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const currentIndex = novel.chapters.findIndex(c => c.id === chapter.id);
      const progress = Math.floor(((currentIndex + 1) / novel.chapters.length) * 100);
      const path = `users/${user.uid}/bookshelf/${novel.id}`;

      try {
        await setDoc(doc(db, path), {
          novelId: novel.id,
          lastChapterId: chapter.id,
          lastChapterNumber: chapter.chapterNumber,
          progress: progress,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    };

    saveProgress();
  }, [chapter, novel, auth.currentUser]);

  const themes = {
    light: 'bg-[#FFFFFF] text-[#1A1A1A] border-accent/10',
    sepia: 'bg-[#F4ECD8] text-[#5B4636] border-[#DBCFB0]',
    dark: 'bg-[#121212] text-[#A0A0A0] border-[#2A2A2A]',
  };

  const fonts = {
    serif: 'font-serif',
    sans: 'font-sans',
  };

  const currentIndex = novel.chapters.findIndex(c => c.id === chapter.id);
  const prevChapter = currentIndex > 0 ? novel.chapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < novel.chapters.length - 1 ? novel.chapters[currentIndex + 1] : null;

  return (
    <div 
      className={`min-h-screen transition-colors duration-500 ${themes[theme]} ${fonts[fontFamily]}`}
      onClick={(e) => {
        // Only toggle if clicking on the main content area, not on buttons/panels
        if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('.z-50')) return;
        toggleControls();
      }}
    >
      {/* Reader Header */}
      <header className={`fixed top-0 inset-x-0 h-16 flex items-center justify-between px-6 z-50 backdrop-blur-md bg-opacity-90 border-b ${themes[theme]} transition-transform duration-500 ${isControlsVisible ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-black/5 rounded-full transition-colors">
            <ArrowLeft className="size-5" />
          </button>
          <div className="flex flex-col">
            <h2 className="text-sm font-black truncate max-w-[180px] md:max-w-md uppercase tracking-tighter">{novel.title}</h2>
            <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Chương {chapter.chapterNumber}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-black/5 rounded-full transition-colors"
          >
            <Settings className="size-5" />
          </button>
          <button 
            onClick={() => setShowChapterList(!showChapterList)}
            className="p-2 hover:bg-black/5 rounded-full transition-colors"
          >
            <List className="size-5" />
          </button>
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div className="fixed top-20 right-6 w-80 bg-surface rounded-[32px] shadow-2xl p-8 z-50 border border-accent/10 text-text-main animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-black uppercase tracking-widest text-sm">Cài đặt trình đọc</h3>
            <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-background-light rounded-full transition-colors">
              <X className="size-4" />
            </button>
          </div>
          <div className="space-y-8">
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] font-black text-muted mb-4 block">Màu nền</label>
              <div className="flex gap-3">
                <button onClick={() => setTheme('light')} className={`flex-1 h-12 rounded-2xl border-2 transition-all ${theme === 'light' ? 'border-primary ring-4 ring-primary/10' : 'border-background-light'} bg-[#FFFFFF]`}></button>
                <button onClick={() => setTheme('sepia')} className={`flex-1 h-12 rounded-2xl border-2 transition-all ${theme === 'sepia' ? 'border-primary ring-4 ring-primary/10' : 'border-background-light'} bg-[#F4ECD8]`}></button>
                <button onClick={() => setTheme('dark')} className={`flex-1 h-12 rounded-2xl border-2 transition-all ${theme === 'dark' ? 'border-primary ring-4 ring-primary/10' : 'border-background-light'} bg-[#121212]`}></button>
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] font-black text-muted mb-4 block">Kiểu chữ</label>
              <div className="flex gap-3">
                <button 
                  onClick={() => setFontFamily('serif')} 
                  className={`flex-1 py-3 rounded-2xl border-2 font-serif font-bold transition-all ${fontFamily === 'serif' ? 'border-primary bg-primary/5 text-primary' : 'border-background-light text-muted'}`}
                >
                  Serif
                </button>
                <button 
                  onClick={() => setFontFamily('sans')} 
                  className={`flex-1 py-3 rounded-2xl border-2 font-sans font-bold transition-all ${fontFamily === 'sans' ? 'border-primary bg-primary/5 text-primary' : 'border-background-light text-muted'}`}
                >
                  Sans
                </button>
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] font-black text-muted mb-4 block">Cỡ chữ</label>
              <div className="flex items-center gap-4">
                <button onClick={() => setFontSize(Math.max(16, fontSize - 2))} className="flex-1 py-3 bg-background-light rounded-2xl font-black hover:bg-primary hover:text-white transition-all">A-</button>
                <span className="font-black w-10 text-center text-lg">{fontSize}</span>
                <button onClick={() => setFontSize(Math.min(40, fontSize + 2))} className="flex-1 py-3 bg-background-light rounded-2xl font-black hover:bg-primary hover:text-white transition-all">A+</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chapter List Sidebar/Overlay */}
      {showChapterList && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowChapterList(false)}></div>
          <div className="relative w-full max-w-sm bg-surface h-full shadow-2xl p-8 flex flex-col animate-in slide-in-from-right duration-500">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-black uppercase tracking-widest text-sm text-text-main">Danh sách chương</h3>
              <button onClick={() => setShowChapterList(false)} className="p-2 hover:bg-background-light rounded-full transition-colors text-text-main">
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {novel.chapters.map((c) => (
                <button 
                  key={c.id}
                  onClick={() => {
                    onChapterChange(c);
                    setShowChapterList(false);
                  }}
                  className={`w-full text-left p-4 rounded-2xl transition-all ${c.id === chapter.id ? 'bg-primary text-white font-bold shadow-lg shadow-primary/20' : 'text-text-main hover:bg-background-light'}`}
                >
                  <span className="text-xs opacity-60 block mb-1">Chương {c.chapterNumber}</span>
                  <span className="line-clamp-1">{c.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reader Footer Bar (Fixed) */}
      <footer className={`fixed bottom-0 inset-x-0 h-16 flex items-center justify-between px-6 z-50 backdrop-blur-md bg-opacity-90 border-t ${themes[theme]} transition-transform duration-500 ${isControlsVisible ? 'translate-y-0' : 'translate-y-full'}`}>
        <button 
          disabled={!prevChapter}
          onClick={() => prevChapter && onChapterChange(prevChapter)}
          className={`flex items-center gap-2 p-2 rounded-xl transition-all ${!prevChapter ? 'opacity-20' : 'hover:bg-black/5'}`}
        >
          <ChevronLeft className="size-5" />
          <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Chương trước</span>
        </button>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowChapterList(true)}
            className="p-3 rounded-full hover:bg-black/5 transition-all"
          >
            <List className="size-5" />
          </button>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="p-3 rounded-full hover:bg-black/5 transition-all"
          >
            <Settings className="size-5" />
          </button>
          <button 
            onClick={() => setShowReportModal(true)}
            className="p-3 rounded-full hover:bg-black/5 text-red-500/70 hover:text-red-500 transition-all"
            title="Báo lỗi chương"
          >
            <AlertTriangle className="size-5" />
          </button>
        </div>

        <button 
          disabled={!nextChapter}
          onClick={() => nextChapter && onChapterChange(nextChapter)}
          className={`flex items-center gap-2 p-2 rounded-xl transition-all ${!nextChapter ? 'opacity-20' : 'hover:bg-black/5'}`}
        >
          <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Chương sau</span>
          <ChevronRight className="size-5" />
        </button>
      </footer>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowReportModal(false)}></div>
          <div className="relative w-full max-w-md bg-surface rounded-[32px] shadow-2xl border border-accent/10 p-8 animate-in zoom-in-95 duration-300 text-text-main">
            <h3 className="font-black uppercase tracking-widest text-sm mb-6 flex items-center gap-2">
              <AlertTriangle className="size-5 text-red-500" />
              Báo lỗi chương
            </h3>
            <p className="text-sm text-muted mb-6">Bạn đang báo lỗi cho <strong>Chương {chapter.chapterNumber}</strong> của bộ truyện <strong>{novel.title}</strong>.</p>
            
            <div className="space-y-4 mb-8">
              <label className="text-[10px] uppercase tracking-[0.2em] font-black text-muted block">Loại lỗi</label>
              <select className="w-full h-12 px-4 bg-background-light rounded-xl border-none outline-none font-bold text-sm text-text-main">
                <option>Lỗi nội dung (sai chữ, thiếu đoạn)</option>
                <option>Lỗi ảnh/định dạng</option>
                <option>Chương trùng lặp</option>
                <option>Lỗi khác</option>
              </select>
              <textarea 
                placeholder="Mô tả chi tiết lỗi (không bắt buộc)..."
                className="w-full h-32 p-4 bg-background-light rounded-xl border-none outline-none font-medium text-sm text-text-main resize-none"
              ></textarea>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setShowReportModal(false)}
                className="flex-1 py-3 rounded-full border-2 border-accent/10 font-black text-[10px] uppercase tracking-widest text-muted hover:bg-background-light transition-all"
              >
                Hủy
              </button>
              <button 
                onClick={() => {
                  alert('Cảm ơn bạn đã báo lỗi! Chúng mình sẽ kiểm tra sớm nhất có thể.');
                  setShowReportModal(false);
                }}
                className="flex-1 py-3 bg-red-500 text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-500/20 hover:opacity-90 transition-all"
              >
                Gửi báo cáo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content Area */}
      <main className="max-w-3xl mx-auto px-8 pt-32 pb-48">
        <div className="mb-24 text-center">
          <div className="inline-block px-4 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6">
            Chương {chapter.chapterNumber}
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-black leading-tight mb-6 tracking-tighter">
            {chapter.title}
          </h1>
          <div className="w-20 h-1 bg-primary/20 mx-auto rounded-full"></div>
        </div>

        <div 
          className="leading-[1.8] space-y-10 text-justify"
          style={{ fontSize: `${fontSize}px` }}
        >
          {chapter.content.split('\n\n').map((para, i) => (
            <p key={i} className="first-letter:pl-8">{para}</p>
          ))}
        </div>

        {/* Navigation Footer */}
        <div className="mt-32 pt-16 border-t border-accent/10 flex flex-col md:flex-row items-center justify-between gap-10">
          <button 
            disabled={!prevChapter}
            onClick={() => prevChapter && onChapterChange(prevChapter)}
            className={`flex items-center gap-4 px-10 py-4 rounded-full border-2 transition-all group ${!prevChapter ? 'opacity-30 cursor-not-allowed' : 'border-accent/10 hover:border-primary hover:text-primary'}`}
          >
            <ChevronLeft className="size-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-black uppercase tracking-widest text-xs">Chương trước</span>
          </button>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowChapterList(true)}
              className="p-4 rounded-full bg-background-light hover:bg-primary hover:text-white transition-all"
            >
              <List className="size-6" />
            </button>
          </div>

          <button 
            disabled={!nextChapter}
            onClick={() => nextChapter && onChapterChange(nextChapter)}
            className={`flex items-center gap-4 px-12 py-5 rounded-full bg-primary text-white font-black tracking-widest uppercase text-xs shadow-2xl shadow-primary/30 hover:opacity-90 transition-all group ${!nextChapter ? 'opacity-30 cursor-not-allowed' : 'transform hover:-translate-y-1'}`}
          >
            <span>Chương sau</span>
            <ChevronRight className="size-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </main>
    </div>
  );
}
