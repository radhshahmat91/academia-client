"use client";

import { ImageIcon } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn, hash, initials } from "@/lib/utils";

/** Repeating water lily (shapla) tile. Inherits the text colour, so tint it with text-* classes. */
export function ShaplaPattern({ className, size = 96 }: { className?: string; size?: number }) {
  const id = useId();
  const petal = "M48 13c9 10 9 22 0 32-9-10-9-22 0-32z";
  return (
    <svg aria-hidden="true" className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}>
      <defs>
        <pattern id={id} width={size} height={size} patternUnits="userSpaceOnUse" viewBox="0 0 96 96">
          <g fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round">
            {[0, 60, 120, 180, 240, 300].map((a) => (
              <path key={a} d={petal} transform={`rotate(${a} 48 48)`} />
            ))}
            <circle cx="48" cy="48" r="3.2" />
            <circle cx="0" cy="0" r="2" />
            <circle cx="96" cy="0" r="2" />
            <circle cx="0" cy="96" r="2" />
            <circle cx="96" cy="96" r="2" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

const GRADIENTS = [
  "from-[#0b5d46] to-[#2a9d7a]",
  "from-[#17382d] to-[#0b5d46]",
  "from-[#b97c06] to-[#f2b01e]",
  "from-[#1f6f5a] to-[#8fd1b1]",
  "from-[#7d3326] to-[#e08b6e]",
  "from-[#0e3f66] to-[#4f9fcf]",
];

type PhotoProps = {
  src?: string | null;
  alt: string;
  className?: string;
  ratio?: string;
  priority?: boolean;
  zoom?: boolean;
  children?: ReactNode;
};

/** A fixed-ratio image that never leaves an empty box: if the picture fails, a branded gradient fills in. */
export function Photo({ src, alt, className, ratio = "aspect-[16/10]", priority, zoom, children }: PhotoProps) {
  const [failed, setFailed] = useState(false);
  const img = useRef<HTMLImageElement>(null);
  const grad = GRADIENTS[hash(alt) % GRADIENTS.length];
  // A picture can fail before React attaches onError (server-rendered pages), so check once after mount too
  useEffect(() => {
    const el = img.current;
    if (el && el.complete && el.naturalWidth === 0) setFailed(true);
  }, [src]);
  return (
    <div className={cn("relative overflow-hidden bg-base-300", ratio, className)}>
      {src && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={img}
          src={src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className={cn("absolute inset-0 h-full w-full object-cover", zoom && "transition-transform duration-700 ease-out group-hover:scale-[1.06]")}
        />
      ) : (
        <div role="img" aria-label={alt} className={cn("absolute inset-0 grid place-items-center bg-gradient-to-br", grad)}>
          <ShaplaPattern className="text-white/20" />
          {alt.trim().split(/\s+/).length <= 3 ? <span className="relative text-3xl font-bold tracking-tight text-white/85">{initials(alt)}</span> : <ImageIcon className="relative size-9 text-white/55" aria-hidden="true" />}
        </div>
      )}
      {children}
    </div>
  );
}
