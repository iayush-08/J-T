    /* ========================================================================
       4. SHARED HELPERS
       ======================================================================== */
    const SECTIONS = [
      { id: 'top', label: 'Overview' },
      { id: 'documentary-studio', label: 'The film' },
      { id: 'coastal-map', label: 'Coast map' },
      { id: 'economic-calculator', label: 'Loss ledger' },
      { id: 'trophic-cascade', label: 'Food web' },
      { id: 'ghost-gear', label: 'Ghost gear' },
      { id: 'policy-hub', label: 'Policy' },
    ];

    const inr = (n) => Math.round(n).toLocaleString('en-IN');
    const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

    const scrollToId = (id) => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const istStamp = () => {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: false,
      }).formatToParts(new Date());
      const get = (t) => (parts.find((p) => p.type === t) || {}).value;
      return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')} IST`;
    };

    const useAnimatedNumber = (target, duration = 650) => {
      const [value, setValue] = useState(target);
      const fromRef = useRef(target);
      useEffect(() => {
        const from = fromRef.current;
        if (from === target) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          fromRef.current = target;
          setValue(target);
          return;
        }
        let raf;
        const start = performance.now();
        const tick = (now) => {
          const t = Math.min(1, (now - start) / duration);
          const v = from + (target - from) * (1 - Math.pow(1 - t, 3));
          fromRef.current = v;
          setValue(v);
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
      }, [target, duration]);
      return value;
    };

    const AnimatedNumber = ({ value, format = inr }) => {
      const v = useAnimatedNumber(value);
      return <>{format(v)}</>;
    };

    const useActiveSection = () => {
      const [active, setActive] = useState('top');
      useEffect(() => {
        const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean);
        const io = new IntersectionObserver(
          (entries) => entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); }),
          { rootMargin: '-40% 0px -55% 0px' }
        );
        els.forEach((el) => io.observe(el));
        return () => io.disconnect();
      }, []);
      return active;
    };

    const useScrollProgress = () => {
      const [p, setP] = useState(0);
      useEffect(() => {
        const onScroll = () => {
          const h = document.documentElement.scrollHeight - window.innerHeight;
          setP(h > 0 ? window.scrollY / h : 0);
        };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        return () => {
          window.removeEventListener('scroll', onScroll);
          window.removeEventListener('resize', onScroll);
        };
      }, []);
      return p;
    };

    const SectionHead = ({ index, kicker, title, dek, tone = 'ink' }) => {
      const paper = tone === 'paper';
      return (
        <header className={`grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-10 pb-10 mb-12 border-b ${paper ? 'border-ink/15' : 'border-white/[0.08]'}`}>
          <div className="md:col-span-2 flex md:flex-col gap-3 md:gap-1.5 md:pt-3">
            <span className={`font-mono text-[11px] tnum ${paper ? 'text-rust' : 'text-acc-secondary'}`}>&sect; {index}</span>
            <span className={`font-mono text-[11px] uppercase tracking-[0.16em] ${paper ? 'text-ink/50' : 'text-txt-tertiary'}`}>{kicker}</span>
          </div>
          <h2 className={`md:col-span-7 font-serif text-[40px] sm:text-[58px] leading-[0.98] tracking-[-0.015em] text-balance ${paper ? 'text-ink' : 'text-white'}`}>
            {title}
          </h2>
          <p className={`md:col-span-3 md:pt-3 text-[15px] leading-relaxed text-pretty ${paper ? 'text-ink/70' : 'text-txt-secondary'}`}>
            {dek}
          </p>
        </header>
      );
    };

    /* ========================================================================
       5. MASTHEAD
       ======================================================================== */
    const Masthead = ({ soundActive, onToggleSound, monsoonSurge, onToggleMonsoon, selectedLang, onChangeLang, openCount, onReport }) => {
      const active = useActiveSection();
      const progress = useScrollProgress();
      const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

      return (
        <header className="sticky top-0 z-40 bg-ink/85 backdrop-blur-xl backdrop-saturate-150 border-b border-white/[0.06]">
          <div className="mx-auto max-w-6xl px-5 sm:px-8 h-14 flex items-center justify-between gap-6">
            <a
              href="#top"
              onClick={(e) => { e.preventDefault(); scrollToId('top'); }}
              className="flex items-baseline gap-3 shrink-0"
              aria-label="Jal-Tarang, back to top"
            >
              <span className="font-serif text-[25px] leading-none text-white">Jal-Tarang</span>
              <span className="hidden md:inline font-mono text-[10px] uppercase tracking-[0.16em] text-txt-tertiary">Updated {today}</span>
            </a>

            <div className="flex items-center gap-2">
              <label className="sr-only" htmlFor="lang-select">Narration language</label>
              <select
                id="lang-select"
                value={selectedLang}
                onChange={(e) => onChangeLang(e.target.value)}
                className="h-8 bg-transparent border border-white/10 hover:border-white/25 text-[12px] text-txt-primary rounded-[3px] pl-2 pr-1 outline-none cursor-pointer transition-colors focus-visible:border-acc-secondary"
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी</option>
                <option value="ml">മലയാളം</option>
                <option value="ta">தமிழ்</option>
                <option value="mr">मराठी</option>
              </select>

              <button
                onClick={onToggleMonsoon}
                role="switch"
                aria-checked={monsoonSurge}
                className={`h-8 hidden sm:flex items-center gap-2 px-2.5 rounded-[3px] border text-[12px] transition-colors ${monsoonSurge ? 'border-acc-gold/60 text-acc-gold' : 'border-white/10 hover:border-white/25 text-txt-muted hover:text-txt-primary'}`}
                title="Model monsoon storm-surge conditions"
              >
                <span className={`relative w-6 h-3.5 rounded-full transition-colors ${monsoonSurge ? 'bg-acc-gold' : 'bg-white/15'}`} aria-hidden="true">
                  <span className={`absolute top-0.5 w-2.5 h-2.5 rounded-full transition-all ${monsoonSurge ? 'left-[12px] bg-ink' : 'left-0.5 bg-white/70'}`}></span>
                </span>
                Monsoon
              </button>

              <button
                onClick={onToggleSound}
                aria-pressed={soundActive}
                aria-label={soundActive ? 'Mute sea sound' : 'Play sea sound'}
                className={`h-8 w-8 flex items-center justify-center rounded-[3px] border transition-colors ${soundActive ? 'border-acc-secondary/60 text-acc-secondary' : 'border-white/10 hover:border-white/25 text-txt-secondary hover:text-txt-primary'}`}
              >
                <Icon name={soundActive ? 'volume2' : 'volumeX'} className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={onReport}
                className="h-8 hidden md:inline-flex items-center gap-2 px-3 rounded-[3px] bg-white text-ink text-[13px] font-medium hover:bg-acc-secondary transition-colors"
              >
                Report ghost gear
                <span className="font-mono text-[10px] tnum px-1.5 py-px rounded-sm bg-ink/10" aria-label={`${openCount} open reports`}>{openCount}</span>
              </button>
            </div>
          </div>

          <nav aria-label="Sections" className="border-t border-white/[0.05]">
            <ul className="mx-auto max-w-6xl px-5 sm:px-8 flex items-center gap-6 sm:gap-7 overflow-x-auto scrollbar-none -mb-px">
              {SECTIONS.map((s, i) => {
                const isActive = active === s.id;
                return (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      onClick={(e) => { e.preventDefault(); scrollToId(s.id); soundscape.playSonarPing(); }}
                      aria-current={isActive ? 'location' : undefined}
                      className={`flex items-baseline gap-1.5 py-2.5 border-b whitespace-nowrap text-[13px] transition-colors ${isActive ? 'border-acc-secondary text-white' : 'border-transparent text-txt-secondary hover:text-txt-primary'}`}
                    >
                      <span className={`font-mono text-[10px] tnum ${isActive ? 'text-acc-secondary' : 'text-txt-tertiary'}`}>{String(i).padStart(2, '0')}</span>
                      {s.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="absolute left-0 bottom-0 h-px bg-acc-secondary" style={{ width: `${progress * 100}%` }} aria-hidden="true"></div>
        </header>
      );
    };

    /* ========================================================================
       6. HERO
       ======================================================================== */
    const Hero = ({ monsoonSurge, onInspectDebris, latestReport, reportCount }) => {
      const mult = monsoonSurge ? 2.8 : 1;
      const kpis = [
        { id: 'cost', label: 'Spent each year repairing nets', value: 3842 * mult, unit: 'crore', prefix: '₹', source: 'ICAR-CMFRI MFIS' },
        { id: 'gear', label: 'Ghost gear hauled out so far', value: 16420 + (monsoonSurge ? 4200 : 0), unit: 'tonnes', source: 'Suchitwa Sagaram port logs' },
        { id: 'hours', label: 'Lost per trip cutting plastic off propellers', value: 2.3 * mult, unit: 'hours', format: (v) => v.toFixed(1), source: 'Kochi, Sassoon & Kasimedu' },
        { id: 'coast', label: 'Of coastline watched, across nine states', value: 7516.6, unit: 'km', format: (v) => v.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 }), source: 'MoES / NCCR' },
      ];

      return (
        <section id="top" className="border-b border-white/[0.06]">
          <div className="mx-auto max-w-6xl px-5 sm:px-8 pt-10 sm:pt-14">
            <div className="flex items-center justify-between gap-4 py-2.5 border-y border-white/[0.08] font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.16em] text-txt-tertiary">
              <span>A public ledger</span>
              <span className="hidden sm:inline">CMFRI &middot; NIO Goa &middot; MPEDA &middot; NCCR</span>
              <span>Nine coastal states</span>
            </div>

            <h1 className="mt-10 sm:mt-14 font-serif text-[58px] sm:text-[96px] lg:text-[124px] leading-[0.88] tracking-[-0.025em] text-white text-balance max-w-[13ch]">
              What the sea brings back <em className="text-acc-secondary">in the nets.</em>
            </h1>

            <div className="mt-12 sm:mt-16 grid grid-cols-1 lg:grid-cols-12 gap-12 pb-16 sm:pb-20">
              <div className="lg:col-span-5 flex flex-col gap-10">
                <p className="text-[18px] leading-[1.65] text-txt-muted text-pretty">
                  <span className="float-left font-serif text-[76px] leading-[0.78] mr-2.5 mt-1.5 text-white" aria-hidden="true">E</span>
                  <span className="sr-only">E</span>very morning, crews at Kochi, Sassoon Dock and Kasimedu sort plastic out of the catch before they can sell it. This site follows that plastic back up the rivers and drains it came from, and counts what it costs the people who fish.
                </p>

                <div className="flex flex-wrap items-center gap-x-7 gap-y-4">
                  <button
                    onClick={onInspectDebris}
                    className="group inline-flex items-center gap-3 h-12 pl-5 pr-4 rounded-[3px] bg-acc-secondary text-ink text-[14px] font-medium hover:bg-white transition-colors"
                  >
                    See what gets caught
                    <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">&rarr;</span>
                  </button>
                  <a
                    href="#economic-calculator"
                    onClick={(e) => { e.preventDefault(); scrollToId('economic-calculator'); }}
                    className="link-underline pb-0.5 text-[14px] text-txt-primary hover:text-white"
                  >
                    Work out one boat&apos;s losses
                  </a>
                </div>

                {latestReport && (
                  <a
                    href="#ghost-gear"
                    onClick={(e) => { e.preventDefault(); scrollToId('ghost-gear'); }}
                    className="group mt-auto block border-t border-white/[0.08] pt-5"
                  >
                    <span className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-txt-tertiary">
                      <span className="flex items-center gap-2">
                        <span className="relative flex w-1.5 h-1.5" aria-hidden="true">
                          <span className="absolute inset-0 rounded-full bg-acc-green animate-ping opacity-60"></span>
                          <span className="relative w-1.5 h-1.5 rounded-full bg-acc-green"></span>
                        </span>
                        Latest on the ghost-gear desk
                      </span>
                      <span className="tnum">{reportCount} logged</span>
                    </span>
                    <span key={latestReport.id} className="jt-fade mt-3 block">
                      <span className="block text-[15px] text-white group-hover:text-acc-secondary transition-colors">
                        {latestReport.weightKg} kg &middot; {latestReport.debrisType}
                      </span>
                      <span className="mt-1 block text-[13px] text-txt-secondary">
                        {latestReport.portName} &middot; <span className="font-mono text-[12px] tnum">{latestReport.timestamp}</span>
                      </span>
                    </span>
                  </a>
                )}
              </div>

              <figure className="lg:col-span-7">
                <div className="relative overflow-hidden rounded-[3px] aspect-[4/3] sm:aspect-[16/11] w-full bg-bg-surface">
                  <img
                    src="/images/harbour-kochi.png"
                    alt="A fisherman on a wooden boat at dawn in Kochi harbour, pulling plastic out of a green nylon net"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <span className="absolute left-3 bottom-3 font-mono text-[10px] tracking-wide text-white/85 bg-black/35 backdrop-blur px-2 py-0.5 rounded-sm">
                    09&deg;57&prime;N 76&deg;16&prime;E
                  </span>
                </div>
                <figcaption className="mt-3 flex items-start justify-between gap-4 text-[12px] leading-snug text-txt-tertiary">
                  <span>Thoppumpady harbour, Kochi. Clearing a net after a 14-hour trip.</span>
                  <span className="font-mono shrink-0">Fig. 1</span>
                </figcaption>
              </figure>
            </div>
          </div>

          <div className="border-t border-white/[0.06]">
            <dl className="mx-auto max-w-6xl px-5 sm:px-8 grid grid-cols-2 lg:grid-cols-4">
              {kpis.map((k, i) => (
                <div
                  key={k.id}
                  className={`py-8 sm:py-10 pr-4 ${i % 2 === 1 ? 'pl-5 sm:pl-8 border-l border-white/[0.06]' : ''} ${i >= 2 ? 'border-t lg:border-t-0 border-white/[0.06]' : ''} ${i === 2 ? 'lg:pl-8 lg:border-l' : ''}`}
                >
                  <dt className="text-[13px] leading-snug text-txt-secondary max-w-[15rem]">{k.label}</dt>
                  <dd className="mt-4">
                    <span className={`tnum text-[34px] sm:text-[42px] font-light tracking-[-0.03em] leading-none transition-colors ${monsoonSurge && k.id !== 'coast' ? 'text-acc-gold' : 'text-white'}`}>
                      {k.prefix}<AnimatedNumber value={k.value} format={k.format || inr} />
                    </span>
                    <span className="ml-1.5 text-[13px] text-txt-tertiary">{k.unit}</span>
                  </dd>
                  <dd className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-txt-tertiary">{k.source}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      );
    };

