'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FRAME_COUNT       = 11;
const SCROLL_MULTIPLIER = 1.5;   // 150vh section → 50vh scroll travel

function frameSrc(n: number) {
  return `/images/frames/frame_${String(n).padStart(3, '0')}.png`;
}

/* ─── small helpers ─────────────────────────────────────────── */

function drawFrame(canvas: HTMLCanvasElement | null, img: HTMLImageElement) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const s  = Math.min(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
  const dw = img.naturalWidth  * s;
  const dh = img.naturalHeight * s;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, (canvas.width - dw) / 2, (canvas.height - dh) / 2, dw, dh);
}

function useCanvasResize(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  containerRef: React.RefObject<HTMLDivElement | null>,
) {
  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    const cont   = containerRef.current;
    if (!canvas || !cont) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w   = cont.clientWidth;
    const h   = cont.clientHeight;
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width        = w * dpr;
      canvas.height       = h * dpr;
      canvas.style.width  = w + 'px';
      canvas.style.height = h + 'px';
    }
  }, [canvasRef, containerRef]);

  useEffect(() => {
    resize();
    const ro = new ResizeObserver(resize);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [resize, containerRef]);
}

/* ─── shared text / trust content ───────────────────────────── */

function HeroBadge() {
  return (
    <span className="inline-flex w-fit items-center gap-1.5 rounded-full
                     border border-[#E8DDD6] bg-white/80 px-3 py-1
                     text-[11px] font-semibold text-[#C4634F] shadow-sm backdrop-blur-sm">
      ✨ Free delivery on orders above ₹999
    </span>
  );
}

function HeroHeading() {
  return (
    <h1 className="text-4xl font-bold leading-[1.15] tracking-tight text-[#2D1F1A] lg:text-5xl xl:text-[3.5rem]">
      Gifts that come<br />
      <span className="gradient-text">straight from&nbsp;the&nbsp;heart</span>
    </h1>
  );
}

function HeroDescription() {
  return (
    <p className="text-[13px] leading-relaxed text-[#7A6A64] sm:text-sm lg:text-base lg:max-w-md">
      Premium personalised photo frames — choose your size, pick your finish,
      and we&apos;ll deliver a gift they&apos;ll treasure forever.
    </p>
  );
}

function HeroButtons({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex gap-2">
      <Button size={compact ? 'sm' : 'lg'} className={`flex-1 justify-center text-center${compact ? ' h-12 text-sm' : ''}`} asChild>
        <Link href="/products">
          Shop All Frames
          {!compact && <ArrowRight size={15} className="ml-1" />}
        </Link>
      </Button>
      <Button variant="outline" size={compact ? 'sm' : 'lg'} className={`flex-1 justify-center text-center${compact ? ' h-12 text-sm' : ''}`} asChild>
        <Link href="/products">Browse Collection</Link>
      </Button>
    </div>
  );
}

function TrustStrip() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-shrink-0 -space-x-2">
        {[1, 2, 3, 4].map(n => (
          <div key={n}
            className="relative h-7 w-7 rounded-full border-2 border-white overflow-hidden flex-shrink-0">
            <Image
              src={`/images/profiles/profile${n}.jpg`}
              alt={`Happy customer ${n}`}
              fill
              sizes="28px"
              className="object-cover"
            />
          </div>
        ))}
      </div>
      <div>
        <div className="flex items-center gap-0.5">
          {[1,2,3,4,5].map(i => (
            <Star key={i} size={10} className="fill-[#C9A84C] text-[#C9A84C]" />
          ))}
          <span className="ml-1 text-[11px] font-semibold text-[#2D1F1A]">4.9</span>
        </div>
        <p className="text-[11px] text-[#7A6A64]">
          <strong className="text-[#2D1F1A]">100+</strong> happy customers
        </p>
      </div>
    </div>
  );
}

