import { ArrowRight, ChevronRight, Trophy, Flame, BookOpen, Clock, Star, Eye, Loader2 } from 'lucide-react';
import { NOVELS } from '../constants';
import { Novel } from '../types';
import { useState, useEffect } from 'react';
import Pagination from './Pagination';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

interface DiscoverViewProps {
  onNovelSelect: (novel: Novel) => void;
}

const UPDATES_PER_PAGE = 5;

export default function DiscoverView({ onNovelSelect }: DiscoverViewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [dynamicNovels, setDynamicNovels] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'novels'), orderBy('updatedAt', 'desc'), limit(20));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedNovels = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Novel[];
      setDynamicNovels(fetchedNovels);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'novels');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const allNovels = [...dynamicNovels, ...NOVELS.filter(n => !dynamicNovels.find(dn => dn.id === n.id))];

  const featuredNovel = allNovels[0];
  const hotNovels = allNovels.filter(n => n.isHot).slice(0, 10);
  const fullNovels = allNovels.filter(n => n.isFull || n.status === 'Hoàn thành').slice(0, 8);
  const latestUpdates = allNovels;

  const totalPages = Math.ceil(latestUpdates.length / UPDATES_PER_PAGE);
  const paginatedUpdates = latestUpdates.slice(
    (currentPage - 1) * UPDATES_PER_PAGE,
    currentPage * UPDATES_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to the latest updates section
    const element = document.getElementById('latest-updates');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getCoverUrl = (url: string | undefined, id: string) => {
    return url || `https://picsum.photos/seed/novel-${id}/400/600`;
  };

  return (
    <main className="w-full max-w-[1200px] px-8 pb-20 flex flex-col gap-16 mx-auto pt-8">
      {/* Hero Banner */}
      <section 
        onClick={() => onNovelSelect(featuredNovel)}
        className="relative w-full h-[420px] rounded-[40px] overflow-hidden shadow-2xl flex items-end group cursor-pointer"
      >
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 group-hover:scale-105" 
          style={{ backgroundImage: `url('${featuredNovel.bannerUrl || featuredNovel.coverUrl || getCoverUrl(featuredNovel.coverUrl, featuredNovel.id)}')` }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
        <div className="relative z-10 p-12 max-w-3xl">
          <div className="flex items-center gap-3 mb-6">
            <span className="px-4 py-1.5 bg-primary text-white rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/30 animate-pulse">Đề cử</span>
            <span className="text-sm text-white/90 font-bold backdrop-blur-md bg-white/10 px-3 py-1 rounded-lg">{featuredNovel.genres.join(' • ')}</span>
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-black text-white leading-none mb-6 tracking-tighter drop-shadow-2xl">{featuredNovel.title}</h1>
          <p className="text-white/80 text-lg mb-10 line-clamp-2 max-w-xl font-medium leading-relaxed">{featuredNovel.description}</p>
          <button className="bg-surface text-primary px-10 py-4 rounded-full font-black tracking-widest uppercase text-sm shadow-2xl hover:bg-primary hover:text-white transition-all transform hover:-translate-y-1 flex items-center gap-3">
            <span>Đọc ngay</span>
            <ArrowRight className="size-5" />
          </button>
        </div>
      </section>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Main Content Column */}
        <div className="flex-1 flex flex-col gap-16 overflow-hidden">
          
          {/* Hot Novels Section */}
          <section>
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary shadow-inner">
                  <Flame className="size-7 fill-primary" />
                </div>
                <div>
                  <h2 className="font-display text-3xl font-black text-text-main tracking-tighter uppercase">Truyện Hot</h2>
                  <p className="text-sm text-muted font-medium">Những bộ truyện đang làm mưa làm gió</p>
                </div>
              </div>
              <button className="group text-sm font-bold text-primary hover:text-primary/80 transition-all flex items-center gap-1 bg-primary/5 px-4 py-2 rounded-full">
                Xem tất cả <ChevronRight className="size-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
              {hotNovels.map((novel) => (
                <div 
                  key={novel.id}
                  onClick={() => onNovelSelect(novel)}
                  className="flex flex-col gap-4 group cursor-pointer"
                >
                  <div className="relative aspect-[3/4.5] rounded-[24px] overflow-hidden shadow-xl group-hover:shadow-primary/20 transition-all duration-500">
                    <img 
                      src={getCoverUrl(novel.coverUrl, novel.id)} 
                      alt={novel.title} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    />
                    <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-red-600 to-orange-500 text-white text-[10px] font-black rounded-xl uppercase shadow-xl shadow-red-500/40 animate-in fade-in zoom-in duration-500">
                        <Flame className="size-3 fill-white" />
                        <span>Hot</span>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-6">
                       <div className="flex items-center gap-4 text-white animate-in slide-in-from-bottom-4 duration-500">
                          <div className="flex items-center gap-1.5">
                            <Star className="size-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-black text-sm">{novel.rating}</span>
                          </div>
                          <div className="w-[1px] h-3 bg-white/20"></div>
                          <div className="flex items-center gap-1.5">
                            <Eye className="size-4 text-white/80" />
                            <span className="font-bold text-sm">{novel.views}</span>
                          </div>
                       </div>
                    </div>
                  </div>
                  <div className="flex flex-col px-1">
                    <h3 className="font-bold text-text-main line-clamp-2 group-hover:text-primary transition-colors leading-tight text-base mb-1">{novel.title}</h3>
                    <p className="text-xs text-muted font-medium truncate">{novel.author}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Latest Updates List */}
          <section id="latest-updates">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-accent/10 rounded-2xl text-accent shadow-inner">
                  <Clock className="size-7" />
                </div>
                <div>
                  <h2 className="font-display text-3xl font-black text-text-main tracking-tighter uppercase">Mới cập nhật</h2>
                  <p className="text-sm text-muted font-medium">Đừng bỏ lỡ chương mới nhất</p>
                </div>
              </div>
            </div>
            <div className="bg-surface rounded-[32px] border border-accent/10 overflow-hidden shadow-xl">
              <div className="grid grid-cols-1 divide-y divide-accent/5">
                {paginatedUpdates.map((novel) => (
                  <div 
                    key={novel.id}
                    onClick={() => onNovelSelect(novel)}
                    className="flex items-center gap-5 p-6 hover:bg-primary/5 transition-all cursor-pointer group"
                  >
                    <div className="w-16 h-22 rounded-xl overflow-hidden shrink-0 shadow-lg group-hover:scale-105 transition-transform">
                      <img 
                        src={getCoverUrl(novel.coverUrl, novel.id)} 
                        alt={novel.title} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-bold text-text-main text-lg truncate group-hover:text-primary transition-colors">{novel.title}</h4>
                        {novel.isHot && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-red-600 to-orange-500 text-white text-[9px] font-black rounded-lg uppercase shadow-lg shadow-red-500/20">
                            <Flame className="size-2.5 fill-white" />
                            Hot
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted font-medium truncate max-w-[150px]">{novel.author}</span>
                        <div className="flex items-center gap-2 text-primary font-bold bg-primary/5 px-3 py-1 rounded-full text-xs">
                          <BookOpen className="size-3" />
                          <span>Chương {novel.chapters[0]?.chapterNumber || 100}</span>
                        </div>
                      </div>
                    </div>
                    <div className="hidden md:flex flex-col items-end shrink-0 gap-1">
                      <span className="text-[10px] font-black text-accent uppercase tracking-widest bg-accent/5 px-2 py-1 rounded">{novel.translationGroup}</span>
                      <span className="text-[11px] text-muted font-medium">{novel.lastUpdated}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <Pagination 
              currentPage={currentPage} 
              totalPages={totalPages} 
              onPageChange={handlePageChange} 
            />
          </section>

          {/* Full Novels Section */}
          <section>
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/10 rounded-2xl text-green-600 shadow-inner">
                  <BookOpen className="size-7" />
                </div>
                <div>
                  <h2 className="font-display text-3xl font-black text-text-main tracking-tighter uppercase">Truyện Full</h2>
                  <p className="text-sm text-muted font-medium">Đọc một lèo không cần chờ đợi</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
              {fullNovels.map((novel) => (
                <div 
                  key={novel.id}
                  onClick={() => onNovelSelect(novel)}
                  className="flex flex-col gap-4 group cursor-pointer"
                >
                  <div className="relative aspect-[3/4.5] rounded-[24px] overflow-hidden shadow-xl group-hover:shadow-green-500/20 transition-all duration-500">
                    <img 
                      src={getCoverUrl(novel.coverUrl, novel.id)} 
                      alt={novel.title} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-3 py-1 bg-green-500 text-white text-[10px] font-black rounded-lg uppercase shadow-lg">Full</span>
                    </div>
                  </div>
                  <h3 className="font-bold text-text-main line-clamp-1 group-hover:text-primary transition-colors leading-tight text-base">{novel.title}</h3>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar Column */}
        <aside className="w-full lg:w-[340px] shrink-0">
          <div className="bg-surface rounded-[40px] p-10 shadow-2xl sticky top-24 border border-accent/10">
            <div className="flex items-center justify-between mb-10 pb-6 border-b border-background-light">
              <h2 className="font-display text-2xl font-black text-text-main uppercase tracking-tighter">Bảng Xếp Hạng</h2>
              <Trophy className="text-primary size-7" />
            </div>
            <ul className="flex flex-col gap-8">
              {NOVELS.slice(0, 7).map((novel, index) => (
                <li 
                  key={novel.id}
                  onClick={() => onNovelSelect(novel)}
                  className="flex items-center gap-5 group cursor-pointer"
                >
                  <span className={`font-display text-4xl font-black w-12 text-center italic transition-all group-hover:scale-110 ${index === 0 ? 'text-primary' : index === 1 ? 'text-accent' : index === 2 ? 'text-[#D8C3B5]' : 'text-muted/20'}`}>
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-text-main truncate group-hover:text-primary transition-colors text-sm mb-1">{novel.title}</h4>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted uppercase font-black tracking-widest bg-background-light px-2 py-0.5 rounded">{novel.genres[0]}</span>
                      <span className="text-[10px] text-muted/60 font-bold">{novel.views} đọc</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <button className="w-full mt-12 py-4 rounded-2xl bg-background-light text-sm font-black text-text-main hover:bg-primary hover:text-white transition-all duration-500 shadow-lg shadow-black/5 uppercase tracking-widest">
              Xem toàn bộ BXH
            </button>
          </div>
        </aside>
      </div>
    </main>
  );
}
