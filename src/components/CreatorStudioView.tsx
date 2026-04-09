import React, { useState, useEffect } from 'react';
import { LayoutDashboard, BookPlus, FileText, Settings, Plus, ChevronRight, Edit3, Trash2, Eye, MessageSquare, Save, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { User } from 'firebase/auth';
import { Novel, Chapter } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { GENRES } from '../constants';

interface CreatorStudioViewProps {
  user: User | null;
  onLogin: () => void;
}

export default function CreatorStudioView({ user, onLogin }: CreatorStudioViewProps) {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingNovel, setEditingNovel] = useState<Novel | null>(null);
  const [selectedNovelForChapters, setSelectedNovelForChapters] = useState<Novel | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isAddingChapter, setIsAddingChapter] = useState(false);

  // Form states for Novel
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [status, setStatus] = useState<'Đang ra' | 'Hoàn thành'>('Đang ra');
  const [translationGroup, setTranslationGroup] = useState('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverUrl(reader.result as string);
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  // Form states for Chapter
  const [chapterTitle, setChapterTitle] = useState('');
  const [chapterContent, setChapterContent] = useState('');
  const [chapterNumber, setChapterNumber] = useState(1);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'novels'), where('authorId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedNovels = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Novel[];
      setNovels(fetchedNovels);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'novels');
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!selectedNovelForChapters) {
      setChapters([]);
      return;
    }

    const path = `novels/${selectedNovelForChapters.id}/chapters`;
    const q = query(collection(db, path), orderBy('chapterNumber', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedChapters = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Chapter[];
      setChapters(fetchedChapters);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [selectedNovelForChapters]);

  const handleCreateNovel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const novelData = {
      title,
      author: user.displayName || 'Tác giả',
      authorId: user.uid,
      description,
      coverUrl: coverUrl || `https://picsum.photos/seed/${Date.now()}/400/600`,
      bannerUrl: '',
      genres: selectedGenres,
      status,
      views: '0',
      rating: 5.0,
      translationGroup: translationGroup || 'Cá nhân',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      chapters: [] // For Firestore, we store chapters in a subcollection
    };

    try {
      if (editingNovel) {
        await updateDoc(doc(db, 'novels', editingNovel.id), {
          ...novelData,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'novels'), novelData);
      }
      resetNovelForm();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'novels');
    }
  };

  const handleAddChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNovelForChapters) return;

    const path = `novels/${selectedNovelForChapters.id}/chapters`;
    const chapterData = {
      novelId: selectedNovelForChapters.id,
      title: chapterTitle,
      content: chapterContent,
      chapterNumber: Number(chapterNumber),
      publishDate: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, path), chapterData);
      // Update novel's lastUpdated
      await updateDoc(doc(db, 'novels', selectedNovelForChapters.id), {
        updatedAt: serverTimestamp(),
        lastUpdated: 'Vừa xong'
      });
      resetChapterForm();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const resetNovelForm = () => {
    setTitle('');
    setDescription('');
    setCoverUrl('');
    setSelectedGenres([]);
    setStatus('Đang ra');
    setTranslationGroup('');
    setIsCreating(false);
    setEditingNovel(null);
  };

  const resetChapterForm = () => {
    setChapterTitle('');
    setChapterContent('');
    setChapterNumber(chapters.length + 1);
    setIsAddingChapter(false);
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  if (!user) {
    return (
      <main className="w-full max-w-[1200px] px-8 pb-32 mx-auto pt-12 text-center">
        <div className="py-32 bg-surface rounded-[40px] border border-dashed border-accent/20">
          <BookPlus className="size-16 text-muted mx-auto mb-6" />
          <h2 className="text-2xl font-black text-text-main mb-4 uppercase tracking-tighter">Chào mừng đến với Creator Studio</h2>
          <p className="text-muted mb-8 max-w-md mx-auto">Đăng nhập để bắt đầu sáng tác và chia sẻ những câu chuyện tuyệt vời của bạn với cộng đồng MonkeyD.</p>
          <button onClick={onLogin} className="px-10 py-4 bg-primary text-white rounded-full font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20">Đăng nhập ngay</button>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full max-w-[1200px] px-8 pb-32 mx-auto pt-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <LayoutDashboard className="size-6" />
            </div>
            <span className="text-xs font-black text-primary uppercase tracking-widest">Creator Studio</span>
          </div>
          <h1 className="font-display text-5xl font-black text-text-main tracking-tighter uppercase mb-4">Quản lý sáng tác</h1>
          <p className="text-muted font-medium">Nơi chắp cánh cho những ý tưởng của bạn</p>
        </div>

        <button 
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-full font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:opacity-90 transition-all"
        >
          <Plus className="size-5" />
          <span>Đăng truyện mới</span>
        </button>
      </div>

      {loading ? (
        <div className="py-32 flex items-center justify-center">
          <Loader2 className="size-12 text-primary animate-spin" />
        </div>
      ) : novels.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {novels.map(novel => (
            <div key={novel.id} className="bg-surface rounded-[32px] p-6 border border-accent/10 shadow-xl flex flex-col md:flex-row gap-8 group hover:border-primary/20 transition-all">
              <div className="w-32 h-48 rounded-2xl overflow-hidden shadow-lg shrink-0">
                <img src={novel.coverUrl} alt={novel.title} className="w-full h-full object-cover" />
              </div>
              
              <div className="flex-1 flex flex-col justify-between py-2">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${novel.status === 'Hoàn thành' ? 'bg-green-500 text-white' : 'bg-primary text-white'}`}>
                      {novel.status}
                    </span>
                    <span className="text-[10px] text-muted font-bold uppercase tracking-widest">{novel.genres.join(', ')}</span>
                  </div>
                  <h3 className="text-2xl font-black text-text-main mb-2 group-hover:text-primary transition-colors">{novel.title}</h3>
                  <p className="text-sm text-muted line-clamp-2 mb-4">{novel.description}</p>
                </div>

                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-2 text-muted">
                    <Eye className="size-4" />
                    <span className="text-xs font-bold">{novel.views} lượt xem</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted">
                    <MessageSquare className="size-4" />
                    <span className="text-xs font-bold">24 bình luận</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted">
                    <FileText className="size-4" />
                    <span className="text-xs font-bold">12 chương</span>
                  </div>
                </div>
              </div>

              <div className="flex md:flex-col justify-center gap-3 shrink-0">
                <button 
                  onClick={() => setSelectedNovelForChapters(novel)}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-background-light rounded-xl text-[10px] font-black uppercase tracking-widest text-text-main hover:bg-primary hover:text-white transition-all"
                >
                  <FileText className="size-4" />
                  <span>Quản lý chương</span>
                </button>
                <button 
                  onClick={() => {
                    setEditingNovel(novel);
                    setTitle(novel.title);
                    setDescription(novel.description);
                    setCoverUrl(novel.coverUrl);
                    setSelectedGenres(novel.genres);
                    setStatus(novel.status);
                    setTranslationGroup(novel.translationGroup || '');
                    setIsCreating(true);
                  }}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-background-light rounded-xl text-[10px] font-black uppercase tracking-widest text-text-main hover:bg-accent hover:text-white transition-all"
                >
                  <Edit3 className="size-4" />
                  <span>Sửa thông tin</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-32 bg-surface rounded-[40px] border border-dashed border-accent/20 text-center">
          <BookPlus className="size-12 text-muted mx-auto mb-6 opacity-20" />
          <h3 className="text-xl font-bold text-text-main mb-2">Bạn chưa đăng truyện nào</h3>
          <p className="text-muted mb-8">Hãy bắt đầu hành trình sáng tác của bạn ngay hôm nay!</p>
          <button onClick={() => setIsCreating(true)} className="px-8 py-3 bg-primary text-white rounded-full font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20">Đăng truyện đầu tiên</button>
        </div>
      )}

      {/* Create/Edit Novel Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={resetNovelForm}></div>
          <div className="relative w-full max-w-2xl bg-surface rounded-[40px] shadow-2xl border border-accent/10 p-10 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
            <button onClick={resetNovelForm} className="absolute top-8 right-8 p-2 hover:bg-background-light rounded-full text-muted transition-colors">
              <X className="size-6" />
            </button>

            <h2 className="text-3xl font-black text-text-main uppercase tracking-tighter mb-8">{editingNovel ? 'Sửa thông tin truyện' : 'Đăng truyện mới'}</h2>
            
            <form onSubmit={handleCreateNovel} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-black text-muted mb-3 block">Tên truyện</label>
                    <input 
                      type="text" required value={title} onChange={e => setTitle(e.target.value)}
                      className="w-full h-14 px-6 bg-background-light rounded-2xl border-none outline-none font-bold text-text-main focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-black text-muted mb-3 block">Ảnh bìa (400x600)</label>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <input 
                          type="url" placeholder="Dán link ảnh hoặc tải lên..." value={coverUrl} onChange={e => setCoverUrl(e.target.value)}
                          className="w-full h-14 px-6 bg-background-light rounded-2xl border-none outline-none font-bold text-text-main focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                      </div>
                      <label className="h-14 px-6 bg-accent/10 text-accent rounded-2xl flex items-center justify-center cursor-pointer hover:bg-accent hover:text-white transition-all font-black text-[10px] uppercase tracking-widest shrink-0">
                        {isUploading ? <Loader2 className="size-4 animate-spin" /> : <ImageIcon className="size-4 mr-2" />}
                        {isUploading ? 'Đang tải...' : 'Tải ảnh'}
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-black text-muted mb-3 block">Nhóm dịch / Tác giả</label>
                    <input 
                      type="text" value={translationGroup} onChange={e => setTranslationGroup(e.target.value)}
                      className="w-full h-14 px-6 bg-background-light rounded-2xl border-none outline-none font-bold text-text-main focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-black text-muted mb-3 block">Trạng thái</label>
                    <select 
                      value={status} onChange={e => setStatus(e.target.value as any)}
                      className="w-full h-14 px-6 bg-background-light rounded-2xl border-none outline-none font-bold text-text-main focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                    >
                      <option value="Đang ra">Đang ra</option>
                      <option value="Hoàn thành">Hoàn thành</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-black text-muted mb-3 block">Thể loại</label>
                    <div className="flex flex-wrap gap-2">
                      {GENRES.map(genre => (
                        <button 
                          key={genre} type="button"
                          onClick={() => toggleGenre(genre)}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedGenres.includes(genre) ? 'bg-primary text-white' : 'bg-background-light text-muted hover:text-text-main'}`}
                        >
                          {genre}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest font-black text-muted mb-3 block">Tóm tắt / Giới thiệu truyện</label>
                <textarea 
                  required value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Viết vài dòng giới thiệu hấp dẫn về bộ truyện của bạn..."
                  className="w-full h-40 px-6 py-4 bg-background-light rounded-2xl border-none outline-none font-bold text-text-main focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                />
              </div>

              <button type="submit" className="w-full h-16 bg-primary text-white rounded-full font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:opacity-90 transition-all">
                {editingNovel ? 'Cập nhật truyện' : 'Đăng truyện ngay'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Manage Chapters Modal */}
      {selectedNovelForChapters && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedNovelForChapters(null)}></div>
          <div className="relative w-full max-w-4xl bg-surface rounded-[40px] shadow-2xl border border-accent/10 p-10 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setSelectedNovelForChapters(null)} className="absolute top-8 right-8 p-2 hover:bg-background-light rounded-full text-muted transition-colors">
              <X className="size-6" />
            </button>

            <div className="flex items-center gap-4 mb-8">
              <div className="size-16 rounded-xl overflow-hidden shadow-md">
                <img src={selectedNovelForChapters.coverUrl} alt="" className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-text-main uppercase tracking-tighter">Quản lý chương</h2>
                <p className="text-muted font-medium">{selectedNovelForChapters.title}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-1 border-r border-accent/5 pr-10">
                <h3 className="text-sm font-black text-text-main uppercase tracking-widest mb-6">Danh sách chương</h3>
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {chapters.map(chapter => (
                    <div key={chapter.id} className="p-4 bg-background-light rounded-xl flex items-center justify-between group hover:bg-primary/5 transition-all">
                      <div>
                        <span className="text-[10px] font-black text-primary block mb-1">Chương {chapter.chapterNumber}</span>
                        <span className="text-sm font-bold text-text-main line-clamp-1">{chapter.title}</span>
                      </div>
                      <button className="p-2 text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ))}
                  {chapters.length === 0 && (
                    <p className="text-center py-10 text-muted text-sm italic">Chưa có chương nào.</p>
                  )}
                </div>
              </div>

              <div className="lg:col-span-2">
                <h3 className="text-sm font-black text-text-main uppercase tracking-widest mb-6">Thêm chương mới</h3>
                <form onSubmit={handleAddChapter} className="space-y-6">
                  <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-1">
                      <label className="text-[10px] uppercase tracking-widest font-black text-muted mb-3 block">Số chương</label>
                      <input 
                        type="number" required value={chapterNumber} onChange={e => setChapterNumber(Number(e.target.value))}
                        className="w-full h-14 px-6 bg-background-light rounded-2xl border-none outline-none font-bold text-text-main focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] uppercase tracking-widest font-black text-muted mb-3 block">Tiêu đề chương</label>
                      <input 
                        type="text" required value={chapterTitle} onChange={e => setChapterTitle(e.target.value)}
                        className="w-full h-14 px-6 bg-background-light rounded-2xl border-none outline-none font-bold text-text-main focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-black text-muted mb-3 block">Nội dung chương</label>
                    <textarea 
                      required value={chapterContent} onChange={e => setChapterContent(e.target.value)}
                      className="w-full h-80 px-6 py-4 bg-background-light rounded-2xl border-none outline-none font-bold text-text-main focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                      placeholder="Nhập nội dung chương truyện tại đây..."
                    />
                  </div>
                  <button type="submit" className="w-full h-16 bg-primary text-white rounded-full font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:opacity-90 transition-all">
                    Đăng chương ngay
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
