import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Package, Truck, Heart, Palette, Image as ImageIcon, Printer, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/products/product-card';
import { Product } from '@/types';
import { HeroAnimation } from '@/components/hero/HeroAnimation';
import type { LucideIcon } from 'lucide-react';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return [];

    const db = createClient(url, key);
    const { data } = await db
      .from('products')
      .select('id, name, description, base_price, type, photo_slots, images, badge, rating, review_count, occasion, featured')
      .eq('status', 'published')
      .eq('is_active', true)
      .eq('featured', true)
      .order('created_at', { ascending: false })
      .limit(3);

    return (data ?? []).map(row => ({
      id: row.id,
      name: row.name,
      description: row.description ?? '',
      basePrice: Number(row.base_price ?? 0),
      type: row.type ?? 'single',
      sizes: [],
      materials: [],
      images: row.images ?? [],
      badge: row.badge || undefined,
      rating: Number(row.rating ?? 0),
      reviewCount: Number(row.review_count ?? 0),
      occasion: row.occasion ?? [],
      photoSlots: Number(row.photo_slots ?? 1),
      featured: row.featured ?? false,
    }));
  } catch {
    return [];
  }
}

const OCCASIONS = [
  { label: 'Anniversary',  description: 'Romantic personalized frames',  href: '/products?occasion=anniversary',  image: '/images/occasion/anniversary1.png' },
  { label: 'Birthday',     description: 'Memorable birthday gifts',       href: '/products?occasion=birthday',     image: '/images/occasion/birthday1.png' },
  { label: 'Family',       description: 'Family collage frames',          href: '/products?occasion=family',       image: '/images/occasion/family.png' },
  { label: 'Wedding',      description: 'Wedding & Nikah frames',         href: '/products?occasion=wedding',      image: '/images/occasion/wedding.png' },
  { label: 'Housewarming', description: 'Elegant home décor frames',      href: '/products?occasion=housewarming', image: '/images/occasion/warming.png' },
  { label: 'Corporate',    description: 'Premium corporate gifting',       href: '/products?occasion=corporate',    image: '/images/occasion/corp.png' },
];

const HOW_IT_WORKS: { step: string; Icon: LucideIcon; title: string; desc: string }[] = [
  { step: '1', Icon: Package, title: 'Pick a Frame',       desc: 'Browse our collection and choose the perfect frame style and size.' },
  { step: '2', Icon: Palette, title: 'Choose Your Style',  desc: 'Select your preferred size and finish — every frame is made to order.' },
  { step: '3', Icon: Truck,   title: 'We Deliver',         desc: 'Your custom frame is printed, packed, and delivered in 3–5 days.' },
];

const WHY_FRAMIO = [
  { icon: <ImageIcon size={20} />, title: 'Premium Wooden Frames',    desc: 'Solid wood frames in multiple finishes, built to last a lifetime.' },
  { icon: <Printer   size={20} />, title: 'HD Archival Printing',     desc: 'Museum-grade ink on archival paper — colours that never fade.' },
  { icon: <Heart     size={20} />, title: 'Personalized with Care',   desc: 'Every frame is made to order, crafted just for you and your moment.' },
  { icon: <Package   size={20} />, title: 'Secure Packaging',         desc: 'Triple-layer protective packaging so it always arrives damage-free.' },
  { icon: <Truck     size={20} />, title: 'Fast 3–5 Day Delivery',    desc: 'Printed, framed, and at your door in 3–5 working days across India.' },
  { icon: <MapPin    size={20} />, title: 'Made in India',            desc: 'Proudly crafted by skilled Indian artisans who care about every detail.' },
];

