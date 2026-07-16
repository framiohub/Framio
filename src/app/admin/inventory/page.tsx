import { createClient } from '@supabase/supabase-js';
import { getAdminOrRedirect } from '@/lib/admin-auth';
import { AlertTriangle, Package } from 'lucide-react';
import InventoryRow from './InventoryRow';

export const runtime = 'nodejs';

export default async function AdminInventoryPage() {
  await getAdminOrRedirect();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: inventory } = await supabase
    .from('inventory')
    .select('*, products(name, images)')
    .order('stock_quantity', { ascending: true });

  const lowStock = inventory?.filter(i => i.stock_quantity <= i.low_stock_threshold) || [];

  return (
    <div className="p-4 md:p-6">
      <div className="mb-5 md:mb-6">
        <h1 className="text-2xl font-bold text-[#2D1F1A]">Inventory</h1>
        <p className="text-[#7A6A64] text-sm">{inventory?.length || 0} products tracked</p>
      </div>

      {lowStock.length > 0 && (
        <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800 text-sm">Low Stock Alert</p>
            <p className="text-amber-700 text-sm">{lowStock.length} product{lowStock.length > 1 ? 's' : ''} below threshold: {lowStock.map(i => i.products?.name).join(', ')}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#E8DDD6] overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[#F5EDE5]">
              {['Product', 'SKU', 'Stock', 'Threshold', 'Status', 'Update Stock'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#7A6A64] uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F5EDE5]">
            {(inventory || []).map(item => (
              <InventoryRow key={item.id} item={item} />
            ))}
          </tbody>
        </table>
        </div>
        {!inventory?.length && (
          <div className="py-16 text-center text-[#7A6A64]">
            <Package size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No inventory records. Run the RBAC schema SQL first.</p>
          </div>
        )}
      </div>
    </div>
  );
}
