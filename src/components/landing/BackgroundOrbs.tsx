export function BackgroundOrbs() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {/* Orb 1: Blue -- top right of hero */}
      <div
        className="absolute -top-32 right-[-10%] h-[500px] w-[500px] rounded-full opacity-30 blur-[100px] sm:h-[600px] sm:w-[600px]"
        style={{
          background: 'radial-gradient(circle, rgba(59,130,246,0.5) 0%, transparent 70%)',
          animation: 'orb-float 20s ease-in-out infinite',
        }}
      />

      {/* Orb 2: Violet -- left of features */}
      <div
        className="absolute top-[35%] -left-[15%] h-[400px] w-[400px] rounded-full opacity-20 blur-[100px] sm:h-[500px] sm:w-[500px]"
        style={{
          background: 'radial-gradient(circle, rgba(139,92,246,0.5) 0%, transparent 70%)',
          animation: 'orb-float 25s ease-in-out infinite reverse',
        }}
      />

      {/* Orb 3: Cyan -- right of AI section */}
      <div
        className="absolute top-[60%] -right-[10%] h-[350px] w-[350px] rounded-full opacity-20 blur-[100px] sm:h-[500px] sm:w-[500px]"
        style={{
          background: 'radial-gradient(circle, rgba(6,182,212,0.4) 0%, transparent 70%)',
          animation: 'orb-pulse 15s ease-in-out infinite',
        }}
      />

      {/* Orb 4: Deep blue -- bottom left CTA */}
      <div
        className="absolute bottom-[10%] -left-[5%] h-[300px] w-[300px] rounded-full opacity-15 blur-[100px] sm:h-[400px] sm:w-[400px]"
        style={{
          background: 'radial-gradient(circle, rgba(37,99,235,0.4) 0%, transparent 70%)',
          animation: 'orb-float 30s ease-in-out infinite',
        }}
      />
    </div>
  );
}
