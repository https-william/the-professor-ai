export default function SocialProof() {
  return (
    <section className="w-full py-8 md:py-12 border-y border-[var(--border)] bg-[var(--background)]/50 backdrop-blur-sm z-10 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--background)] via-transparent to-[var(--background)] z-10 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-5 w-full">
        <p className="text-center text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--foreground-muted)] mb-6">
          Trusted by top scholars globally
        </p>
        
        {/* CSS Marquee */}
        <div className="flex overflow-hidden relative">
          <div className="flex space-x-12 animate-marquee whitespace-nowrap items-center w-max min-w-full justify-around">
            {[
              { val: "10,000+", label: "Decks Mastered" },
              { val: "OAU & UNILAG", label: "Top Public Adopters" },
              { val: "COVENANT & BABCOCK", label: "Top Private Adopters" },
              { val: "100%", label: "Curriculum Aligned" }
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center justify-center opacity-70 hover:opacity-100 transition-opacity">
                <span className="text-xl md:text-2xl font-black text-[var(--foreground)] tracking-tight">{stat.val}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)]">{stat.label}</span>
              </div>
            ))}
          </div>
          
          <div className="flex space-x-12 animate-marquee whitespace-nowrap items-center w-max min-w-full justify-around absolute top-0" style={{ animationDelay: '-15s', left: '100%' }}>
            {[
              { val: "10,000+", label: "Decks Mastered" },
              { val: "OAU & UNILAG", label: "Top Public Adopters" },
              { val: "COVENANT & BABCOCK", label: "Top Private Adopters" },
              { val: "100%", label: "Curriculum Aligned" }
            ].map((stat, i) => (
              <div key={i + "b"} className="flex flex-col items-center justify-center opacity-70 hover:opacity-100 transition-opacity">
                <span className="text-xl md:text-2xl font-black text-[var(--foreground)] tracking-tight">{stat.val}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)]">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
