'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, Menu, X } from 'lucide-react';

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'AI', href: '#ai' },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 20);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsMobileMenuOpen(false);
    }
    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isMobileMenuOpen]);

  return (
    <nav
      className={`fixed top-4 right-4 left-4 z-50 rounded-2xl border border-[var(--color-border)] px-4 py-3 backdrop-blur-xl transition-all duration-300 sm:px-6 ${
        isScrolled ? 'bg-white/90 shadow-lg shadow-slate-300/60' : 'bg-white/70'
      }`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        {/* Logo */}
        <a
          href="#"
          className="flex items-center gap-2.5 rounded-lg p-1 transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg)]"
          aria-label="Resume AI APP - Back to top"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-secondary)] shadow-md shadow-blue-200/60">
            <FileText className="h-4 w-4 text-white" strokeWidth={2.2} />
          </div>
          <span className="text-lg font-semibold tracking-tight text-[var(--color-primary)]">
            Resume <span className="text-[var(--color-secondary)]">AI APP</span>
          </span>
        </a>

        {/* Desktop Nav Links */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg)]"
            >
              {link.label}
            </a>
          ))}
          <div className="ml-3">
            <Link
              href="/builder"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-secondary)] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-200/70 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[var(--color-secondary-hover)] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg)]"
            >
              Start Building
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="rounded-lg p-2 text-slate-600 transition-colors hover:text-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)] md:hidden"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-expanded={isMobileMenuOpen}
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="mt-3 border-t border-[var(--color-border)] pt-3 md:hidden">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)]"
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/builder"
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-secondary)] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-200/70 transition-all duration-300 hover:bg-[var(--color-secondary-hover)] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)]"
            >
              Start Building
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
