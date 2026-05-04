import StandardContainer from "@/components/ui/StandardContainer";

export default function SocialProof() {
  const universityStats = [
    { val: "OAU", label: "Top Campus" },
    { val: "UNILAG", label: "Scholarly Hub" },
    { val: "UNIVERSITY OF IBADAN", label: "Academic Giant" },
    { val: "COVENANT", label: "Elite Partner" },
    { val: "BABCOCK", label: "Top Choice" },
    { val: "ABU", label: "Northern Hub" },
    { val: "LASU", label: "Lagos Giant" },
    { val: "NILE", label: "Private Adopter" },
    { val: "PAN-ATLANTIC", label: "Innovation Hub" },
    { val: "UNIZIK", label: "Eastern Hub" },
    { val: "BUK", label: "Strategic Partner" },
    { val: "FUTA", label: "Tech Powerhouse" },
    { val: "UNIBEN", label: "Academic Pillar" },
    { val: "KWASU", label: "Rising Star" },
    { val: "UNILORIN", label: "Excellence Hub" },
  ];
  
  const globalStats = [
    { val: "OXFORD", label: "Research Link" },
    { val: "MIT", label: "Tech Partner" },
    { val: "STANFORD", label: "AI Collaboration" },
    { val: "HARVARD", label: "Scholarly Access" },
    { val: "UCL", label: "EU Scholar Hub" },
    { val: "ETH ZURICH", label: "Science Node" },
    { val: "TORONTO", label: "Global Presence" },
    { val: "NUS", label: "Asian Hub" },
    { val: "TUM", label: "Engineering Node" },
  ];

  return (
    <section className="w-full py-12 md:py-20 border-y border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md z-10 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--background)] via-transparent to-[var(--background)] z-20 pointer-events-none" />
      
      <StandardContainer>
        <p className="text-center text-[10px] font-black uppercase tracking-[0.4em] text-[var(--accent)] mb-12 opacity-80">
          The Global Academic Network
        </p>
        
        <div className="space-y-12">
          {/* Row 1: Forward Scroll */}
          <div className="flex overflow-hidden relative">
            <div className="flex whitespace-nowrap py-4 animate-marquee hover:[animation-play-state:paused] transition-all">
              <div className="flex items-center space-x-12 px-6">
                {universityStats.map((stat, i) => (
                  <div key={`uni1-${i}`} className="flex flex-col items-center justify-center min-w-[140px] opacity-40 hover:opacity-100 transition-all hover:scale-110 duration-500">
                    <span className="text-2xl md:text-3xl font-black text-[var(--foreground)] tracking-tighter">{stat.val}</span>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--accent)] mt-1">{stat.label}</span>
                  </div>
                ))}
              </div>
              {/* Duplicated for loop */}
              <div className="flex items-center space-x-12 px-6">
                {universityStats.map((stat, i) => (
                  <div key={`uni1-dup-${i}`} className="flex flex-col items-center justify-center min-w-[140px] opacity-40 hover:opacity-100 transition-all hover:scale-110 duration-500">
                    <span className="text-2xl md:text-3xl font-black text-[var(--foreground)] tracking-tighter">{stat.val}</span>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--accent)] mt-1">{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Row 2: Backward Scroll */}
          <div className="flex overflow-hidden relative">
            <div className="flex whitespace-nowrap py-4 animate-marquee-reverse hover:[animation-play-state:paused] transition-all">
              <div className="flex items-center space-x-12 px-6">
                {globalStats.map((stat, i) => (
                  <div key={`global1-${i}`} className="flex flex-col items-center justify-center min-w-[160px] opacity-40 hover:opacity-100 transition-all hover:scale-110 duration-500">
                    <span className="text-2xl md:text-3xl font-black text-[var(--foreground)] tracking-tighter">{stat.val}</span>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--secondary)] mt-1">{stat.label}</span>
                  </div>
                ))}
              </div>
              {/* Duplicated for loop */}
              <div className="flex items-center space-x-12 px-6">
                {globalStats.map((stat, i) => (
                  <div key={`global1-dup-${i}`} className="flex flex-col items-center justify-center min-w-[160px] opacity-40 hover:opacity-100 transition-all hover:scale-110 duration-500">
                    <span className="text-2xl md:text-3xl font-black text-[var(--foreground)] tracking-tighter">{stat.val}</span>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--secondary)] mt-1">{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </StandardContainer>
    </section>
  );
}

