import Link from "next/link";

export default function Footer() {
  return (
    <footer className="h-[80px] bg-[#252526] border-t border-outline-variant/10">
      <div className="container mx-auto px-6 h-full flex justify-between items-center">
        <div className="flex items-center gap-2 text-on-surface-variant">
          <span className="material-symbols-outlined text-primary" data-icon="memory">memory</span>
          <span className="font-bold text-sm">Remote MCU</span>
        </div>
        <nav className="hidden md:flex gap-8 text-xs font-medium text-on-surface-variant/60 uppercase tracking-widest">
          <Link href="/security" className="hover:text-primary transition-colors">Security</Link>
          <Link href="/api" className="hover:text-primary transition-colors">API</Link>
          <Link href="/status" className="hover:text-primary transition-colors">Status</Link>
          <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
        </nav>
        <div className="flex items-center gap-4 text-on-surface-variant/60">
          <Link href="#" className="hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-[20px]" data-icon="terminal">terminal</span>
          </Link>
          <Link href="#" className="hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-[20px]" data-icon="hub">hub</span>
          </Link>
          <Link href="#" className="hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-[20px]" data-icon="public">public</span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
