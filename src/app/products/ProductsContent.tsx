'use client';

import { useState, useMemo, Suspense, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Search, SlidersHorizontal, X, ChevronDown, ChevronUp,
  LayoutGrid, Gift, Heart, Gem, Users, MoonStar, Home, Briefcase,
  Baby, GraduationCap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ProductCard } from '@/components/products/product-card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Product } from '@/types';

/* ─── Category chips ─────────────────────────────────────────── */
type Category = { value: string; label: string; Icon: LucideIcon };

const ALL_CATS: Category[] = [
  { value: '',              label: 'All',          Icon: LayoutGrid    },
  { value: 'birthday',     label: 'Birthday',     Icon: Gift          },
  { value: 'anniversary',  label: 'Anniversary',  Icon: Heart         },
  { value: 'wedding',      label: 'Wedding',      Icon: Gem           },
  { value: 'family',       label: 'Family',       Icon: Users         },
  { value: 'islamic',      label: 'Islamic',      Icon: MoonStar      },
  { value: 'housewarming', label: 'Housewarming', Icon: Home          },
  { value: 'corporate',    label: 'Corporate',    Icon: Briefcase     },
  { value: 'newborn',      label: 'Newborn',      Icon: Baby          },
  { value: 'graduation',   label: 'Graduation',   Icon: GraduationCap },
];

/* ─── Price ranges ───────────────────────────────────────────── */
const PRICE_RANGES = [
  { label: 'Under ₹599',    min: 0,    max: 599      },
  { label: '₹600 – ₹999',  min: 600,  max: 999      },
  { label: '₹1000 – ₹1499',min: 1000, max: 1499     },
  { label: '₹1500+',        min: 1500, max: Infinity },
];

/* ─── Availability options ───────────────────────────────────── */
const AVAIL_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'new',      label: 'New arrivals' },
];

/* ═══════════════════════════════════════════════════════════════ */

