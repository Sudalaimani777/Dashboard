import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../shared/components/ui/button';

export const HeroSection: React.FC = () => {
  return (
    <section className="pt-20 pb-16 text-center max-w-3xl mx-auto px-6">
      <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#2B231D] leading-tight">
        A quiet home for your reading life.
      </h1>
      <p className="mt-5 text-base sm:text-lg text-[#756F68] leading-relaxed max-w-2xl mx-auto">
        Track what you read, collect your favorite passages, and keep your personal library in one
        calm, distraction-free space.
      </p>
      <div className="mt-8 flex justify-center">
        <Link to="/signin">
          <Button variant="primary" size="lg" className="px-8 shadow-sm">
            Open Your Library
          </Button>
        </Link>
      </div>
    </section>
  );
};
