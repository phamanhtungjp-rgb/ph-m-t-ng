/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import TopNavBar from './components/TopNavBar';
import DiscoverView from './components/DiscoverView';
import BookshelfView from './components/BookshelfView';
import NovelDetailView from './components/NovelDetailView';
import ReaderView from './components/ReaderView';
import FilterView from './components/FilterView';
import LeaderboardView from './components/LeaderboardView';
import CreatorStudioView from './components/CreatorStudioView';
import { Novel, Chapter } from './types';
import { auth, loginWithGoogle, logout } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

type ViewState = 'discover' | 'bookshelf' | 'novel-detail' | 'reader' | 'filter' | 'leaderboard' | 'creator-studio';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('discover');
  const [selectedNovel, setSelectedNovel] = useState<Novel | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<string>('Tất cả');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const handleNovelSelect = (novel: Novel) => {
    setSelectedNovel(novel);
    setCurrentView('novel-detail');
    window.scrollTo(0, 0);
  };

  const handleGenreSelect = (genre: string) => {
    setSelectedGenre(genre);
    setSearchTerm('');
    setCurrentView('filter');
    window.scrollTo(0, 0);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setSelectedGenre('Tất cả');
    setCurrentView('filter');
    window.scrollTo(0, 0);
  };

  const handleChapterSelect = (chapter: Chapter) => {
    setSelectedChapter(chapter);
    setCurrentView('reader');
    window.scrollTo(0, 0);
  };

  const handleTabChange = (tab: 'discover' | 'bookshelf' | 'leaderboard' | 'creator-studio') => {
    setCurrentView(tab);
    setSearchTerm('');
    window.scrollTo(0, 0);
  };

  const renderView = () => {
    if (!isAuthReady) return (
      <div className="min-h-screen flex items-center justify-center bg-background-light">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={currentView + (selectedNovel?.id || '') + (selectedChapter?.id || '')}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {(() => {
            switch (currentView) {
              case 'discover':
                return <DiscoverView onNovelSelect={handleNovelSelect} />;
              case 'bookshelf':
                return <BookshelfView onNovelSelect={handleNovelSelect} user={user} onLogin={loginWithGoogle} />;
              case 'filter':
                return <FilterView initialGenre={selectedGenre} initialSearch={searchTerm} onNovelSelect={handleNovelSelect} />;
              case 'leaderboard':
                return <LeaderboardView />;
              case 'creator-studio':
                return <CreatorStudioView user={user} onLogin={loginWithGoogle} />;
              case 'novel-detail':
                return selectedNovel ? (
                  <NovelDetailView 
                    novel={selectedNovel} 
                    onChapterSelect={handleChapterSelect} 
                    onNovelSelect={handleNovelSelect}
                    user={user}
                    onLogin={loginWithGoogle}
                  />
                ) : null;
              case 'reader':
                return selectedNovel && selectedChapter ? (
                  <ReaderView 
                    novel={selectedNovel} 
                    chapter={selectedChapter} 
                    onBack={() => setCurrentView('novel-detail')} 
                    onChapterChange={(chapter) => {
                      setSelectedChapter(chapter);
                      window.scrollTo(0, 0);
                    }}
                  />
                ) : null;
              default:
                return <DiscoverView onNovelSelect={handleNovelSelect} />;
            }
          })()}
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div className="min-h-screen bg-background-light selection:bg-primary/20 selection:text-primary">
      {currentView !== 'reader' && (
        <TopNavBar 
          activeTab={currentView === 'bookshelf' ? 'bookshelf' : currentView === 'leaderboard' ? 'leaderboard' : currentView === 'creator-studio' ? 'creator-studio' : 'discover'} 
          onTabChange={handleTabChange} 
          onGenreSelect={handleGenreSelect}
          onSearch={handleSearch}
          user={user}
          onLogin={loginWithGoogle}
          onLogout={logout}
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
        />
      )}
      {renderView()}
    </div>
  );
}
