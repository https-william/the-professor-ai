import StandardContainer from "@/components/ui/StandardContainer";

export default function SocialProof() {
  return (
    <section className="w-full py-8 md:py-12 border-y border-[var(--border)] bg-[var(--background)]/50 backdrop-blur-sm z-10 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--background)] via-transparent to-[var(--background)] z-10 pointer-events-none" />
      
      <StandardContainer>
        <p className="text-center text-[11px] font-bold tracking-[0.3em] text-[var(--foreground-secondary)] mb-6">
          Trusted by top scholars globally
        </p>
        
        {/* Unified High-Density Scrolling Ticker */}
        <div className="flex overflow-hidden relative group">
          <div className="flex animate-marquee whitespace-nowrap py-2">
            <div className="flex space-x-20 items-center px-10">
              {[
                { val: "15,000+", label: "Decks Mastered" },
                { val: "OAU", label: "Top Campus" },
                { val: "UNILAG", label: "Scholarly Hub" },
                { val: "UK", label: "Global Presence" },
                { val: "USA", label: "International Partner" },
                { val: "UNIVERSITY OF IBADAN", label: "Academic Giant" },
                { val: "COVENANT", label: "Elite Partner" },
                { val: "BABCOCK", label: "Top Choice" },
                { val: "GHANA", label: "Regional Leader" },
                { val: "CANADA", label: "Research Link" },
                { val: "ABU", label: "Northern Hub" },
                { val: "LASU", label: "Lagos Giant" },
                { val: "GERMANY", label: "EU Scholar Hub" },
                { val: "FRANCE", label: "EU Expansion" },
                { val: "NILE", label: "Private Adopter" },
                { val: "PAN-ATLANTIC", label: "Innovation Hub" },
                { val: "UNIZIK", label: "Eastern Hub" },
                { val: "BUK", label: "Strategic Partner" },
                { val: "100%", label: "Curriculum Aligned" }
              ].map((stat, i) => (
                <div key={i} className="flex flex-col items-center justify-center opacity-50 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-xl md:text-2xl font-black text-[var(--foreground)] tracking-tight">{stat.val}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-secondary)]">{stat.label}</span>
                </div>
              ))}
            </div>
            
            {/* Duplicated for seamless loop within the SAME scrolling flow */}
            <div className="flex space-x-20 items-center px-10">
              {[
                { val: "15,000+", label: "Decks Mastered" },
                { val: "OAU", label: "Top Campus" },
                { val: "UNILAG", label: "Scholarly Hub" },
                { val: "UK", label: "Global Presence" },
                { val: "USA", label: "International Partner" },
                { val: "UNIVERSITY OF IBADAN", label: "Academic Giant" },
                { val: "COVENANT", label: "Elite Partner" },
                { val: "BABCOCK", label: "Top Choice" },
                { val: "GHANA", label: "Regional Leader" },
                { val: "CANADA", label: "Research Link" },
                { val: "ABU", label: "Northern Hub" },
                { val: "LASU", label: "Lagos Giant" },
                { val: "GERMANY", label: "EU Scholar Hub" },
                { val: "FRANCE", label: "EU Expansion" },
                { val: "NILE", label: "Private Adopter" },
                { val: "PAN-ATLANTIC", label: "Innovation Hub" },
                { val: "UNIZIK", label: "Eastern Hub" },
                { val: "BUK", label: "Strategic Partner" },
                { val: "100%", label: "Curriculum Aligned" }
              ].map((stat, i) => (
                <div key={i + "b"} className="flex flex-col items-center justify-center opacity-50 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-xl md:text-2xl font-black text-[var(--foreground)] tracking-tight">{stat.val}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-secondary)]">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </StandardContainer>
    </section>
  );
}