function ProductsFilter({ products }: { products: Product[] }) {
  const searchParams    = useSearchParams();
  const initialOccasion = searchParams.get('occasion') || '';

  const containerRef  = useRef<HTMLDivElement>(null);
  const ghostRef      = useRef<HTMLDivElement>(null);
  const dropdownRef   = useRef<HTMLDivElement>(null);

  const [search,       setSearch]       = useState('');
  const [category,    setCategory]     = useState(initialOccasion);
  const [priceRange,   setPriceRange]   = useState<{ min: number; max: number } | null>(null);
  const [avail,        setAvail]        = useState<string | null>(null);
  const [filtersOpen,  setFiltersOpen]  = useState(false);
  const [cutoff,       setCutoff]       = useState(ALL_CATS.length);
  const [showDropdown, setShowDropdown] = useState(false);

  /* ── Filtering logic ───────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = products;

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q)
      );
    }

    if (category) {
      list = list.filter(p => Array.isArray(p.occasion) && p.occasion.includes(category));
    }

    if (priceRange) {
      list = list.filter(p => p.basePrice >= priceRange.min && p.basePrice <= priceRange.max);
    }

    if (avail === 'featured') {
      list = list.filter(p => p.featured);
    } else if (avail === 'new') {
      list = list.filter(p => p.badge === 'New');
    }

    return list;
  }, [products, search, category, priceRange, avail]);

  const advancedActive = priceRange || avail;
  const hasAnyFilter   = search || category || advancedActive;

  /* ── Overflow chip detection ───────────────────────────────── */
  const measure = useCallback(() => {
    const container = containerRef.current;
    const ghost     = ghostRef.current;
    if (!container || !ghost) return;

    const containerW = container.offsetWidth;
    const children   = Array.from(ghost.children) as HTMLElement[];
    if (children.length < 2) return;

    const moreW      = children[children.length - 1].offsetWidth;
    const chipWidths = children.slice(0, -1).map(el => el.offsetWidth);
    const GAP        = 8;

    let usedW     = 0;
    let newCutoff = chipWidths.length;

    for (let i = 0; i < chipWidths.length; i++) {
      const gapBefore   = i === 0 ? 0 : GAP;
      const allFromHere = chipWidths.slice(i).reduce((s, w) => s + w, 0)
                        + (chipWidths.length - i - 1) * GAP;

      if (usedW + gapBefore + allFromHere <= containerW) {
        newCutoff = chipWidths.length;
        break;
      }

      if (usedW + gapBefore + chipWidths[i] + GAP + moreW <= containerW) {
        usedW += gapBefore + chipWidths[i];
        newCutoff = i + 1;
      } else {
        newCutoff = i;
        break;
      }
    }

    setCutoff(newCutoff);
  }, []);

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [measure]);

  useEffect(() => {
    if (!showDropdown) return;
    function onDown(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [showDropdown]);

  const clearAll = () => {
    setSearch('');
    setCategory('');
    setPriceRange(null);
    setAvail(null);
    setShowDropdown(false);
  };

  /* ── Chip helper ───────────────────────────────────────────── */
  const Chip = ({
    value, label, Icon, active, onClick,
  }: { value: string; label: string; Icon: LucideIcon; active: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={cn(
        'flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all whitespace-nowrap',
        active
          ? 'bg-[#C4634F] text-white border-[#C4634F] shadow-sm'
          : 'bg-white text-[#7A6A64] border-[#E8DDD6] hover:border-[#C4634F] hover:text-[#C4634F]',
      )}
    >
      <Icon size={15} strokeWidth={1.75} />
      {label}
    </button>
  );

  return (
    <>
      {/* ── Row 1: Search + Filters button ─────────────────────── */}
      <div className="flex gap-3 mb-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A6A64] pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search frames..."
            className="w-full h-11 pl-9 pr-9 rounded-xl border border-[#E8DDD6] bg-white text-sm text-[#2D1F1A] placeholder:text-[#7A6A64] focus:outline-none focus:ring-2 focus:ring-[#C4634F] focus:border-transparent transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A6A64] hover:text-[#2D1F1A]"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className={cn(
            'flex items-center gap-2 px-4 h-11 rounded-xl border text-sm font-medium transition-all flex-shrink-0',
            filtersOpen || advancedActive
              ? 'bg-[#C4634F] text-white border-[#C4634F]'
              : 'bg-white text-[#7A6A64] border-[#E8DDD6] hover:border-[#C4634F] hover:text-[#C4634F]',
          )}
        >
          <SlidersHorizontal size={15} />
          <span className="hidden sm:inline">Filters</span>
          {advancedActive && (
            <span className="w-2 h-2 rounded-full bg-white/80" />
          )}
        </button>

        {hasAnyFilter && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 px-3 h-11 rounded-xl border border-[#E8DDD6] bg-white text-sm text-[#7A6A64] hover:text-[#C4634F] hover:border-[#C4634F] transition-all flex-shrink-0"
          >
            <X size={14} />
            <span className="hidden sm:inline">Clear</span>
          </button>
        )}
      </div>

      {/* ── Row 2: Category chips (single row, overflow → More dropdown) ── */}
      <div className="mb-5">
        {/* Ghost layer: invisible, zero-height — used only to measure natural chip widths */}
        <div className="relative h-0 overflow-hidden" aria-hidden>
          <div
            ref={ghostRef}
            className="absolute flex gap-2 invisible pointer-events-none"
            style={{ whiteSpace: 'nowrap' }}
          >
            {ALL_CATS.map(cat => (
              <span
                key={cat.value}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border border-[#E8DDD6] whitespace-nowrap"
              >
                <cat.Icon size={15} strokeWidth={1.75} />
                {cat.label}
              </span>
            ))}
            {/* More button ghost for width reservation */}
            <span className="inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium border border-[#E8DDD6] whitespace-nowrap">
              More <ChevronDown size={13} />
            </span>
          </div>
        </div>

        {/* Visible chips row */}
        <div ref={containerRef} className="flex items-center gap-2">
          {ALL_CATS.slice(0, cutoff).map(cat => (
            <Chip
              key={cat.value}
              value={cat.value}
              label={cat.label}
              Icon={cat.Icon}
              active={category === cat.value}
              onClick={() => setCategory(cat.value === category && cat.value !== '' ? '' : cat.value)}
            />
          ))}

          {/* More dropdown — only rendered when chips overflow */}
          {cutoff < ALL_CATS.length && (
            <div ref={dropdownRef} className="relative flex-shrink-0">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className={cn(
                  'flex-shrink-0 flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium border transition-all whitespace-nowrap',
                  showDropdown || ALL_CATS.slice(cutoff).some(c => c.value === category)
                    ? 'bg-[#F5EDE5] text-[#C4634F] border-[#C4634F]'
                    : 'bg-white text-[#7A6A64] border-[#E8DDD6] hover:border-[#C4634F] hover:text-[#C4634F]',
                )}
              >
                More {showDropdown ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>

              {showDropdown && (
                <div className="absolute top-full left-0 mt-1.5 bg-white rounded-xl border border-[#E8DDD6] shadow-lg py-1.5 min-w-[160px] z-20">
                  {ALL_CATS.slice(cutoff).map(cat => (
                    <button
                      key={cat.value}
                      onClick={() => {
                        setCategory(cat.value === category ? '' : cat.value);
                        setShowDropdown(false);
                      }}
                      className={cn(
                        'w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left transition-colors',
                        category === cat.value
                          ? 'text-[#C4634F] bg-[#F5EDE5] font-medium'
                          : 'text-[#2D1F1A] hover:bg-[#F5EDE5] hover:text-[#C4634F]',
                      )}
                    >
                      <cat.Icon size={15} strokeWidth={1.75} />
                      {cat.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Advanced filters panel ──────────────────────────────── */}
      {filtersOpen && (
        <div className="mb-6 p-5 bg-white rounded-2xl border border-[#E8DDD6] shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Price */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#7A6A64] mb-3">
                Price Range
              </h3>
              <div className="flex flex-wrap gap-2">
                {PRICE_RANGES.map(range => {
                  const active =
                    priceRange?.min === range.min && priceRange?.max === range.max;
                  return (
                    <button
                      key={range.label}
                      onClick={() => setPriceRange(active ? null : range)}
                      className={cn(
                        'px-3 py-1.5 text-xs font-medium rounded-full border transition-all',
                        active
                          ? 'bg-[#C4634F] text-white border-[#C4634F]'
                          : 'border-[#E8DDD6] text-[#7A6A64] hover:border-[#C4634F] hover:text-[#C4634F]',
                      )}
                    >
                      {range.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Availability */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#7A6A64] mb-3">
                Availability
              </h3>
              <div className="flex flex-wrap gap-2">
                {AVAIL_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setAvail(avail === opt.value ? null : opt.value)}
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium rounded-full border transition-all',
                      avail === opt.value
                        ? 'bg-[#C4634F] text-white border-[#C4634F]'
                        : 'border-[#E8DDD6] text-[#7A6A64] hover:border-[#C4634F] hover:text-[#C4634F]',
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Results count ───────────────────────────────────────── */}
      <p className="text-sm text-[#7A6A64] mb-5">
        {filtered.length} frame{filtered.length !== 1 ? 's' : ''} found
        {category && (
          <span className="ml-1 text-[#C4634F] font-medium">
            · {ALL_CATS.find(c => c.value === category)?.label}
          </span>
        )}
      </p>

      {/* ── Grid or empty state ─────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🖼️</div>
          {hasAnyFilter ? (
            <>
              <h3 className="text-lg font-semibold text-[#2D1F1A] mb-2">No frames match your filters</h3>
              <p className="text-[#7A6A64] mb-4">Try a different category or clear your filters</p>
              <Button variant="outline" onClick={clearAll}>Clear all filters</Button>
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-[#2D1F1A] mb-2">No frames available yet</h3>
              <p className="text-[#7A6A64]">Check back soon — new frames are coming!</p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
          {filtered.map((product, idx) => (
            <ProductCard key={product.id} product={product} priority={idx === 0} />
          ))}
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════ */

export default function ProductsContent({ products }: { products: Product[] }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-7">
        <h1 className="text-3xl font-bold text-[#2D1F1A] mb-1">All Photo Frames</h1>
        <p className="text-[#7A6A64]">Premium personalised frames — handcrafted with love</p>
      </div>
      <Suspense fallback={null}>
        <ProductsFilter products={products} />
      </Suspense>
    </div>
  );
}
