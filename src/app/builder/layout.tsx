import type { Metadata } from 'next';
import { ResumeProvider } from '@/providers/ResumeProvider';
import { AIProvider } from '@/providers/AIProvider';
import { ActiveSectionProvider } from '@/providers/ActiveSectionProvider';
import { ToastProvider } from '@/providers/ToastProvider';

export const metadata: Metadata = {
  title: 'Resume Builder | Resume AI APP',
  description: 'Edit your resume with the Resume AI APP WYSIWYG builder.',
};

export default function BuilderLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ResumeProvider>
      <AIProvider>
        <ActiveSectionProvider>
          <ToastProvider>{children}</ToastProvider>
        </ActiveSectionProvider>
      </AIProvider>
    </ResumeProvider>
  );
}