function LoadingIndicator({ pct }: { pct: number }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3">
      <div className="h-24 w-36 animate-pulse rounded-xl bg-[#E8DDD6]/50" />
      <div className="h-1 w-32 overflow-hidden rounded-full bg-[#E8DDD6]">
        <div
          className="h-full rounded-full bg-[#C4634F] transition-all duration-150"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[10px] font-medium tracking-wide text-[#7A6A64]/60">
        Loading {pct}%
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */

export function HeroAnimation() {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const contRef      = useRef<HTMLDivElement>(null);
  const sectionRef   = useRef<HTMLDivElement>(null);

  /* animation state */
  const imagesRef    = useRef<(HTMLImageElement | null)[]>([]);
  const displayFrame = useRef(0);
  const targetFrame  = useRef(0);
  const rafId        = useRef(0);

  const [loadedCount,     setLoadedCount]     = useState(0);
  const [firstFrameReady, setFirstFrameReady] = useState(false);

  /* ── 1. Preload ─────────────────────────────────────────────── */
  useEffect(() => {
    const images: (HTMLImageElement | null)[] = new Array(FRAME_COUNT).fill(null);
    imagesRef.current = images;
    let mounted = true;
    let n = 0;

    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new window.Image();
      const idx = i;
      img.onload = () => {
        if (!mounted) return;
        n++;
        setLoadedCount(n);
        if (idx === 0) setFirstFrameReady(true);
      };
      img.onerror = () => { if (!mounted) return; n++; setLoadedCount(n); };
      img.src = frameSrc(i + 1);
      images[i] = img;
    }
    return () => {
      mounted = false;
      images.forEach(img => { if (img) { img.onload = null; img.onerror = null; } });
    };
  }, []);

  /* ── 2. Resize canvas ──────────────────────────────────────── */
  useCanvasResize(canvasRef, contRef);

  /* ── 3. RAF loop ───────────────────────────────────────────── */
  useEffect(() => {
    if (!firstFrameReady) return;

    let lastDrawn = -1;
    let lastW     = 0;
    let lastH     = 0;

    function tick() {
      const canvas = canvasRef.current;

      // Canvas was resized (e.g. F11 fullscreen, window resize) → force redraw
      if (canvas && (canvas.width !== lastW || canvas.height !== lastH)) {
        lastW     = canvas.width;
        lastH     = canvas.height;
        lastDrawn = -1;
      }

      const diff = targetFrame.current - displayFrame.current;
      displayFrame.current += Math.abs(diff) > 0.02 ? diff * 0.18 : diff;
      const idx = Math.max(0, Math.min(FRAME_COUNT - 1, Math.round(displayFrame.current)));

      if (idx !== lastDrawn) {
        const img = imagesRef.current[idx];
        if (img?.complete && img.naturalWidth > 0 && canvas && canvas.width > 0) {
          drawFrame(canvas, img);
          lastDrawn = idx;
        }
      }
      rafId.current = requestAnimationFrame(tick);
    }

    rafId.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId.current);
  }, [firstFrameReady]);

  /* ── 4. Desktop: scroll → targetFrame ──────────────────────── */
  useEffect(() => {
    function onScroll() {
      const section = sectionRef.current;
      if (!section) return;
      const { top, height } = section.getBoundingClientRect();
      const range = height - window.innerHeight;
      if (range <= 0) return;
      targetFrame.current = Math.max(0, Math.min(1, -top / range)) * (FRAME_COUNT - 1);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const allLoaded = loadedCount === FRAME_COUNT;
  const pct       = Math.round((loadedCount / FRAME_COUNT) * 100);

  /* ═══════════════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════════════ */

  return (
    <>
      {/* ── Mobile hero — content only, no canvas (lg+: hidden) ── */}
      <section className="relative block lg:hidden overflow-hidden bg-gradient-to-br from-[#FDF8F4] via-[#F5EDE5] to-[#EDE0D6] px-5 pt-10 pb-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64">
          <div className="absolute right-0 top-0 h-52 w-52 -translate-y-1/4 translate-x-1/4 rounded-full bg-[#C9A84C]/10 blur-3xl" />
          <div className="absolute left-0 top-20 h-40 w-40 rounded-full bg-[#C4634F]/8 blur-3xl" />
        </div>
        <div className="relative space-y-4">
          <HeroBadge />
          <HeroHeading />
          <HeroDescription />
          <HeroButtons compact />
          <TrustStrip />
        </div>
      </section>

      {/* 150vh scroll runway — desktop only (hidden on mobile) */}
      <div
        ref={sectionRef}
        className="hidden lg:block relative"
        style={{ height: `${SCROLL_MULTIPLIER * 100}vh` }}
      >
        <div className="sticky top-0 h-[100dvh] overflow-hidden bg-gradient-to-br from-[#FDF8F4] via-[#F5EDE5] to-[#EDE0D6]">

          {/* Glows */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-[#C9A84C]/10 blur-3xl" />
            <div className="absolute -bottom-20 left-10  h-72 w-72 rounded-full bg-[#C4634F]/8  blur-3xl" />
          </div>

          <div className="relative flex h-full w-full max-w-7xl mx-auto
                          px-8 xl:px-12 items-center pb-[10vh]">

            {/* Text — left */}
            <div className="w-[42%] flex-none pr-12 space-y-5">
              <HeroBadge />
              <HeroHeading />
              <HeroDescription />
              <HeroButtons />
              <TrustStrip />
            </div>

            {/* Canvas — right */}
            <div className="w-[58%] flex-none h-full flex items-center">
              <div ref={contRef} className="relative h-full w-full">
                {!allLoaded && <LoadingIndicator pct={pct} />}
                <canvas
                  ref={canvasRef}
                  aria-label="Framio product animation"
                  style={{
                    display:    'block',
                    opacity:    firstFrameReady ? 1 : 0,
                    transition: 'opacity 0.5s ease',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Scroll cue */}
          <div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2
                          flex flex-col items-center gap-1 select-none">
            <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#7A6A64]/40">
              Scroll
            </span>
            <div className="h-7 w-px bg-gradient-to-b from-[#7A6A64]/30 to-transparent" />
          </div>
        </div>
      </div>
    </>
  );
}
