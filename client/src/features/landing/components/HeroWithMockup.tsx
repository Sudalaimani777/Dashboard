import * as React from "react";
import { cn } from "../../../shared/utils/cn";
import { Button } from "../../../shared/components/ui/button";
import { Mockup } from "./Mockup";
import { Glow } from "./Glow";

export interface HeroWithMockupProps {
  badge?: React.ReactNode;
  title: string;
  description: string;
  primaryCta?: {
    text: string;
    href: string;
    icon?: React.ReactNode;
  };
  secondaryCta?: {
    text: string;
    href: string;
    icon?: React.ReactNode;
  };
  mockupImage?: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
  };
  mockupContent?: React.ReactNode;
  className?: string;
}

export function HeroWithMockup({
  badge,
  title,
  description,
  primaryCta = {
    text: "Access Travel Portal",
    href: "/signin",
  },
  secondaryCta = {
    text: "Explore 2-Tier Workflows",
    href: "#workflows",
  },
  mockupImage,
  mockupContent,
  className,
}: HeroWithMockupProps) {
  return (
    <section
      className={cn(
        "relative bg-[#F7F4EE] text-[#2B231D]",
        "fade-bottom overflow-hidden pb-12 pt-16 sm:pb-20 sm:pt-24 md:pb-28 md:pt-32",
        className
      )}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 text-center sm:gap-14 sm:px-6">
        {/* Header Section */}
        <div className="flex flex-col items-center gap-4 sm:gap-6">
          {badge && (
            <div className="animate-appear">
              {badge}
            </div>
          )}

          <h1
            className={cn(
              "font-serif tracking-tight text-[#2B231D]",
              "text-3xl font-bold leading-[1.15] sm:text-5xl md:text-6xl",
              "animate-appear max-w-4xl"
            )}
          >
            {title}
          </h1>

          <p
            className={cn(
              "max-w-2xl text-base text-[#756F68] sm:text-lg md:text-xl",
              "animate-appear opacity-0 [animation-delay:150ms] leading-relaxed"
            )}
          >
            {description}
          </p>

          {/* Action Buttons */}
          <div
            className={cn(
              "flex flex-col sm:flex-row items-center gap-3.5 pt-2",
              "animate-appear opacity-0 [animation-delay:300ms] w-full sm:w-auto"
            )}
          >
            <Button
              asChild
              size="lg"
              className={cn(
                "bg-[#8A582B] hover:bg-[#754820] text-white shadow-md rounded-xl font-semibold",
                "transition-all duration-200 cursor-pointer"
              )}
            >
              <a href={primaryCta.href} className="flex items-center gap-2">
                {primaryCta.text}
                {primaryCta.icon}
              </a>
            </Button>

            <Button
              asChild
              size="lg"
              variant="outline"
              className={cn(
                "border-[#E8DFD3] bg-white text-[#2B231D] hover:bg-[#FAF8F5] shadow-sm rounded-xl font-semibold",
                "transition-all duration-200 cursor-pointer"
              )}
            >
              <a href={secondaryCta.href} className="flex items-center gap-2">
                {secondaryCta.icon}
                {secondaryCta.text}
              </a>
            </Button>
          </div>
        </div>

        {/* Mockup Container */}
        <div className="relative pt-6 sm:pt-10">
          <Mockup
            type="responsive"
            className="animate-appear opacity-0 [animation-delay:500ms] shadow-2xl border-[#E8DFD3] rounded-2xl overflow-hidden bg-white"
          >
            {mockupContent ? (
              mockupContent
            ) : mockupImage ? (
              <img
                src={mockupImage.src}
                alt={mockupImage.alt}
                width={mockupImage.width}
                height={mockupImage.height}
                className="w-full h-auto object-cover"
              />
            ) : null}
          </Mockup>

          {/* Background Ambient Glow */}
          <Glow
            variant="center"
            className="opacity-70 [animation-delay:700ms]"
          />
        </div>
      </div>
    </section>
  );
}

export default HeroWithMockup;
