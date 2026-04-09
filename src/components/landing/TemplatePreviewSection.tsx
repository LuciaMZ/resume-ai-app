import { SectionWrapper } from './SectionWrapper';

export function TemplatePreviewSection() {
  return (
    <SectionWrapper id="preview" className="px-4 py-24 sm:py-32">
      <div className="relative z-10 mx-auto max-w-5xl">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold text-[var(--color-primary)] sm:text-4xl">
            See It in Action
          </h2>
          <p className="mt-4 text-lg text-slate-600 sm:text-xl">
            A powerful editor with real-time preview
          </p>
        </div>

        {/* Browser Mockup */}
        <div className="glass-card overflow-hidden rounded-2xl border border-[var(--color-border)] shadow-xl shadow-slate-300/70">
          {/* Browser Chrome */}
          <div className="flex items-center gap-2 border-b border-[var(--color-border)] bg-slate-50 px-4 py-3">
            <div className="flex gap-1.5" aria-hidden="true">
              <div className="h-3 w-3 rounded-full bg-slate-300" />
              <div className="h-3 w-3 rounded-full bg-slate-300" />
              <div className="h-3 w-3 rounded-full bg-slate-300" />
            </div>
            <div className="ml-3 flex-1">
              <div className="mx-auto max-w-xs rounded-md border border-[var(--color-border)] bg-white px-3 py-1 text-center text-xs text-slate-600">
                resumeaiapp.com/builder
              </div>
            </div>
          </div>

          {/* Mockup Content: 2-Panel Layout */}
          <div className="flex min-h-[300px] sm:min-h-[400px]">
            {/* Editor Panel Mockup */}
            <div className="w-[40%] border-r border-[var(--color-border)] bg-slate-50 p-4 sm:p-6">
              {/* Header mockup */}
              <div className="mb-4 flex items-center gap-2">
                <div className="h-6 w-6 rounded bg-[var(--color-secondary)]/30" />
                <div className="h-3 w-20 rounded bg-slate-300" />
              </div>

              {/* Form fields mockup */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <div className="h-2 w-12 rounded bg-slate-200" />
                  <div className="h-7 w-full rounded-md border border-[var(--color-border)] bg-white" />
                </div>
                <div className="space-y-1.5">
                  <div className="h-2 w-16 rounded bg-slate-200" />
                  <div className="h-7 w-full rounded-md border border-[var(--color-border)] bg-white" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <div className="h-2 w-10 rounded bg-slate-200" />
                    <div className="h-7 w-full rounded-md border border-[var(--color-border)] bg-white" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-2 w-14 rounded bg-slate-200" />
                    <div className="h-7 w-full rounded-md border border-[var(--color-border)] bg-white" />
                  </div>
                </div>

                {/* Section header */}
                <div className="mt-4 flex items-center gap-2 border-t border-[var(--color-border)] pt-4">
                  <div className="h-4 w-4 rounded bg-[var(--color-accent)]/30" />
                  <div className="h-3 w-24 rounded bg-slate-300" />
                </div>

                {/* Text lines */}
                <div className="space-y-2 pl-2">
                  <div className="h-2 w-full rounded bg-slate-200" />
                  <div className="h-2 w-[85%] rounded bg-slate-200" />
                  <div className="h-2 w-[70%] rounded bg-slate-200" />
                </div>
              </div>
            </div>

            {/* Preview Panel Mockup */}
            <div className="flex flex-1 items-start justify-center bg-white p-4 sm:p-8">
              <div className="w-full max-w-[280px] rounded-sm border border-[var(--color-border)] bg-white p-4 shadow-sm sm:max-w-xs sm:p-6">
                {/* Name mockup */}
                <div className="mb-1 h-4 w-28 rounded bg-slate-300" />
                <div className="mb-4 h-2 w-40 rounded bg-slate-200" />

                {/* Section divider */}
                <div className="mb-3 h-px w-full bg-[var(--color-secondary)]/20" />

                {/* Summary lines */}
                <div className="mb-4 space-y-1.5">
                  <div className="h-1.5 w-full rounded bg-slate-200" />
                  <div className="h-1.5 w-[90%] rounded bg-slate-200" />
                  <div className="h-1.5 w-[75%] rounded bg-slate-200" />
                </div>

                {/* Section divider */}
                <div className="mb-2 h-2.5 w-20 rounded bg-slate-300" />
                <div className="mb-3 h-px w-full bg-[var(--color-secondary)]/20" />

                {/* Experience entry */}
                <div className="mb-3 space-y-1">
                  <div className="flex justify-between">
                    <div className="h-2 w-24 rounded bg-slate-300" />
                    <div className="h-2 w-16 rounded bg-slate-200" />
                  </div>
                  <div className="h-1.5 w-20 rounded bg-slate-200" />
                  <div className="mt-1 space-y-1">
                    <div className="h-1.5 w-full rounded bg-slate-200" />
                    <div className="h-1.5 w-[80%] rounded bg-slate-200" />
                  </div>
                </div>

                {/* Second experience entry */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <div className="h-2 w-20 rounded bg-slate-300" />
                    <div className="h-2 w-14 rounded bg-slate-200" />
                  </div>
                  <div className="h-1.5 w-16 rounded bg-slate-200" />
                  <div className="mt-1 space-y-1">
                    <div className="h-1.5 w-full rounded bg-slate-200" />
                    <div className="h-1.5 w-[65%] rounded bg-slate-200" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
