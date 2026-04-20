import { useState } from 'react';

interface BookingModalProps {
  title: string;
  subtitle?: string;
  type: 'scholarship' | 'visa' | 'contact';
  onClose: () => void;
}

export function BookingModal({ title, subtitle, type, onClose }: BookingModalProps) {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', message: '', country: '', program: title,
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Build WhatsApp message
    const msg = encodeURIComponent(
      `*${type === 'scholarship' ? 'Scholarship' : type === 'visa' ? 'Visa' : 'Enquiry'} Application*\n\n` +
      `*Name:* ${form.name}\n` +
      `*Email:* ${form.email}\n` +
      `*Phone:* ${form.phone}\n` +
      `*Program:* ${form.program}\n` +
      `*Message:* ${form.message}`
    );
    window.open(`https://wa.me/231889792996?text=${msg}`, '_blank');
    setSubmitted(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          background: 'hsl(220 20% 10%)',
          border: '1px solid rgba(255,255,255,0.1)',
          animation: 'slideInUp 0.3s ease-out',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ background: type === 'scholarship' ? 'rgba(168,85,247,0.15)' : type === 'visa' ? 'rgba(34,197,94,0.15)' : 'rgba(255,95,31,0.15)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div>
            <div className="font-black text-base">{title}</div>
            {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl leading-none">×</button>
        </div>

        {submitted ? (
          <div className="p-6 flex flex-col items-center gap-4 text-center">
            <div className="text-5xl">✅</div>
            <div className="font-black text-lg text-green-400">Application Submitted!</div>
            <p className="text-sm text-muted-foreground">
              You'll be redirected to WhatsApp to complete your application with our team. We'll get back to you within 24 hours.
            </p>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl font-bold text-sm transition-all"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-3">
            {[
              { label: 'Full Name', key: 'name', type: 'text', placeholder: 'Your full name', required: true },
              { label: 'Email Address', key: 'email', type: 'email', placeholder: 'your@email.com', required: true },
              { label: 'WhatsApp / Phone', key: 'phone', type: 'tel', placeholder: '+231 XXX XXX XXX', required: true },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs text-muted-foreground mb-1 block">{f.label}</label>
                <input
                  type={f.type}
                  placeholder={f.placeholder}
                  required={f.required}
                  value={form[f.key as keyof typeof form]}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm rounded-xl bg-background border border-border outline-none focus:border-primary transition-colors"
                />
              </div>
            ))}

            {type !== 'contact' && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Program / Destination</label>
                <input
                  type="text"
                  value={form.program}
                  onChange={e => setForm(prev => ({ ...prev, program: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm rounded-xl bg-background border border-border outline-none focus:border-primary transition-colors"
                />
              </div>
            )}

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Message / Questions</label>
              <textarea
                placeholder="Any specific questions or details..."
                value={form.message}
                onChange={e => setForm(prev => ({ ...prev, message: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2.5 text-sm rounded-xl bg-background border border-border outline-none focus:border-primary transition-colors resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl font-black text-sm uppercase tracking-wide transition-all active:scale-95"
              style={{
                background: type === 'scholarship' ? 'linear-gradient(135deg, #a855f7, #7c3aed)' : type === 'visa' ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'linear-gradient(135deg, #ff5f1f, #dc2626)',
                color: 'white',
                boxShadow: type === 'scholarship' ? '0 0 20px rgba(168,85,247,0.4)' : type === 'visa' ? '0 0 20px rgba(34,197,94,0.4)' : '0 0 20px rgba(255,95,31,0.4)',
              }}
            >
              📲 Apply via WhatsApp
            </button>
            <p className="text-center text-xs text-muted-foreground">
              Free to apply • No hidden charges • 24h response
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
