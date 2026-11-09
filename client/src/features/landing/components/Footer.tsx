import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-[#E8DFD3] mt-20 py-8 bg-[#F7F4EE]">
      <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#756F68] gap-4">
        <div>© 2026 TripFlow. All rights reserved.</div>
        <div className="flex items-center gap-6">
          <span className="hover:text-[#2B231D] cursor-pointer">Privacy</span>
          <span className="hover:text-[#2B231D] cursor-pointer">Terms</span>
          <span className="hover:text-[#2B231D] cursor-pointer">Support</span>
        </div>
      </div>
    </footer>
  );
};
