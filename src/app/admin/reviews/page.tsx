import { createClient } from '@supabase/supabase-js';
import { getAdminOrRedirect } from '@/lib/admin-auth';
import { Star, MessageSquare } from 'lucide-react';
import ReviewCard from './ReviewCard';

export const runtime = 'nodejs';

export default async function AdminReviewsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  await getAdminOrRedirect();
  const sp = await searchParams;
  const filter = sp.filter || 'pending';

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let query = supabase
    .from('reviews')
    .select('*, products(name, images), profiles(full_name)')
    .order('created_at', { ascending: false });

  if (filter === 'pending') query = query.eq('is_approved', false);
  else if (filter === 'approved') query = query.eq('is_approved', true);
  else if (filter === 'featured') query = query.eq('is_featured', true);

  const { data: reviews } = await query;

  const tabs = [
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'featured', label: 'Featured' },
    { key: 'all', label: 'All' },
  ];

  return (
    <div className="p-4 md:p-6">
      <div className="mb-5 md:mb-6">
        <h1 className="text-2xl font-bold text-[#2D1F1A]">Reviews</h1>
        <p className="text-[#7A6A64] text-sm">{reviews?.length || 0} reviews</p>
      </div>

      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
        {tabs.map(t => (
          <a key={t.key} href={`/admin/reviews?filter=${t.key}`}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === t.key ? 'bg-[#C4634F] text-white' : 'bg-white border border-[#E8DDD6] text-[#7A6A64] hover:border-[#C4634F]'}`}>
            {t.label}
          </a>
        ))}
      </div>

      <div className="space-y-4">
        {(reviews || []).map(review => (
          <ReviewCard key={review.id} review={review} />
        ))}
        {!reviews?.length && (
          <div className="py-16 text-center text-[#7A6A64] bg-white rounded-2xl border border-[#E8DDD6]">
            <MessageSquare size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No reviews in this filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
