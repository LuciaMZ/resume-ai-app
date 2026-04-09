import { FileText, Github, ArrowUp } from 'lucide-react';
import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative z-10 border-t border-white/5 px-4 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        {/* Logo / Name */}
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-violet-500">
            <FileText className="h-3.5 w-3.5 text-white" strokeWidth={2.2} />
          </div>
          <span className="text-sm font-medium text-slate-400">
            Resume AI APP
          </span>
        </div>

        {/* Links */}
        <div className="flex items-center gap-6">
          <a
            href="https://github.com/LuciaMZ/resume-ai-app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-[#0A0E1A]"
          >
            <Github className="h-4 w-4" />
            <span>GitHub</span>
          </a>
          <Link
            href="/builder"
            className="text-sm text-slate-400 transition-colors hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-[#0A0E1A]"
          >
            Builder
          </Link>
          <a
            href="#"
            className="flex items-center gap-1 text-sm text-slate-400 transition-colors hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-[#0A0E1A]"
          >
            <ArrowUp className="h-3.5 w-3.5" />
            <span>Top</span>
          </a>
        </div>

        {/* Copyright */}
        <p className="text-xs text-slate-500">
          &copy; {currentYear} Resume AI APP. Free and open source.
        </p>
      </div>
    </footer>
  );
}
