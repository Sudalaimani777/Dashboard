import React from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { EditorialPreview } from './components/EditorialPreview';
import { Footer } from './components/Footer';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F7F4EE]">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <EditorialPreview />
      </main>
      <Footer />
    </div>
  );
};
