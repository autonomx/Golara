const adminLinks = [
  { href: '#inquiries', label: 'Inquiries' },
  { href: '#media', label: 'Media' },
  { href: '#homepage', label: 'Homepage' },
  { href: '#categories', label: 'Categories' },
  { href: '#products', label: 'Products' }
];

export function AdminQuickNav() {
  return (
    <nav className="rounded-[2rem] border border-rosewood/10 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-2 text-xs font-semibold uppercase tracking-[0.2em] text-olive">Jump to</span>
        {adminLinks.map((link) => (
          <a key={link.href} href={link.href} className="rounded-full border border-rosewood/15 bg-cream px-4 py-2 text-sm font-semibold text-rosewood transition hover:bg-white">
            {link.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
