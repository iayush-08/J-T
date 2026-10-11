    /* ========================================================================
       10. GHOST GEAR DESK — LIVE LOG AND FILING FORM
       ======================================================================== */
    const STATUS_META = {
      Dispatched: { label: 'Boat dispatched', dot: 'bg-[#C9892B]' },
      Inspecting: { label: 'Being checked', dot: 'bg-[#3E5A66]' },
      Cleared: { label: 'Cleared', dot: 'bg-[#5E7F58]' },
    };
    const DEBRIS_TYPES = [
      'Ghost Net (Nylon Monofilament)',
      'Heavy Trawl Cod-End & Ropes',
      'Thermocol Crates & Synthetic Floats',
      'Drifting Polypropylene Mooring Cable',
    ];

    const Field = ({ id, label, error, hint, children }) => (
      <div>
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor={id} className="text-[13px] font-medium text-ink">{label}</label>
          {hint}
        </div>
        <div className="mt-1.5">{children}</div>
        {error && <p id={`${id}-err`} className="mt-1.5 text-[12px] text-rust">{error}</p>}
      </div>
    );

    const ReportForm = ({ onSubmit }) => {
      const empty = { state: 'kerala', port: '', coords: '', debris: DEBRIS_TYPES[0], weight: '', depth: '', reporter: '', notes: '' };
      const [f, setF] = useState(empty);
      const [errors, setErrors] = useState({});
      const [geo, setGeo] = useState({ status: 'idle', message: '' });
      const [filedId, setFiledId] = useState(null);
      const set = (k) => (e) => setF((prev) => ({ ...prev, [k]: e.target.value }));

      const locate = () => {
        if (!navigator.geolocation) {
          setGeo({ status: 'error', message: 'This browser can’t share a location. Type the coordinates instead.' });
          return;
        }
        setGeo({ status: 'loading', message: 'Getting a fix…' });
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude: la, longitude: lo, accuracy } = pos.coords;
            setF((p) => ({ ...p, coords: `${Math.abs(la).toFixed(3)}° ${la >= 0 ? 'N' : 'S'}, ${Math.abs(lo).toFixed(3)}° ${lo >= 0 ? 'E' : 'W'}` }));
            setGeo({ status: 'ok', message: `Located to within ${Math.round(accuracy)} m.` });
          },
          (err) => setGeo({ status: 'error', message: err.code === 1 ? 'Location permission was declined. Type the coordinates instead.' : 'Couldn’t get a fix. Type the coordinates instead.' }),
          { enableHighAccuracy: true, timeout: 10000 }
        );
      };

      const validate = () => {
        const e = {};
        if (!f.port.trim()) e.port = 'Name the harbour or stretch of coast.';
        const w = Number(f.weight);
        if (!f.weight || !(w > 0) || w > 20000) e.weight = 'Between 1 and 20,000 kg.';
        const d = Number(f.depth);
        if (f.depth !== '' && (!(d >= 0) || d > 2000)) e.depth = 'Between 0 and 2,000 m.';
        return e;
      };

      const handle = (ev) => {
        ev.preventDefault();
        const e = validate();
        setErrors(e);
        const first = Object.keys(e)[0];
        if (first) {
          const el = document.getElementById(`gg-${first}`);
          if (el) el.focus();
          return;
        }
        const id = onSubmit(f);
        setFiledId(id);
        setF((prev) => ({ ...empty, state: prev.state, reporter: prev.reporter }));
        setGeo({ status: 'idle', message: '' });
        soundscape.playSonarPing();
      };

      const err = (k) => ({ 'aria-invalid': errors[k] ? 'true' : undefined, 'aria-describedby': errors[k] ? `gg-${k}-err` : undefined });

      return (
        <form onSubmit={handle} noValidate className="bg-[#F7F3EA] border border-ink/15 rounded-[3px] p-6 sm:p-7 space-y-5" aria-labelledby="gg-form-title">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-rust">File a sighting</p>
            <h3 id="gg-form-title" className="mt-2 font-serif text-[28px] leading-[1.05] text-ink">Seen a net that shouldn&apos;t be there?</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-ink/65">It goes straight into the log on the left. Port officers pick up new sightings from there.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field id="gg-state" label="State">
              <select id="gg-state" value={f.state} onChange={set('state')} className={`cursor-pointer ${paperInput}`}>
                {COASTAL_STATES.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <Field id="gg-debris" label="What is it">
              <select id="gg-debris" value={f.debris} onChange={set('debris')} className={`cursor-pointer ${paperInput}`}>
                {DEBRIS_TYPES.map((d) => <option key={d}>{d}</option>)}
              </select>
            </Field>
          </div>

          <Field id="gg-port" label="Harbour or stretch of coast" error={errors.port}>
            <input id="gg-port" type="text" value={f.port} onChange={set('port')} placeholder="Kasimedu outer channel, Chennai" className={paperInput} {...err('port')} />
          </Field>

          <Field
            id="gg-coords"
            label="Position"
            hint={
              <button type="button" onClick={locate} disabled={geo.status === 'loading'} className="inline-flex items-center gap-1 text-[12px] text-ink/70 hover:text-ink underline underline-offset-2 disabled:opacity-50">
                <Icon name="mapPin" className="w-3 h-3" />
                {geo.status === 'loading' ? 'Locating…' : 'Use my location'}
              </button>
            }
          >
            <input id="gg-coords" type="text" value={f.coords} onChange={set('coords')} placeholder="13.124° N, 80.296° E" className={`font-mono text-[14px] ${paperInput}`} aria-describedby="gg-geo" />
            <p id="gg-geo" role="status" className={`mt-1.5 text-[12px] ${geo.status === 'error' ? 'text-rust' : 'text-ink/55'}`}>{geo.message}</p>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field id="gg-weight" label="Rough weight (kg)" error={errors.weight}>
              <input id="gg-weight" type="number" inputMode="decimal" min="1" max="20000" value={f.weight} onChange={set('weight')} placeholder="250" className={`tnum ${paperInput}`} {...err('weight')} />
            </Field>
            <Field id="gg-depth" label="Depth (m)" error={errors.depth}>
              <input id="gg-depth" type="number" inputMode="decimal" min="0" max="2000" value={f.depth} onChange={set('depth')} placeholder="12" className={`tnum ${paperInput}`} {...err('depth')} />
            </Field>
          </div>

          <Field id="gg-reporter" label="Your name and boat">
            <input id="gg-reporter" type="text" value={f.reporter} onChange={set('reporter')} placeholder="T. Velu, Vallam 14" autoComplete="name" className={paperInput} />
          </Field>

          <Field id="gg-notes" label="Anything the retrieval crew should know">
            <textarea id="gg-notes" rows="3" value={f.notes} onChange={set('notes')} placeholder="Caught on rocks near the breakwater, propeller hazard at low tide" className={`h-auto py-2.5 resize-y ${paperInput}`}></textarea>
          </Field>

          <button type="submit" className="w-full h-12 rounded-[3px] bg-ink text-paper text-[14px] font-medium hover:bg-rust transition-colors">
            Add to the log
          </button>
          <p role="status" className="text-[13px] text-ink/75 min-h-[1.25rem]">
            {filedId && <>Logged as <span className="font-mono text-ink">{filedId}</span>. It&apos;s at the top of the log.</>}
          </p>
        </form>
      );
    };

    const GhostGearDesk = ({ reports, onAddReport }) => {
      const [filter, setFilter] = useState('all');
      const [query, setQuery] = useState('');
      const [justAddedId, setJustAddedId] = useState(null);

      const counts = useMemo(() => {
        const c = { all: reports.length, Dispatched: 0, Inspecting: 0, Cleared: 0 };
        reports.forEach((r) => { if (c[r.status] !== undefined) c[r.status] += 1; });
        return c;
      }, [reports]);

      const totals = useMemo(() => {
        const kg = reports.reduce((s, r) => s + (Number(r.weightKg) || 0), 0);
        const open = reports.filter((r) => r.status !== 'Cleared').length;
        return { kg, open, clearedPct: reports.length ? Math.round((counts.Cleared / reports.length) * 100) : 0 };
      }, [reports, counts]);

      const q = query.trim().toLowerCase();
      const visible = reports.filter((r) =>
        (filter === 'all' || r.status === filter) &&
        (!q || [r.id, r.portName, r.state, r.debrisType, r.reportedBy, r.notes].join(' ').toLowerCase().includes(q))
      );

      const handleAdd = (form) => {
        const id = onAddReport(form);
        setFilter('all');
        setQuery('');
        setJustAddedId(id);
        setTimeout(() => setJustAddedId((cur) => (cur === id ? null : cur)), 4000);
        return id;
      };

      const filters = [['all', 'All'], ['Dispatched', 'Dispatched'], ['Inspecting', 'Being checked'], ['Cleared', 'Cleared']];

      return (
        <section id="ghost-gear" className="bg-paper text-ink py-24 sm:py-28">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <SectionHead
              tone="paper"
              index="05"
              kicker="Ghost gear desk"
              title="The log of nets still out there."
              dek="Fishers, port staff and volunteers file what they see. Retrieval boats work from this list, oldest danger first."
            />

            <dl className="grid grid-cols-3 border-y border-ink/15 divide-x divide-ink/15 mb-10">
              {[
                ['Still in the water', totals.open, ''],
                ['Weight reported', totals.kg, 'kg'],
                ['Cleared so far', totals.clearedPct, '%'],
              ].map(([l, v, u]) => (
                <div key={l} className="py-5 px-4 sm:px-6 first:pl-0">
                  <dt className="text-[12px] text-ink/55">{l}</dt>
                  <dd className="mt-2 font-serif text-[34px] sm:text-[44px] leading-none tnum">
                    <AnimatedNumber value={v} />
                    {u && <span className="ml-1 font-sans text-[14px] text-ink/50">{u}</span>}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              <div className="lg:col-span-8 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-1 overflow-x-auto scrollbar-none" role="group" aria-label="Filter by status">
                    {filters.map(([k, l]) => (
                      <button
                        key={k}
                        onClick={() => setFilter(k)}
                        aria-pressed={filter === k}
                        className={`shrink-0 h-8 px-3 rounded-[3px] text-[13px] transition-colors ${filter === k ? 'bg-ink text-paper' : 'text-ink/65 hover:text-ink hover:bg-ink/[0.05]'}`}
                      >
                        {l} <span className={`ml-1 font-mono text-[11px] tnum ${filter === k ? 'text-paper/60' : 'text-ink/40'}`}>{counts[k]}</span>
                      </button>
                    ))}
                  </div>
                  <div className="relative sm:w-60">
                    <label htmlFor="gg-search" className="sr-only">Search the log</label>
                    <Icon name="search" className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
                    <input id="gg-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search port, boat, ID" className={`!h-9 pl-8 text-[13px] ${paperInput}`} />
                  </div>
                </div>

                <div className="border-t-2 border-ink">
                  {visible.length === 0 ? (
                    <p className="py-16 text-center text-[14px] text-ink/55">Nothing in the log matches that. Try another word or clear the filter.</p>
                  ) : (
                    <ol className="divide-y divide-ink/12" aria-live="polite">
                      {visible.map((r) => {
                        const meta = STATUS_META[r.status] || STATUS_META.Inspecting;
                        const fresh = r.id === justAddedId;
                        return (
                          <li key={r.id} className={`grid grid-cols-12 gap-x-4 gap-y-2 py-5 px-2 -mx-2 transition-colors duration-1000 ${fresh ? 'bg-[#EAD9B4]' : ''}`}>
                            <div className="col-span-12 sm:col-span-3">
                              <p className="font-mono text-[12px] text-ink">{r.id}</p>
                              <p className="mt-1 font-mono text-[11px] text-ink/50 tnum">{r.timestamp}</p>
                              <p className="mt-2 inline-flex items-center gap-1.5 text-[12px] text-ink/75">
                                <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} aria-hidden="true"></span>
                                {meta.label}
                              </p>
                            </div>
                            <div className="col-span-8 sm:col-span-7 min-w-0">
                              <p className="text-[15px] text-ink">{r.portName}</p>
                              <p className="mt-0.5 text-[13px] text-ink/65">{r.debrisType}</p>
                              {r.notes && <p className="mt-2 text-[13px] leading-relaxed text-ink/60 line-clamp-2">{r.notes}</p>}
                              <p className="mt-2 text-[12px] text-ink/45">{r.reportedBy}{r.coordinates ? <> &middot; <span className="font-mono">{r.coordinates}</span></> : null}</p>
                            </div>
                            <div className="col-span-4 sm:col-span-2 text-right">
                              <p className="font-serif text-[26px] leading-none tnum">{inr(r.weightKg)}<span className="ml-0.5 font-sans text-[12px] text-ink/50">kg</span></p>
                              {r.depthMeters !== '' && r.depthMeters != null && <p className="mt-1.5 font-mono text-[11px] text-ink/50">{r.depthMeters} m down</p>}
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  )}
                </div>
              </div>

              <div className="lg:col-span-4 lg:sticky lg:top-28">
                <ReportForm onSubmit={handleAdd} />
              </div>
            </div>
          </div>
        </section>
      );
    };

    /* ========================================================================
       11. POLICY — FIVE-YEAR PROJECTION
       ======================================================================== */
    const projectPolicy = (epr, ports, subsidy) => {
      const score = epr * 0.4 + ports * 0.4 + subsidy * 0.2;
      return {
        tons: Math.round(18000 + score * 420),
        savings: Math.round(420 + score * 28.5),
        habitat: Math.min(94, Math.round(35 + score * 0.6)),
      };
    };
    const POLICY_BASE = projectPolicy(40, 55, 30);
    const POLICY_MAX = projectPolicy(100, 100, 80);

    const Slider = ({ id, label, note, value, min, max, onChange, suffix }) => (
      <div>
        <div className="flex items-baseline justify-between gap-4">
          <label htmlFor={id} className="text-[14px] text-txt-primary">{label}</label>
          <output htmlFor={id} className="font-mono text-[13px] tnum text-acc-secondary">{value}{suffix}</output>
        </div>
        <input
          id={id} type="range" min={min} max={max} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="mt-3 w-full jt-range"
          style={{ '--fill': `${((value - min) / (max - min)) * 100}%` }}
        />
        <p className="mt-1.5 text-[12px] leading-relaxed text-txt-tertiary">{note}</p>
      </div>
    );

    const PolicyHub = () => {
      const [epr, setEpr] = useState(40);
      const [ports, setPorts] = useState(55);
      const [subsidy, setSubsidy] = useState(30);
      const now = useMemo(() => projectPolicy(epr, ports, subsidy), [epr, ports, subsidy]);
      const changed = epr !== 40 || ports !== 55 || subsidy !== 30;

      const years = [2027, 2028, 2029, 2030, 2031].map((y, i) => {
        const f = Math.pow((i + 1) / 5, 1.35);
        return { y, v: now.tons * f, b: POLICY_BASE.tons * f };
      });
      const delta = now.tons - POLICY_BASE.tons;

      return (
        <section id="policy-hub" className="py-24 sm:py-28">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <SectionHead
              index="06"
              kicker="Policy"
              title="This can&apos;t rest on fishers alone."
              dek="Kerala already has a model that works. Move the three levers below to see what scaling it up could do by 2031."
            />

            <figure className="grid grid-cols-1 lg:grid-cols-12 gap-10 pb-16 mb-16 border-b border-white/[0.08]">
              <blockquote className="lg:col-span-8">
                <p className="font-serif text-[28px] sm:text-[38px] leading-[1.18] text-white text-pretty">
                  At Kollam and Munambam, trawlers keep room in the hold for the plastic they pull up. Ashore it is shredded, mixed into bitumen, and laid as road.
                </p>
                <figcaption className="mt-5 text-[14px] text-txt-secondary">
                  Suchitwa Sagaram (Clean Sea), Kerala, run with Clean Kerala Company. Over 120 km of highway so far.
                </figcaption>
              </blockquote>
              <dl className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 gap-8 lg:border-l border-white/[0.08] lg:pl-10 self-end">
                <div>
                  <dt className="text-[12px] text-txt-tertiary">Plastic shredded</dt>
                  <dd className="mt-2 font-serif text-[40px] leading-none text-white tnum">14,800<span className="ml-1 font-sans text-[14px] text-txt-tertiary">t</span></dd>
                </div>
                <div>
                  <dt className="text-[12px] text-txt-tertiary">Boats taking part</dt>
                  <dd className="mt-2 font-serif text-[40px] leading-none text-white tnum">4,200</dd>
                </div>
              </dl>
            </figure>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-5 space-y-8">
                <Slider id="pol-epr" label="Producers buy back used packaging" suffix="%" value={epr} min={10} max={100} onChange={setEpr} note="Extended Producer Responsibility. Brands fund buy-back points at harbours." />
                <Slider id="pol-ports" label="Ports with a place to drop old nets" suffix="%" value={ports} min={15} max={100} onChange={setPorts} note="Free bins and shredders at India's 1,265 landing centres (MARPOL Annex V)." />
                <Slider id="pol-sub" label="Subsidy on biodegradable twine" suffix="%" value={subsidy} min={0} max={80} onChange={setSubsidy} note="PHA and PBSA twine in place of nylon monofilament." />
                <button
                  onClick={() => { setEpr(40); setPorts(55); setSubsidy(30); }}
                  disabled={!changed}
                  className="text-[13px] text-txt-secondary hover:text-white underline underline-offset-4 disabled:opacity-40 disabled:no-underline"
                >
                  Reset to today&apos;s settings
                </button>
              </div>

              <div className="lg:col-span-7">
                <dl className="grid grid-cols-3 border-y border-white/[0.08] divide-x divide-white/[0.08]">
                  {[
                    ['Plastic out of the sea', now.tons, 't', inr],
                    ['Saved on net repairs', now.savings, 'cr', (v) => `₹${inr(v)}`],
                    ['Seabed health', now.habitat, '/ 100', inr],
                  ].map(([l, v, u, fmt]) => (
                    <div key={l} className="py-5 px-4 first:pl-0">
                      <dt className="text-[12px] text-txt-tertiary">{l}</dt>
                      <dd className="mt-2 tnum text-[26px] sm:text-[32px] font-light tracking-[-0.02em] text-white leading-none">
                        <AnimatedNumber value={v} format={fmt} />
                        <span className="ml-1 text-[12px] text-txt-tertiary">{u}</span>
                      </dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-8">
                  <div className="flex items-baseline justify-between gap-4 text-[12px]">
                    <span className="text-txt-secondary">Plastic recovered, cumulative tonnes</span>
                    <span className={`font-mono tnum ${delta > 0 ? 'text-acc-green' : delta < 0 ? 'text-acc-gold' : 'text-txt-tertiary'}`}>
                      {delta === 0 ? 'Same as today' : `${delta > 0 ? '+' : '−'}${inr(Math.abs(delta))} t vs today`}
                    </span>
                  </div>
                  <div className="mt-5 h-60 flex items-end gap-3 sm:gap-5 border-b border-white/15" role="img" aria-label={`Projected ${inr(now.tons)} tonnes recovered by 2031`}>
                    {years.map((yr) => (
                      <div key={yr.y} className="relative flex-1 h-full flex items-end">
                        <span className="absolute inset-x-0 bottom-0 border border-dashed border-white/25" style={{ height: `${(yr.b / POLICY_MAX.tons) * 100}%` }} aria-hidden="true"></span>
                        <span className="relative w-full bg-acc-secondary/90 transition-all duration-500 ease-out" style={{ height: `${(yr.v / POLICY_MAX.tons) * 100}%` }}></span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex gap-3 sm:gap-5 font-mono text-[11px] text-txt-tertiary tnum">
                    {years.map((yr) => <span key={yr.y} className="flex-1 text-center">{yr.y}</span>)}
                  </div>
                  <p className="mt-4 flex items-center gap-5 text-[12px] text-txt-tertiary">
                    <span className="inline-flex items-center gap-2"><span className="w-3 h-2 bg-acc-secondary/90" aria-hidden="true"></span>Your settings</span>
                    <span className="inline-flex items-center gap-2"><span className="w-3 h-2 border border-dashed border-white/40" aria-hidden="true"></span>Today&apos;s settings</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      );
    };

    /* ========================================================================
       12. FOOTER
       ======================================================================== */
    const Footer = () => {
      const sources = [
        'ICAR-Central Marine Fisheries Research Institute',
        'CSIR-National Institute of Oceanography',
        'Marine Products Export Development Authority',
        'National Centre for Coastal Research, MoES',
      ];
      return (
        <footer className="border-t border-white/[0.06] bg-[#0A0D0E]">
          <div className="mx-auto max-w-6xl px-5 sm:px-8 pt-20 pb-10">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
              <div className="md:col-span-5">
                <p className="font-serif text-[56px] leading-none text-white">Jal-Tarang</p>
                <p className="mt-5 max-w-sm text-[14px] leading-relaxed text-txt-secondary">
                  An open record of plastic in India&apos;s fishing waters, kept for the people who work them and the people who write the rules.
                </p>
                <p className="mt-6 text-[13px] text-txt-tertiary">Part of Mission LiFE &middot; Swachh Sagar, Surakshit Sagar</p>
              </div>
              <nav aria-label="Footer" className="md:col-span-3">
                <h3 className="font-mono text-[10px] uppercase tracking-[0.16em] text-txt-tertiary">On this site</h3>
                <ul className="mt-5 space-y-3">
                  {SECTIONS.slice(1).map((s) => (
                    <li key={s.id}>
                      <a href={`#${s.id}`} onClick={(e) => { e.preventDefault(); scrollToId(s.id); }} className="text-[14px] text-txt-muted hover:text-white transition-colors">{s.label}</a>
                    </li>
                  ))}
                </ul>
              </nav>
              <div className="md:col-span-4">
                <h3 className="font-mono text-[10px] uppercase tracking-[0.16em] text-txt-tertiary">Where the numbers come from</h3>
                <ul className="mt-5 space-y-3">
                  {sources.map((s) => <li key={s} className="text-[14px] leading-snug text-txt-muted">{s}</li>)}
                </ul>
                <p className="mt-6 text-[12px] leading-relaxed text-txt-tertiary">
                  Figures come from published field surveys. Anything we model, such as the monsoon surge, is labelled as a model.
                </p>
              </div>
            </div>
            <div className="mt-20 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[12px] text-txt-tertiary">
              <span>&copy; 2026 Jal-Tarang Initiative</span>
              <span>Made for India&apos;s coastal fishing communities.</span>
            </div>
          </div>
        </footer>
      );
    };

    /* ========================================================================
       13. DEBRIS INSPECTOR DIALOG
       ======================================================================== */
    const DEBRIS_COMPOSITION = [
      { name: 'Nylon monofilament and old trawl webbing', share: 41.8, color: '#E8A33D', note: 'Wraps propellers, traps Olive Ridley turtles and young fish, and drags across reefs.' },
      { name: 'Food packaging and polythene bags', share: 29.4, color: '#D7704A', note: 'Washed down the river mouths. Clogs gillnets and slows down sorting the catch.' },
      { name: 'Thermocol floats and crates', share: 17.2, color: '#7FA6B8', note: 'Breaks up in the surf into floating beads that surface shoals swallow.' },
      { name: 'Hard crates, drums and cable', share: 11.6, color: '#A99BC0', note: 'Heavy enough to tear cod-ends and hole wooden hulls in rough water.' },
    ];

    const DebrisInspector = ({ onClose }) => {
      const closeRef = useRef(null);
      useEffect(() => {
        const prev = document.activeElement;
        if (closeRef.current) closeRef.current.focus();
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
          document.removeEventListener('keydown', onKey);
          document.body.style.overflow = '';
          if (prev && prev.focus) prev.focus();
        };
      }, [onClose]);

      return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6 bg-black/70 backdrop-blur-sm" onClick={onClose}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="debris-title"
            onClick={(e) => e.stopPropagation()}
            className="jt-fade w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-paper text-ink rounded-t-[6px] sm:rounded-[3px] p-6 sm:p-9"
          >
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-rust">Recovered from nets &middot; ICAR-CMFRI</p>
                <h3 id="debris-title" className="mt-3 font-serif text-[34px] sm:text-[42px] leading-[1] text-balance">What comes up with the catch</h3>
              </div>
              <button ref={closeRef} onClick={onClose} aria-label="Close" className="shrink-0 w-9 h-9 flex items-center justify-center rounded-[3px] text-ink/60 hover:text-ink hover:bg-ink/[0.06]">
                <Icon name="close" className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-8 flex h-3 overflow-hidden rounded-[1px]" aria-hidden="true">
              {DEBRIS_COMPOSITION.map((d) => <span key={d.name} style={{ width: `${d.share}%`, backgroundColor: d.color }}></span>)}
            </div>

            <ol className="mt-6 divide-y divide-ink/12 border-t border-ink">
              {DEBRIS_COMPOSITION.map((d, i) => (
                <li key={d.name} className="grid grid-cols-12 gap-4 py-5">
                  <span className="col-span-1 font-mono text-[11px] text-ink/45 pt-1">{String(i + 1).padStart(2, '0')}</span>
                  <div className="col-span-8">
                    <p className="flex items-center gap-2 text-[15px] font-medium">
                      <span className="w-2 h-2 rounded-[1px]" style={{ backgroundColor: d.color }} aria-hidden="true"></span>
                      {d.name}
                    </p>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-ink/65">{d.note}</p>
                  </div>
                  <p className="col-span-3 text-right font-serif text-[30px] leading-none tnum">{d.share}<span className="font-sans text-[13px] text-ink/50">%</span></p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      );
    };

    /* ========================================================================
       14. APP
       ======================================================================== */
    function App() {
      const [soundActive, setSoundActive] = useState(false);
      const [selectedLang, setSelectedLang] = useState('en');
      const [monsoonSurge, setMonsoonSurge] = useState(false);
      const [showDebris, setShowDebris] = useState(false);
      const [reports, setReports] = useState(INITIAL_REPORTS);

      const handleToggleSound = () => {
        if (soundActive) {
          soundscape.stopOceanSurf();
          setSoundActive(false);
        } else {
          soundscape.startOceanSurf(0.08);
          soundscape.playSonarPing();
          setSoundActive(true);
        }
      };

      const handleToggleMonsoon = () => {
        soundscape.playSonarPing();
        setMonsoonSurge((p) => !p);
      };

      const addReport = (f) => {
        const state = COASTAL_STATES.find((s) => s.id === f.state) || COASTAL_STATES[0];
        const maxNum = Math.max(0, ...reports.map((r) => Number(String(r.id).split('-')[2]) || 0));
        const id = `GG-2026-${String(maxNum + 1).padStart(3, '0')}`;
        const report = {
          id,
          timestamp: istStamp(),
          portName: f.port.trim().includes(state.name) ? f.port.trim() : `${f.port.trim()}, ${state.name}`,
          coordinates: f.coords.trim(),
          state: state.name,
          debrisType: f.debris,
          weightKg: Number(f.weight),
          depthMeters: f.depth === '' ? '' : Number(f.depth),
          reportedBy: f.reporter.trim() || 'Unnamed reporter',
          status: 'Inspecting',
          severity: 'Pending verification',
          notes: f.notes.trim(),
          verifiedBy: 'Awaiting port officer',
        };
        setReports((prev) => [report, ...prev]);
        return id;
      };

      const goReport = () => {
        scrollToId('ghost-gear');
        setTimeout(() => {
          const el = document.getElementById('gg-port');
          if (el) el.focus({ preventScroll: true });
        }, 700);
      };

      const openCount = reports.filter((r) => r.status !== 'Cleared').length;

      return (
        <div className="min-h-screen bg-bg-secondary text-txt-primary flex flex-col">
          <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-white focus:text-ink focus:px-3 focus:py-2 focus:rounded-[3px]">Skip to content</a>
          <Masthead
            soundActive={soundActive}
            onToggleSound={handleToggleSound}
            monsoonSurge={monsoonSurge}
            onToggleMonsoon={handleToggleMonsoon}
            selectedLang={selectedLang}
            onChangeLang={setSelectedLang}
            openCount={openCount}
            onReport={goReport}
          />
          <main id="main" className="flex-1">
            <Hero monsoonSurge={monsoonSurge} onInspectDebris={() => setShowDebris(true)} latestReport={reports[0]} reportCount={reports.length} />
            <DocumentaryPlayer selectedLang={selectedLang} />
            <CoastalHotspotMap monsoonSurge={monsoonSurge} reports={reports} />
            <EconomicLossLedger monsoonSurge={monsoonSurge} />
            <TrophicSimulator />
            <GhostGearDesk reports={reports} onAddReport={addReport} />
            <PolicyHub />
          </main>
          <Footer />
          {showDebris && <DebrisInspector onClose={() => setShowDebris(false)} />}
        </div>
      );
    }

    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<App />);
  </script>
</body>
</html>
