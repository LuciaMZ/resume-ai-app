import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Resume AI APP -- Free AI-Powered Resume Builder | No Sign-Up Required',
  description:
    'Build professional resumes with a WYSIWYG editor, real-time preview, and optional AI suggestions. ' +
    'Free forever, no account needed. Export as PDF instantly.',
  openGraph: {
    title: 'Resume AI APP -- Free AI-Powered Resume Builder',
    description:
      'Build, preview, and export professional resumes as PDF. Optional AI-powered suggestions with your own API key. No sign-up required.',
    type: 'website',
  },
  keywords: [
    'resume builder',
    'AI resume',
    'free resume builder',
    'WYSIWYG resume editor',
    'PDF resume export',
    'no sign-up resume builder',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} scroll-smooth`}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
