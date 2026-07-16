import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { ArrowRight, Package, Shield, Star, Truck, Heart, Gift, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/products/product-card';
import { Product } from '@/types';
import { HeroAnimation } from '@/components/hero/HeroAnimation';

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
  { label: 'Anniversary', emoji: '💑', href: '/products?occasion=anniversary' },
  { label: 'Birthday', emoji: '🎂', href: '/products?occasion=birthday' },
  { label: 'Family', emoji: '👨‍👩‍👧‍👦', href: '/products?occasion=family' },
  { label: 'Wedding', emoji: '💍', href: '/products?occasion=wedding' },
  { label: 'Housewarming', emoji: '🏠', href: '/products?occasion=housewarming' },
  { label: 'Corporate', emoji: '💼', href: '/products?occasion=corporate' },
];

const HOW_IT_WORKS = [
  { step: '1', icon: <Package size={24} />, title: 'Pick a Frame', desc: 'Browse our collection and choose the perfect frame style and size.' },
  { step: '2', icon: <Palette size={24} />, title: 'Choose Your Style', desc: 'Select your preferred size and finish — every frame is made to order.' },
  { step: '3', icon: <Truck size={24} />, title: 'We Deliver', desc: 'Your custom frame is printed, packed, and delivered in 3–5 days.' },
];

const TRUST_BADGES = [
  { icon: <Shield size={20} />, title: '100% Secure', desc: 'Razorpay encrypted payments' },
  { icon: <Star size={20} />, title: 'Premium Quality', desc: 'Printed on archival-grade paper' },
  { icon: <Truck size={20} />, title: 'Fast Delivery', desc: '3–5 days across India' },
  { icon: <Heart size={20} />, title: 'Made with Love', desc: 'Handcrafted in India 🇮🇳' },
];

export default async function HomePage() {
  const featured = await getFeaturedProducts();

  return (
    <div>
      {/* Scroll-driven hero animation */}
      <HeroAnimation />

      {/* Trust badges */}
      <section className="bg-white border-y border-[#E8DDD6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {TRUST_BADGES.map(badge => (
              <div key={badge.title} className="flex items-center gap-3">
                <div className="p-2 bg-[#F5EDE5] rounded-xl text-[#C4634F] flex-shrink-0">
                  {badge.icon}
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#2D1F1A]">{badge.title}</div>
                  <div className="text-xs text-[#7A6A64]">{badge.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Shop by Occasion */}
      <section className="py-14 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#2D1F1A]">Shop by Occasion</h2>
            <p className="text-[#7A6A64] mt-1">Find the perfect gift for every milestone</p>
          </div>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {OCCASIONS.map(occ => (
            <Link
              key={occ.label}
              href={occ.href}
              className="group flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-[#E8DDD6] hover:border-[#C4634F] hover:shadow-md transition-all duration-200"
            >
              <span className="text-3xl">{occ.emoji}</span>
              <span className="text-xs font-semibold text-[#2D1F1A] group-hover:text-[#C4634F] text-center">
                {occ.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-8 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#2D1F1A]">Best Sellers</h2>
            <p className="text-[#7A6A64] mt-1">Our most loved frames, chosen by thousands</p>
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

      {/* How it Works */}
      <section className="py-16 bg-[#2D1F1A] text-white mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">How Framio Works</h2>
            <p className="text-white/60">Ordering your custom frame takes less than 5 minutes</p>
          </div>
          <div className="flex flex-col md:flex-row md:items-start">
            {HOW_IT_WORKS.flatMap((step, idx) => {
              const card = (
                <div key={step.step} className="flex-1 text-center px-4 sm:px-8">
                  <div className="relative inline-flex items-center justify-center w-16 h-16 mb-4 bg-[#C4634F] rounded-2xl text-white">
                    {step.icon}
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
                  <div key={`sep-${idx}`} className="hidden md:flex items-start justify-center pt-8 flex-shrink-0 w-10 opacity-50">
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
      </section>

      {/* Social proof */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: 'Priya S.', city: 'Mumbai', text: 'Absolutely beautiful! The walnut finish looks exactly like the preview. My mother cried when she saw it. Will definitely order again!', rating: 5 },
            { name: 'Rahul M.', city: 'Delhi', text: 'Ordered for our anniversary — the gold frame with our photo and names looks stunning. Delivered in just 4 days. Super impressed!', rating: 5 },
            { name: 'Ananya K.', city: 'Bangalore', text: 'The customizer is so easy to use! Uploaded our family photo, added names, and it arrived perfectly printed. Best gifting site!', rating: 5 },
          ].map(review => (
            <div key={review.name} className="bg-white p-6 rounded-2xl border border-[#E8DDD6] shadow-sm">
              <div className="flex mb-3">
                {Array.from({ length: review.rating }).map((_, i) => (
                  <span key={i} className="text-[#C9A84C]">★</span>
                ))}
              </div>
              <p className="text-[#2D1F1A] text-sm mb-4 leading-relaxed">&ldquo;{review.text}&rdquo;</p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#C4634F] flex items-center justify-center text-white text-xs font-bold">
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

      {/* CTA Banner */}
      <section className="mx-4 sm:mx-6 mb-16 rounded-3xl bg-gradient-to-r from-[#C4634F] to-[#C9A84C] text-white p-10 text-center max-w-7xl xl:mx-auto">
        <Gift size={40} className="mx-auto mb-4 opacity-80" />
        <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to create something special?</h2>
        <p className="text-white/80 mb-6 max-w-md mx-auto">
          Upload a photo, customize in seconds, and make someone&apos;s day unforgettable.
        </p>
        <Button size="lg" className="bg-white text-[#C4634F] hover:bg-white/90 shadow-lg" asChild>
          <Link href="/products">Create Your Frame <ArrowRight size={18} /></Link>
        </Button>
      </section>
    </div>
  );
}