export default async function HomePage() {
  const featured = await getFeaturedProducts();

  return (
    <div>

      {/* 1 — Hero */}
      <HeroAnimation />

      {/* 2 — Shop by Occasion */}
      <section className="py-12 md:py-14 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-7 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-[#2D1F1A]">Shop by Occasion</h2>
          <p className="text-[#7A6A64] mt-1 text-sm md:text-base">Find the perfect gift for every milestone</p>
        </div>

        {/*
          Mobile  → 6-column grid each 72vw → horizontal snap scroll
          Desktop → 3-column grid
        */}
        <div
          className="grid grid-cols-[repeat(6,72vw)] md:grid-cols-3 gap-3 md:gap-4
                     overflow-x-auto md:overflow-x-visible
                     snap-x snap-mandatory md:snap-none
                     pb-2 md:pb-0
                     -mx-4 px-4 md:mx-0 md:px-0
                     [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: 'none' }}
        >
          {OCCASIONS.map(occ => (
            <Link
              key={occ.label}
              href={occ.href}
              className="group snap-start flex items-center gap-0
                         bg-white rounded-2xl border border-[#E8DDD5]
                         shadow-[0_1px_3px_rgba(44,31,26,0.06),0_2px_10px_rgba(44,31,26,0.04)]
                         hover:shadow-[0_6px_28px_rgba(44,31,26,0.11),0_1px_4px_rgba(44,31,26,0.05)]
                         hover:-translate-y-0.5 transition-all duration-300
                         overflow-hidden"
            >
              <div className="flex-shrink-0 relative overflow-hidden
                              w-[96px] md:w-[108px] self-stretch
                              bg-[#FAF5F0] border-r border-[#EFE6DC]">
                <Image
                  src={occ.image}
                  alt={occ.label}
                  fill
                  sizes="108px"
                  className="object-cover group-hover:scale-[1.06] transition-transform duration-300"
                />
              </div>
              <div className="flex flex-col gap-1 px-4 py-4 min-w-0">
                <h3 className="text-[17px] md:text-[18px] font-bold text-[#2D1F1A] leading-tight">
                  {occ.label}
                </h3>
                <p className="text-[12px] md:text-[13px] text-[#7A6A64] leading-snug">
                  {occ.description}
                </p>
                <div className="flex items-center gap-1 text-[12px] font-semibold text-[#C86A52] mt-2">
                  Explore
                  <ArrowRight size={11} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3 — Best Sellers */}
      <section className="py-8 md:py-10 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-7 md:mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#2D1F1A]">Best Sellers</h2>
            <p className="text-[#7A6A64] mt-1 text-sm md:text-base">Our most loved frames, chosen by thousands</p>
          </div>
          <Button variant="subtle" asChild>
            <Link href="/products">View all <ArrowRight size={16} /></Link>
          </Button>
        </div>
        {featured.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {featured.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-[#7A6A64]">
            <p>New frames coming soon — check back shortly!</p>
          </div>
        )}
      </section>

      {/* 4 — How Framio Works */}
      <section className="py-12 md:py-16 bg-[#2D1F1A] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">How Framio Works</h2>
            <p className="text-white/60 text-sm md:text-base">
              Ordering your custom frame takes less than 5 minutes
            </p>
          </div>

          {/* ── Mobile: vertical timeline ── */}
          <div className="md:hidden">
            <div className="relative">
              {/* Connecting line — runs through the left icon centers */}
              <div className="absolute left-6 top-6 bottom-2 w-px bg-gradient-to-b from-white/30 via-white/15 to-transparent" />

              <div className="space-y-6">
                {HOW_IT_WORKS.map(step => (
                  <div key={step.step} className="flex gap-4 items-start">
                    {/* Icon */}
                    <div className="flex-shrink-0 relative z-10">
                      <div className="w-12 h-12 bg-[#C4634F] rounded-xl flex items-center justify-center text-white shadow-[0_4px_14px_rgba(196,99,79,0.40)]">
                        <step.Icon size={18} />
                      </div>
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#C9A84C] rounded-full text-[10px] font-bold flex items-center justify-center text-white shadow-sm">
                        {step.step}
                      </span>
                    </div>
                    {/* Text */}
                    <div className="pt-1.5 min-w-0">
                      <h3 className="font-bold text-[15px] mb-1 leading-tight">{step.title}</h3>
                      <p className="text-white/60 text-[13px] leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Button — tight below the last step */}
            <div className="mt-8 text-center">
              <Button size="lg" variant="gold" asChild>
                <Link href="/customize">Start Customizing <ArrowRight size={18} /></Link>
              </Button>
            </div>
          </div>

          {/* ── Desktop: horizontal with arrow separators ── */}
          <div className="hidden md:block">
            <div className="flex items-start">
              {HOW_IT_WORKS.flatMap((step, idx) => {
                const card = (
                  <div key={step.step} className="flex-1 text-center px-4 sm:px-8">
                    <div className="relative inline-flex items-center justify-center w-16 h-16 mb-4 bg-[#C4634F] rounded-2xl text-white">
                      <step.Icon size={24} />
                      <span className="absolute -top-2 -right-2 w-6 h-6 bg-[#C9A84C] rounded-full text-xs font-bold flex items-center justify-center text-white">
                        {step.step}
                      </span>
                    </div>
                    <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                    <p className="text-white/60 text-sm">{step.desc}</p>
                  </div>
                );
                if (idx < HOW_IT_WORKS.length - 1) {
                  return [
                    card,
                    <div key={`sep-${idx}`} className="flex items-start justify-center pt-8 flex-shrink-0 w-10 opacity-50">
                      <ArrowRight size={20} className="text-[#C4634F]" />
                    </div>,
                  ];
                }
                return [card];
              })}
            </div>
            <div className="mt-12 text-center">
              <Button size="lg" variant="gold" asChild>
                <Link href="/customize">Start Customizing <ArrowRight size={18} /></Link>
              </Button>
            </div>
          </div>

        </div>
      </section>

      {/* 5 — Why Choose Framio */}
      <section className="bg-[#FDF8F4] py-12 md:py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 md:mb-10">
            <p className="text-[10px] font-bold text-[#C4634F] uppercase tracking-[0.2em] mb-2">
              Our promise to you
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-[#2D1F1A]">Why Choose Framio</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
            {WHY_FRAMIO.map(item => (
              <div
                key={item.title}
                className="group bg-white rounded-2xl border border-[#E8DDD6] p-4 sm:p-5 md:p-6
                           flex flex-col gap-2.5 md:gap-3 shadow-sm
                           hover:shadow-md hover:border-[#C4634F]/30 hover:-translate-y-1
                           transition-all duration-200"
              >
                <div className="p-2 md:p-2.5 w-fit bg-[#F5EDE5] rounded-xl text-[#C4634F] group-hover:bg-[#C4634F] group-hover:text-white transition-all duration-200">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-bold text-[#2D1F1A] text-[13px] sm:text-sm md:text-base mb-1 leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-[11px] sm:text-xs md:text-sm text-[#7A6A64] leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6 — Customer Reviews */}
      <section className="py-12 md:py-16 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8 md:mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-[#2D1F1A] mb-3">
            What our customers say
          </h2>
          <div className="flex items-center justify-center gap-2">
            <div className="flex">
              {[1,2,3,4,5].map(i => (
                <span key={i} className="text-[#C9A84C] text-lg">★</span>
              ))}
            </div>
            <span className="font-bold text-[#2D1F1A]">4.8</span>
            <span className="text-[#7A6A64] text-sm">from 1,200+ reviews</span>
          </div>
        </div>

        {/*
          Mobile → horizontal scroll snap (same pattern as Occasions)
          Desktop → 3-column grid
        */}
        <div
          className="grid grid-cols-[repeat(3,85vw)] md:grid-cols-3 gap-4
                     overflow-x-auto md:overflow-x-visible
                     snap-x snap-mandatory md:snap-none
                     pb-2 md:pb-0
                     -mx-4 px-4 md:mx-0 md:px-0
                     [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: 'none' }}
        >
          {[
            { name: 'Priya S.',   city: 'Mumbai',    text: 'Absolutely beautiful! The walnut finish looks exactly like the preview. My mother cried when she saw it. Will definitely order again!',         rating: 5 },
            { name: 'Rahul M.',   city: 'Delhi',     text: 'Ordered for our anniversary — the gold frame with our photo and names looks stunning. Delivered in just 4 days. Super impressed!',              rating: 5 },
            { name: 'Ananya K.', city: 'Bangalore', text: 'The customizer is so easy to use! Uploaded our family photo, added names, and it arrived perfectly printed. Best gifting site!',               rating: 5 },
          ].map(review => (
            <div key={review.name} className="snap-start bg-white p-5 md:p-6 rounded-2xl border border-[#E8DDD6] shadow-sm flex flex-col">
              <div className="flex mb-3">
                {Array.from({ length: review.rating }).map((_, i) => (
                  <span key={i} className="text-[#C9A84C]">★</span>
                ))}
              </div>
              <p className="text-[#2D1F1A] text-sm mb-4 leading-relaxed flex-1">&ldquo;{review.text}&rdquo;</p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#C4634F] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {review.name[0]}
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#2D1F1A]">{review.name}</div>
                  <div className="text-xs text-[#7A6A64]">{review.city}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
