import React from 'react';
import { Card } from '../../../shared/components/ui/card';

export const EditorialPreview: React.FC = () => {
  return (
    <section className="py-12 max-w-5xl mx-auto px-6">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        {/* Left: Active Book Card */}
        <div className="md:col-span-7">
          <Card className="bg-[#FFFFFF] border-[#E8DFD3] p-8 shadow-sm rounded-2xl">
            <div className="text-xs uppercase tracking-widest text-[#996735] font-semibold mb-2">
              Currently Reading
            </div>
            <h3 className="text-2xl font-bold text-[#2B231D]">
              The Shadow of the Wind
            </h3>
            <p className="text-sm text-[#756F68] mt-1">Carlos Ruiz Zafón</p>

            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-xs font-medium text-[#756F68]">
                <span>Progress: Page 184 of 487</span>
                <span>38%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#EFE8DE] overflow-hidden">
                <div className="h-full bg-[#D4A373] rounded-full w-[38%]" />
              </div>
            </div>

            <p className="mt-6 text-sm italic text-[#756F68] border-l-2 border-[#D4A373] pl-4">
              "Books are mirrors: you only see in them what you already have inside you."
            </p>
          </Card>
        </div>

        {/* Right: Editorial reader notes */}
        <div className="md:col-span-5 space-y-6">
          <div>
            <h4 className="text-base font-bold text-[#2B231D]">
              Distraction-free tracking
            </h4>
            <p className="text-sm text-[#756F68] mt-1.5 leading-relaxed">
              Log finished books, maintain a clean reading queue, and reflect on what you read without clutter.
            </p>
          </div>

          <div className="pt-2">
            <h4 className="text-base font-bold text-[#2B231D]">
              Always synchronized
            </h4>
            <p className="text-sm text-[#756F68] mt-1.5 leading-relaxed">
              Sign in once and access your books and reading progress from any device.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
