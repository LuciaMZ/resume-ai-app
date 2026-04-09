import { SectionWrapper } from './SectionWrapper';

export function TemplatePreviewSection() {
  return (
    <SectionWrapper id="preview" className="px-4 py-24 sm:py-32">
      <div className="relative z-10 mx-auto max-w-5xl">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold text-slate-50 sm:text-4xl">
            See It in Action
          </h2>
          <p className="mt-4 text-lg text-slate-300 sm:text-xl">
            A powerful editor with real-time preview
          </p>
        </div>

        {/* Browser Mockup */}
        <div className="glass-card overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-blue-500/10">
          {/* Browser Chrome */}
          <div className="flex items-center gap-2 border-b border-white/10 bg-white/5 px-4 py-3">
            <div className="flex gap-1.5" aria-hidden="true">
              <div className="h-3 w-3 rounded-full bg-white/15" />
              <div className="h-3 w-3 rounded-full bg-white/15" />
              <div className="h-3 w-3 rounded-full bg-white/15" />
            </div>
            <div className="ml-3 flex-1">
              <div className="mx-auto max-w-xs rounded-md bg-white/5 px-3 py-1 text-center text-xs text-slate-400">
                resumeaiapp.com/builder
              </div>
            </div>
          </div>

          {/* Mockup Content: 2-Panel Layout */}
          <div className="flex min-h-[300px] sm:min-h-[400px]">
            {/* Editor Panel Mockup */}
            <div className="w-[40%] border-r border-white/10 bg-white/[0.03] p-4 sm:p-6">
              {/* Header mockup */}
              <div className="mb-4 flex items-center gap-2">
                <div className="h-6 w-6 rounded bg-blue-500/30" />
                <div className="h-3 w-20 rounded bg-white/20" />
              </div>

              {/* Form fields mockup */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <div className="h-2 w-12 rounded bg-white/10" />
                  <div className="h-7 w-full rounded-md border border-white/10 bg-white/5" />
                </div>
                <div className="space-y-1.5">
                  <div className="h-2 w-16 rounded bg-white/10" />
                  <div className="h-7 w-full rounded-md border border-white/10 bg-white/5" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <div className="h-2 w-10 rounded bg-white/10" />
                    <div className="h-7 w-full rounded-md border border-white/10 bg-white/5" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-2 w-14 rounded bg-white/10" />
                    <div className="h-7 w-full rounded-md border border-white/10 bg-white/5" />
                  </div>
                </div>

                {/* Section header */}
                <div className="mt-4 flex items-center gap-2 border-t border-white/5 pt-4">
                  <div className="h-4 w-4 rounded bg-violet-500/30" />
                  <div className="h-3 w-24 rounded bg-white/15" />
                </div>

                {/* Text lines */}
                <div className="space-y-2 pl-2">
                  <div className="h-2 w-full rounded bg-white/10" />
                  <div className="h-2 w-[85%] rounded bg-white/10" />
                  <div className="h-2 w-[70%] rounded bg-white/10" />
                </div>
              </div>
            </div>

            {/* Preview Panel Mockup */}
            <div className="flex flex-1 items-start justify-center bg-white/[0.02] p-4 sm:p-8">
              <div className="w-full max-w-[280px] rounded-sm border border-white/5 bg-white/[0.06] p-4 shadow-lg sm:max-w-xs sm:p-6">
                {/* Name mockup */}
                <div className="mb-1 h-4 w-28 rounded bg-white/20" />
                <div className="mb-4 h-2 w-40 rounded bg-white/10" />

                {/* Section divider */}
                <div className="mb-3 h-px w-full bg-blue-400/20" />

                {/* Summary lines */}
                <div className="mb-4 space-y-1.5">
                  <div className="h-1.5 w-full rounded bg-white/8" />
                  <div className="h-1.5 w-[90%] rounded bg-white/8" />
                  <div className="h-1.5 w-[75%] rounded bg-white/8" />
                </div>

                {/* Section divider */}
                <div className="mb-2 h-2.5 w-20 rounded bg-white/15" />
                <div className="mb-3 h-px w-full bg-blue-400/20" />

                {/* Experience entry */}
                <div className="mb-3 space-y-1">
                  <div className="flex justify-between">
                    <div className="h-2 w-24 rounded bg-white/15" />
                    <div className="h-2 w-16 rounded bg-white/8" />
                  </div>
                  <div className="h-1.5 w-20 rounded bg-white/10" />
                  <div className="mt-1 space-y-1">
                    <div className="h-1.5 w-full rounded bg-white/6" />
                    <div className="h-1.5 w-[80%] rounded bg-white/6" />
                  </div>
                </div>

                {/* Second experience entry */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <div className="h-2 w-20 rounded bg-white/15" />
                    <div className="h-2 w-14 rounded bg-white/8" />
                  </div>
                  <div className="h-1.5 w-16 rounded bg-white/10" />
                  <div className="mt-1 space-y-1">
                    <div className="h-1.5 w-full rounded bg-white/6" />
                    <div className="h-1.5 w-[65%] rounded bg-white/6" />
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
