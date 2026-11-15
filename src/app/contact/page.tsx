'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, MessageCircle, Clock, Send, Loader2, CheckCircle, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { PHONE_DISPLAY, whatsappLink } from '@/lib/contact';

const FAQS = [
  {
    q: 'How long does delivery take?',
    a: 'We deliver across India in 3–5 business days after your order is confirmed. Express delivery options are available at checkout.',
  },
  {
    q: 'Can I customise the frame size?',
    a: 'Yes! Every frame comes in multiple sizes — from compact desk frames to large wall pieces. You can choose your size on the product page.',
  },
  {
    q: 'What if my frame arrives damaged?',
    a: "We offer a no-questions-asked replacement guarantee. Just WhatsApp us a photo of the damage within 48 hours of delivery and we'll send a new one.",
  },
  {
    q: 'What image resolution do I need?',
    a: 'For best print quality, we recommend at least 1500×1500 pixels for small frames and 3000×3000 pixels for large prints. Our upload tool will warn you if the image is too low resolution.',
  },
  {
    q: 'Do you ship internationally?',
    a: "We currently ship within India only. International shipping is something we're actively working on — follow us on Instagram for updates.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#E8DDD6] last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-4 text-left gap-4"
      >
        <span className="font-semibold text-[#2D1F1A] text-sm sm:text-base">{q}</span>
        <ChevronDown
          size={18}
          className={`flex-shrink-0 text-[#7A6A64] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <p className="pb-4 text-[#7A6A64] text-sm leading-relaxed">{a}</p>
      )}
    </div>
  );
}

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const set = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Please enter your name'); return; }
    if (!form.email.trim()) { toast.error('Please enter your email'); return; }
    if (!form.message.trim()) { toast.error('Please enter your message'); return; }

    setLoading(true);
    // Simulate network delay — replace with real API call
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    setSent(true);
  };

  return (
    <main className="bg-[#FDF8F4]">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="bg-[#F5EDE5] border-b border-[#E8DDD6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <div className="max-w-2xl">
            <p className="text-[#C4634F] text-sm font-semibold tracking-widest uppercase mb-4">Contact Us</p>
            <h1 className="text-4xl sm:text-5xl font-bold text-[#2D1F1A] leading-tight mb-4">
              We'd love to hear from you.
            </h1>
            <p className="text-[#7A6A64] text-lg leading-relaxed">
              Questions about an order, a custom request, or just want to say hello?
              Our team typically replies within a few hours.
            </p>
          </div>
        </div>
      </section>

      {/* ── Main grid ────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <div className="grid lg:grid-cols-5 gap-10 lg:gap-16">

          {/* Contact info column */}
          <div className="lg:col-span-2 space-y-8">

            {/* Quick contact cards */}
            <div className="space-y-4">
              {whatsappLink() && (
              <a
                href={whatsappLink('Hi! I need help with my Framio order.')!}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-4 bg-white rounded-2xl p-5 border border-[#E8DDD6] hover:border-[#C4634F]/40 hover:shadow-sm transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center flex-shrink-0">
                  <MessageCircle size={18} className="text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-[#2D1F1A] text-sm group-hover:text-[#C4634F] transition-colors">WhatsApp Support</p>
                  {PHONE_DISPLAY && <p className="text-[#7A6A64] text-sm mt-0.5">{PHONE_DISPLAY}</p>}
                  <p className="text-[#7A6A64] text-xs mt-1">Fastest way to reach us — usually replies in &lt;30 min</p>
                </div>
              </a>
              )}

              <a
                href="mailto:hello@framio.shop"
                className="flex items-start gap-4 bg-white rounded-2xl p-5 border border-[#E8DDD6] hover:border-[#C4634F]/40 hover:shadow-sm transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-[#F5EDE5] border border-[#E8DDD6] flex items-center justify-center flex-shrink-0">
                  <Mail size={18} className="text-[#C4634F]" />
                </div>
                <div>
                  <p className="font-semibold text-[#2D1F1A] text-sm group-hover:text-[#C4634F] transition-colors">Email</p>
                  <p className="text-[#7A6A64] text-sm mt-0.5">hello@framio.shop</p>
                  <p className="text-[#7A6A64] text-xs mt-1">We reply within 4–6 business hours</p>
                </div>
              </a>

              <div className="flex items-start gap-4 bg-white rounded-2xl p-5 border border-[#E8DDD6]">
                <div className="w-10 h-10 rounded-xl bg-[#F5EDE5] border border-[#E8DDD6] flex items-center justify-center flex-shrink-0">
                  <Clock size={18} className="text-[#C9A84C]" />
                </div>
                <div>
                  <p className="font-semibold text-[#2D1F1A] text-sm">Support Hours</p>
                  <p className="text-[#7A6A64] text-sm mt-0.5">Mon – Sat, 9 AM – 8 PM IST</p>
                  <p className="text-[#7A6A64] text-xs mt-1">Closed on national holidays</p>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-white rounded-2xl p-5 border border-[#E8DDD6]">
                <div className="w-10 h-10 rounded-xl bg-[#F5EDE5] border border-[#E8DDD6] flex items-center justify-center flex-shrink-0">
                  <MapPin size={18} className="text-[#C4634F]" />
                </div>
                <div>
                  <p className="font-semibold text-[#2D1F1A] text-sm">Studio Address</p>
                  <p className="text-[#7A6A64] text-sm mt-0.5">Framio Studio, Baner Road</p>
                  <p className="text-[#7A6A64] text-sm">Pune, Maharashtra 411045</p>
                </div>
              </div>
            </div>

            {/* Social links */}
            <div>
              <p className="text-xs text-[#7A6A64] font-semibold uppercase tracking-widest mb-3">Follow Us</p>
              <div className="flex gap-3">
                {[
                  { label: 'Instagram', href: '#', icon: 'IG' },
                  { label: 'Facebook', href: '#', icon: 'FB' },
                  { label: 'Pinterest', href: '#', icon: 'PT' },
                ].map(({ label, href, icon }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    className="w-10 h-10 rounded-xl bg-white border border-[#E8DDD6] flex items-center justify-center text-xs font-bold text-[#7A6A64] hover:border-[#C4634F]/50 hover:text-[#C4634F] transition-all"
                  >
                    {icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Form column */}
          <div className="lg:col-span-3">
            {sent ? (
              <div className="bg-white rounded-3xl p-10 border border-[#E8DDD6] text-center">
                <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-emerald-50 flex items-center justify-center">
                  <CheckCircle size={32} className="text-emerald-500" />
                </div>
                <h2 className="text-2xl font-bold text-[#2D1F1A] mb-2">Message sent!</h2>
                <p className="text-[#7A6A64] mb-1">Thanks for reaching out, {form.name.split(' ')[0]}.</p>
                <p className="text-[#7A6A64] text-sm mb-8">
                  We'll reply to <span className="font-semibold text-[#2D1F1A]">{form.email}</span> within a few hours.
                  {whatsappLink() && 'For urgent matters, WhatsApp us directly.'}
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <Button variant="outline" onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }); }}>
                    Send Another
                  </Button>
                  <Button asChild>
                    <Link href="/">Back to Home</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-8 border border-[#E8DDD6]">
                <h2 className="text-xl font-bold text-[#2D1F1A] mb-6">Send us a message</h2>
                <form onSubmit={handleSubmit} className="space-y-5">

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#2D1F1A] mb-1.5">Full Name</label>
                      <input
                        type="text"
                        placeholder="Priya Sharma"
                        value={form.name}
                        onChange={set('name')}
                        autoComplete="name"
                        className="h-11 w-full rounded-xl border border-[#E8DDD6] bg-white px-4 text-sm text-[#2D1F1A] placeholder:text-[#7A6A64] focus:outline-none focus:ring-2 focus:ring-[#C4634F] focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#2D1F1A] mb-1.5">Email Address</label>
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={set('email')}
                        autoComplete="email"
                        className="h-11 w-full rounded-xl border border-[#E8DDD6] bg-white px-4 text-sm text-[#2D1F1A] placeholder:text-[#7A6A64] focus:outline-none focus:ring-2 focus:ring-[#C4634F] focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#2D1F1A] mb-1.5">Subject</label>
                    <select
                      value={form.subject}
                      onChange={set('subject')}
                      className="h-11 w-full rounded-xl border border-[#E8DDD6] bg-white px-4 text-sm text-[#2D1F1A] focus:outline-none focus:ring-2 focus:ring-[#C4634F] focus:border-transparent transition-all appearance-none"
                    >
                      <option value="">Select a topic…</option>
                      <option value="order">Order Status / Tracking</option>
                      <option value="custom">Custom / Bulk Order</option>
                      <option value="damage">Damaged / Missing Item</option>
                      <option value="return">Return / Replacement</option>
                      <option value="product">Product Question</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#2D1F1A] mb-1.5">Message</label>
                    <textarea
                      rows={5}
                      placeholder="Tell us how we can help…"
                      value={form.message}
                      onChange={set('message')}
                      className="w-full rounded-xl border border-[#E8DDD6] bg-white px-4 py-3 text-sm text-[#2D1F1A] placeholder:text-[#7A6A64] focus:outline-none focus:ring-2 focus:ring-[#C4634F] focus:border-transparent transition-all resize-none"
                    />
                  </div>

                  <Button type="submit" size="lg" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Sending…
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        Send Message
                      </>
                    )}
                  </Button>

                  {whatsappLink() && (
                  <p className="text-xs text-[#7A6A64] text-center">
                    Or reach us instantly on{' '}
                    <a
                      href={whatsappLink()!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#C4634F] font-semibold hover:underline"
                    >
                      WhatsApp
                    </a>
                  </p>
                  )}
                </form>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <section className="bg-[#F5EDE5] border-t border-[#E8DDD6]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <div className="text-center mb-10">
            <p className="text-[#C4634F] text-sm font-semibold tracking-widest uppercase mb-3">FAQ</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#2D1F1A]">Quick answers.</h2>
          </div>
          <div className="bg-white rounded-2xl border border-[#E8DDD6] px-6">
            {FAQS.map(({ q, a }) => (
              <FaqItem key={q} q={q} a={a} />
            ))}
          </div>
        </div>
      </section>

    </main>
  );
}
