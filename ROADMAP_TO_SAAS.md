
# Roadmap to SaaS: The Final Stretch

To prevent "constant development syndrome," we have defined a strict set of remaining phases. Once Phase 8 is complete, the project enters **Maintenance Mode** (Feature Freeze).

---

## 🟢 Phase 6: Optimization & Polish (Current)
**Goal:** Make it fast, secure, and usable.
- [ ] Performance audit (Lighthouse score > 90).
- [ ] PWA offline capabilities.
- [ ] Mobile touch target fixes.
- [ ] Security audit (RLS policies, Input sanitization).

---

## 🟡 Phase 7: Business Logic & Compliance
**Goal:** Ensure the system can legally and financially sustain itself.
- [ ] **Terms of Service & Privacy Policy**: Draft legal documents regarding AI data usage and student data privacy.
- [ ] **Email Transactional Logic**: Ensure welcome emails, receipt emails, and "subscription expiring" emails are firing correctly via Supabase SMTP.
- [ ] **Support Channel**: Integrate a real support ticketing system (or link `mailto` to a dedicated support desk).
- [ ] **Billing Portal**: Allow users to cancel subscriptions or view invoice history (Self-serve).

---

## 🔴 Phase 8: The Launch (Go-To-Market)
**Goal:** Acquire users. Stop coding. Start selling.
- [ ] **Code Freeze**: No new features. Bug fixes only.
- [ ] **Analytics Setup**: Integrate PostHog or Google Analytics 4 to track conversion rates (Landing -> Auth -> Paid).
- [ ] **Product Hunt Launch**: Prepare assets (Screenshots, Demo Video, First comment).
- [ ] **Social Media Blast**: "The Professor is Live" campaign.
- [ ] **Seed Content**: Create 10-20 high-quality "Public Share" exams to use as marketing magnets.

---

## 🏁 Phase 9: SaaS Operations (Post-Launch)
**Goal:** Retention and Stability.
- **Monitoring**: Watch `admin_call_stats` and `payment_logs` daily.
- **Bug Fixes**: Address critical issues reported by users.
- **Feature Cycle**: New features are only considered **once per quarter** based on user feedback, not developer impulse.
