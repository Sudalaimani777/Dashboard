import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/hooks/useAuth';
import type { BookItem } from './types/dashboard.types';
import {
  DashboardTopbar,
  LogPagesModal,
  MarginaliaQuoteCard,
  NowReadingCard,
  OnDeckBookshelf,
  ReaderCadenceStats,
} from './components';

export const DashboardPage: React.FC = () => {
  const { user, signout } = useAuth();
  const navigate = useNavigate();

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<'library' | 'goal' | 'notes'>('library');

  // Active reading state
  const [currentPage, setCurrentPage] = useState(184);
  const totalPages = 487;
  const [totalAnnualPages, setTotalAnnualPages] = useState(4320);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  // Curated bookshelf collection
  const bookshelf: BookItem[] = [
    {
      id: '1',
      title: 'Piranesi',
      author: 'Susanna Clarke',
      tag: 'Up next',
      isFinished: false,
      coverGradient: 'from-[#2F3E46] via-[#354F52] to-[#1A2629]',
    },
    {
      id: '2',
      title: 'A Gentleman in Moscow',
      author: 'Amor Towles',
      tag: 'Finished ★★★★★',
      isFinished: true,
      coverGradient: 'from-[#5C241C] via-[#3D140E] to-[#240B07]',
    },
    {
      id: '3',
      title: 'Klara and the Sun',
      author: 'Kazuo Ishiguro',
      tag: 'Finished ★★★★★',
      isFinished: true,
      coverGradient: 'from-[#BD4B32] via-[#8C331E] to-[#591C0E]',
    },
  ];

  const handleSignout = async () => {
    await signout();
    navigate('/signin');
  };

  const handleSaveLoggedPages = (pages: number) => {
    setCurrentPage((prev) => Math.min(prev + pages, totalPages));
    setTotalAnnualPages((prev) => prev + pages);
  };

  return (
    <div className="min-h-screen bg-[#F7F4EE] flex flex-col text-[#2B231D] antialiased">
      {/* Topbar */}
      <DashboardTopbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userName={user?.name}
        userEmail={user?.email}
        onSignout={handleSignout}
      />

      {/* Main Dashboard Layout */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-7 sm:py-9 w-full flex-1 space-y-5">
        {/* Active Read Card */}
        <NowReadingCard
          title="The Shadow of the Wind"
          author="Carlos Ruiz Zafón"
          currentPage={currentPage}
          totalPages={totalPages}
          estimatedFinishDays={4}
          dailyPace={32}
          onOpenLogModal={() => setIsLogModalOpen(true)}
        />

        {/* Reader Cadence Stats (Clean Editorial Ribbon) */}
        <ReaderCadenceStats
          annualGoalRead={14}
          annualGoalTotal={24}
          streakDays={19}
          totalAnnualPages={totalAnnualPages}
        />

        {/* Bottom Section: Asymmetric 60/40 Split (Bookshelf + Marginalia) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7">
            <OnDeckBookshelf books={bookshelf} />
          </div>
          <div className="lg:col-span-5 flex flex-col">
            <MarginaliaQuoteCard
              quote="A reader lives a thousand lives before he dies... The man who never reads lives only one."
              author="George R.R. Martin"
            />
          </div>
        </section>
      </main>

      {/* Log Pages Modal */}
      <LogPagesModal
        isOpen={isLogModalOpen}
        currentPage={currentPage}
        totalPages={totalPages}
        onClose={() => setIsLogModalOpen(false)}
        onSave={handleSaveLoggedPages}
      />
    </div>
  );
};
