
    /* ========================================================================
       7. COAST MAP — STATE INDEX, LEAFLET MAP, DOSSIER
       ======================================================================== */
    const pinIcon = (active) => window.L.divIcon({
      className: 'jt-pin-wrap',
      html: `<span class="jt-pin${active ? ' is-active' : ''}"></span>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    const CoastalHotspotMap = ({ monsoonSurge, reports }) => {
      const [selectedStateId, setSelectedStateId] = useState('kerala');
      const mapContainerRef = useRef(null);
      const leafletMapRef = useRef(null);
      const markersRef = useRef({});
      const mult = monsoonSurge ? 2.8 : 1;

      const activeState = COASTAL_STATES.find((s) => s.id === selectedStateId) || COASTAL_STATES[0];
      const openHere = reports.filter((r) => r.state === activeState.name && r.status !== 'Cleared').length;
      const maxDensity = Math.max(...COASTAL_STATES.map((s) => s.plasticDensityIndex));

      const select = (id) => {
        setSelectedStateId(id);
        soundscape.playSonarPing();
      };

      useEffect(() => {
        if (!mapContainerRef.current || leafletMapRef.current || !window.L) return;
        const map = window.L.map(mapContainerRef.current, {
          center: [15.5, 79], zoom: 5, minZoom: 4, maxZoom: 9, scrollWheelZoom: false, attributionControl: true,
        });
        window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OpenStreetMap &copy; CARTO', subdomains: 'abcd', maxZoom: 19,
        }).addTo(map);

        COASTAL_STATES.forEach((state) => {
          const marker = window.L.marker([state.coordinates.lat, state.coordinates.lng], { icon: pinIcon(state.id === 'kerala'), keyboard: true, title: state.name })
            .addTo(map)
            .bindTooltip(state.name, { direction: 'top', offset: [0, -8], className: 'jt-tip' });
          marker.on('click', () => select(state.id));
          markersRef.current[state.id] = marker;
        });

        leafletMapRef.current = map;
        const t = setTimeout(() => map.invalidateSize(), 250);
        return () => clearTimeout(t);
      }, []);

      useEffect(() => {
        const map = leafletMapRef.current;
        if (!map) return;
        Object.entries(markersRef.current).forEach(([id, m]) => m.setIcon(pinIcon(id === selectedStateId)));
        map.flyTo([activeState.coordinates.lat, activeState.coordinates.lng], 6.5, { duration: 1.1 });
      }, [selectedStateId]);

      return (
        <section id="coastal-map" className="py-24 sm:py-28 border-b border-white/[0.06]">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <SectionHead
              index="02"
              kicker="Coast map"
              title="Nine states, and a different mess at every harbour."
              dek="Pick a harbour on the map or from the index. Each has its own mix of plastic, its own fish at risk, and its own field record."
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 border border-white/[0.08] rounded-[3px] overflow-hidden">
              <ol className="lg:col-span-3 flex lg:flex-col overflow-x-auto scrollbar-none border-b lg:border-b-0 lg:border-r border-white/[0.08]" aria-label="Coastal states">
                {COASTAL_STATES.map((s, i) => {
                  const on = s.id === selectedStateId;
                  return (
                    <li key={s.id} className="shrink-0 lg:shrink border-r lg:border-r-0 lg:border-b last:border-0 border-white/[0.06]">
                      <button
                        onClick={() => select(s.id)}
                        aria-pressed={on}
                        className={`w-full text-left px-4 py-3.5 transition-colors ${on ? 'bg-white/[0.05]' : 'hover:bg-white/[0.025]'}`}
                      >
                        <span className="flex items-baseline gap-3">
                          <span className={`font-mono text-[10px] tnum ${on ? 'text-acc-secondary' : 'text-txt-tertiary'}`}>{String(i + 1).padStart(2, '0')}</span>
                          <span className={`text-[14px] whitespace-nowrap ${on ? 'text-white' : 'text-txt-muted'}`}>{s.name}</span>
                          <span className="ml-auto pl-3 font-mono text-[11px] tnum text-txt-tertiary">{s.plasticDensityIndex}</span>
                        </span>
                        <span className="hidden lg:block mt-2 ml-[26px] h-[2px] bg-white/[0.06]" aria-hidden="true">
                          <span className={`block h-full transition-all duration-500 ${on ? 'bg-acc-secondary' : 'bg-white/20'}`} style={{ width: `${(s.plasticDensityIndex / maxDensity) * 100}%` }}></span>
                        </span>
                      </button>
                    </li>
                  );
                })}
                <li className="hidden lg:block px-4 py-3 mt-auto font-mono text-[10px] leading-relaxed text-txt-tertiary">
                  Figure on the right is the plastic density index (CMFRI). Higher means more litter per haul.
                </li>
              </ol>

              <div className="lg:col-span-5 relative border-b lg:border-b-0 lg:border-r border-white/[0.08]">
                <div ref={mapContainerRef} className="w-full h-[360px] lg:h-full lg:min-h-[640px]" role="application" aria-label="Map of India's coastal fishing hubs"></div>
                <p className="pointer-events-none absolute left-3 top-3 z-[500] font-mono text-[10px] text-txt-muted bg-ink/80 backdrop-blur px-2 py-1 rounded-sm tnum">
                  {activeState.coordinates.lat.toFixed(3)}&deg;N &middot; {activeState.coordinates.lng.toFixed(3)}&deg;E
                </p>
              </div>

              <article key={activeState.id} className="jt-fade lg:col-span-4 p-6 sm:p-7 bg-bg-primary" aria-live="polite">
                <div className="relative h-40 -mx-6 sm:-mx-7 -mt-6 sm:-mt-7 mb-6 overflow-hidden">
                  <img src={activeState.photoUrl} alt={`Fishing harbour in ${activeState.name}`} className="w-full h-full object-cover" crossOrigin="anonymous" />
                  <div className="absolute inset-0 bg-gradient-to-t from-bg-primary to-transparent" aria-hidden="true"></div>
                </div>

                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-acc-secondary">State dossier</p>
                <h3 className="mt-2 font-serif text-[34px] leading-none text-white">{activeState.name}</h3>
                <p className="mt-2 text-[13px] text-txt-secondary">{activeState.hub}</p>

                <dl className="mt-6 grid grid-cols-3 border-y border-white/[0.08] divide-x divide-white/[0.08]">
                  {[
                    ['Coastline', `${activeState.coastlineKm}`, 'km'],
                    ['Landed', inr(activeState.annualDebrisLandingTons * mult), 't / yr'],
                    ['Open reports', String(openHere), ''],
                  ].map(([l, v, u]) => (
                    <div key={l} className="py-3 px-3 first:pl-0">
                      <dt className="text-[11px] text-txt-tertiary">{l}</dt>
                      <dd className={`mt-1 tnum text-[17px] ${l === 'Landed' && monsoonSurge ? 'text-acc-gold' : 'text-white'}`}>
                        {v}<span className="ml-1 text-[11px] text-txt-tertiary">{u}</span>
                      </dd>
                    </div>
                  ))}
                </dl>

                <h4 className="mt-6 text-[12px] text-txt-secondary">What&apos;s in the nets</h4>
                <div className="mt-3 flex h-2 overflow-hidden rounded-[1px]" aria-hidden="true">
                  {activeState.debrisBreakdown.map((d) => (
                    <span key={d.name} className="h-full transition-all duration-500" style={{ width: `${d.value}%`, backgroundColor: d.color }}></span>
                  ))}
                </div>
                <ul className="mt-3 space-y-1.5">
                  {activeState.debrisBreakdown.map((d) => (
                    <li key={d.name} className="flex items-center gap-2.5 text-[13px]">
                      <span className="w-2 h-2 rounded-[1px] shrink-0" style={{ backgroundColor: d.color }} aria-hidden="true"></span>
                      <span className="text-txt-muted truncate">{d.name}</span>
                      <span className="ml-auto font-mono text-[12px] tnum text-white">{d.value}%</span>
                    </li>
                  ))}
                </ul>

                <h4 className="mt-7 text-[12px] text-txt-secondary">Fish carrying plastic in the gut</h4>
                <table className="mt-2 w-full text-[13px]">
                  <thead className="sr-only">
                    <tr><th>Species</th><th>Share with plastic in gut</th><th>Risk</th></tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {activeState.commercialSpecies.map((f) => {
                      const high = f.risk.toLowerCase().includes('high');
                      return (
                        <tr key={f.name}>
                          <td className="py-2.5 pr-2">
                            <span className="text-white">{f.name}</span>
                            <span className="block text-[11px] text-txt-tertiary"><i>{f.scientific}</i> &middot; {f.local}</span>
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono tnum text-white">{f.gutLoadPct}%</td>
                          <td className="py-2.5 pl-2 text-right">
                            <span className={`inline-flex items-center gap-1.5 text-[11px] ${high ? 'text-acc-gold' : 'text-acc-green'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${high ? 'bg-acc-gold' : 'bg-acc-green'}`} aria-hidden="true"></span>
                              {high ? 'High' : f.risk.split(' ')[0]}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <blockquote className="mt-7 border-l-2 border-acc-secondary pl-4">
                  <p className="font-serif text-[19px] leading-[1.35] text-txt-primary">{activeState.caseStudy}</p>
                  <footer className="mt-3 text-[11px] leading-relaxed text-txt-tertiary">{activeState.citation}</footer>
                </blockquote>
              </article>
            </div>
          </div>
        </section>
      );
    };

    /* ========================================================================
       8. LOSS LEDGER — PAPER WORKSHEET
       ======================================================================== */
    const paperInput = 'w-full h-11 px-3 bg-[#F7F3EA] border border-ink/20 rounded-[3px] text-[15px] text-ink placeholder:text-ink/35 outline-none transition-colors focus:border-ink focus:ring-2 focus:ring-ink/10 aria-[invalid=true]:border-rust';

    const EconomicLossLedger = ({ monsoonSurge }) => {
      const [selectedStateId, setSelectedStateId] = useState('kerala');
      const [selectedBoatId, setSelectedBoatId] = useState('motorized');
      const [weeklyTrips, setWeeklyTrips] = useState(5);
      const [hourValue, setHourValue] = useState('250');
      const [crewEarnings, setCrewEarnings] = useState('120000');

      const stateData = COASTAL_STATES.find((s) => s.id === selectedStateId) || COASTAL_STATES[0];
      const boatData = BOAT_TYPES.find((b) => b.id === selectedBoatId) || BOAT_TYPES[1];
      const hv = clamp(Number(hourValue) || 0, 0, 10000);
      const earnings = clamp(Number(crewEarnings) || 0, 0, 10000000);

      const c = useMemo(() => {
        const monsoonMult = monsoonSurge ? 2.4 : 1;
        const density = stateData.plasticDensityIndex / 70;
        const tripsPerMonth = weeklyTrips * 4.33;
        const netRepair = Math.round(boatData.monthlyNetMaintenanceBase * density * boatData.debrisVulnerabilityFactor * (weeklyTrips / 4) * monsoonMult);
        const hoursPerTrip = (boatData.id === 'mechanized' ? 2.8 : boatData.id === 'motorized' ? 1.9 : 1.1) * density * monsoonMult;
        const hours = Math.round(hoursPerTrip * tripsPerMonth);
        const catchLoss = Math.min(32, Math.round((boatData.id === 'mechanized' ? 14 : 9) * density * (monsoonSurge ? 1.6 : 1)));
        const fuel = Math.round((boatData.id === 'mechanized' ? 8400 : boatData.id === 'motorized' ? 2900 : 400) * density * (weeklyTrips / 4) * monsoonMult);
        const time = hours * hv;
        const monthly = netRepair + fuel + time;
        return { netRepair, hours, catchLoss, fuel, time, monthly, annual: monthly * 12, trips: Math.round(tripsPerMonth) };
      }, [stateData, boatData, weeklyTrips, monsoonSurge, hv]);

      const monthsOfPay = earnings > 0 ? c.annual / earnings : 0;
      const parts = [
        { k: 'Net mending and panel replacement', v: c.netRepair, color: '#A8492A' },
        { k: 'Extra diesel from propeller drag', v: c.fuel, color: '#C9892B' },
        { k: `Time clearing nets, ${c.hours} h at ₹${inr(hv)}`, v: c.time, color: '#3E5A66' },
      ];

      const handleExportPDF = () => {
        soundscape.playSonarPing();
        if (!window.jspdf || !window.jspdf.jsPDF) return;
        const doc = new window.jspdf.jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        doc.setFillColor(238, 232, 220);
        doc.rect(0, 0, 210, 297, 'F');
        doc.setTextColor(14, 18, 19);
        doc.setFont('times', 'normal');
        doc.setFontSize(26);
        doc.text('Jal-Tarang', 18, 26);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(90, 90, 85);
        doc.text('Loss ledger for one boat', 18, 33);
        doc.text(`Prepared ${new Date().toLocaleString('en-IN')}`, 192, 33, { align: 'right' });
        doc.setDrawColor(14, 18, 19);
        doc.line(18, 37, 192, 37);

        const rows = [
          ['State', `${stateData.name} (${stateData.hub})`],
          ['Boat', boatData.name],
          ['Trips', `${weeklyTrips} days a week, about ${c.trips} a month`],
          ['Value of an hour at sea', `Rs. ${inr(hv)}`],
          ['Season', monsoonSurge ? 'Monsoon surge model (2.4x)' : 'Normal weather'],
        ];
        doc.setFontSize(10);
        rows.forEach(([k, v], i) => {
          doc.setTextColor(90, 90, 85); doc.text(k, 18, 50 + i * 7);
          doc.setTextColor(14, 18, 19); doc.text(v, 70, 50 + i * 7);
        });

        doc.line(18, 90, 192, 90);
        parts.forEach((p, i) => {
          doc.text(p.k.replace('₹', 'Rs. '), 18, 100 + i * 8);
          doc.text(`Rs. ${inr(p.v)} / month`, 192, 100 + i * 8, { align: 'right' });
        });
        doc.text(`Catch lost per haul`, 18, 124);
        doc.text(`${c.catchLoss}%`, 192, 124, { align: 'right' });
        doc.line(18, 130, 192, 130);
        doc.setFontSize(12);
        doc.text('Each month', 18, 140);
        doc.text(`Rs. ${inr(c.monthly)}`, 192, 140, { align: 'right' });
        doc.setFontSize(16);
        doc.setTextColor(168, 73, 42);
        doc.text('Over a year', 18, 152);
        doc.text(`Rs. ${inr(c.annual)}`, 192, 152, { align: 'right' });
        doc.setFontSize(8);
        doc.setTextColor(90, 90, 85);
        doc.text('Model based on ICAR-CMFRI field surveys. Figures are estimates for one boat.', 18, 285);
        doc.save(`jal-tarang-loss-ledger-${stateData.id}-${boatData.id}.pdf`);
      };

      return (
        <section id="economic-calculator" className="bg-paper text-ink py-24 sm:py-28">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <SectionHead
              tone="paper"
              index="03"
              kicker="Loss ledger"
              title="What one boat loses to plastic, line by line."
              dek="Fill in your own boat. The ledger on the right updates as you go, and you can take a printed copy to a cooperative or panchayat meeting."
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
              <form className="lg:col-span-5 space-y-8" onSubmit={(e) => e.preventDefault()} aria-label="Your boat">
                <div>
                  <label htmlFor="ledger-state" className="text-[13px] font-medium">Where you fish</label>
                  <select id="ledger-state" value={selectedStateId} onChange={(e) => setSelectedStateId(e.target.value)} className={`mt-1.5 cursor-pointer ${paperInput}`}>
                    {COASTAL_STATES.map((s) => <option key={s.id} value={s.id}>{s.name} &mdash; {s.hub}</option>)}
                  </select>
                </div>

                <fieldset>
                  <legend className="text-[13px] font-medium">Your boat</legend>
                  <div className="mt-2 border border-ink/15 rounded-[3px] divide-y divide-ink/10 bg-[#F7F3EA]">
                    {BOAT_TYPES.map((b) => {
                      const on = b.id === selectedBoatId;
                      return (
                        <label key={b.id} className={`flex gap-3 p-4 cursor-pointer transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ink ${on ? 'bg-ink text-paper' : 'hover:bg-ink/[0.03]'}`}>
                          <input type="radio" name="boat" value={b.id} checked={on} onChange={() => setSelectedBoatId(b.id)} className="sr-only" />
                          <span className={`mt-1 w-3.5 h-3.5 shrink-0 rounded-full border flex items-center justify-center ${on ? 'border-paper' : 'border-ink/40'}`} aria-hidden="true">
                            {on && <span className="w-1.5 h-1.5 rounded-full bg-paper"></span>}
                          </span>
                          <span className="min-w-0">
                            <span className="flex items-baseline justify-between gap-3">
                              <span className="text-[14px] font-medium">{b.name}</span>
                              <span className={`font-mono text-[11px] shrink-0 ${on ? 'text-paper/70' : 'text-ink/50'}`}>{b.crewSize}</span>
                            </span>
                            <span className={`mt-1 block text-[12px] leading-snug ${on ? 'text-paper/70' : 'text-ink/60'}`}>{b.regionalTerms}</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>

                <div>
                  <div className="flex items-baseline justify-between">
                    <label htmlFor="ledger-trips" className="text-[13px] font-medium">Days at sea each week</label>
                    <output htmlFor="ledger-trips" className="font-mono text-[13px] tnum">{weeklyTrips} {weeklyTrips === 1 ? 'day' : 'days'}</output>
                  </div>
                  <input
                    id="ledger-trips" type="range" min="1" max="7" value={weeklyTrips}
                    onChange={(e) => setWeeklyTrips(Number(e.target.value))}
                    className="mt-3 w-full jt-range paper-range"
                    style={{ '--fill': `${((weeklyTrips - 1) / 6) * 100}%` }}
                  />
                  <div className="mt-1 flex justify-between font-mono text-[10px] text-ink/45"><span>1</span><span>4</span><span>7</span></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="ledger-hour" className="text-[13px] font-medium">An hour at sea is worth</label>
                    <div className="relative mt-1.5">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/50" aria-hidden="true">₹</span>
                      <input id="ledger-hour" inputMode="numeric" type="number" min="0" max="10000" value={hourValue} onChange={(e) => setHourValue(e.target.value)} className={`pl-7 tnum ${paperInput}`} />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="ledger-earn" className="text-[13px] font-medium">Crew pay per month</label>
                    <div className="relative mt-1.5">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/50" aria-hidden="true">₹</span>
                      <input id="ledger-earn" inputMode="numeric" type="number" min="0" value={crewEarnings} onChange={(e) => setCrewEarnings(e.target.value)} className={`pl-7 tnum ${paperInput}`} />
                    </div>
                  </div>
                </div>
                {monsoonSurge && (
                  <p className="text-[13px] text-rust">Monsoon surge is switched on at the top of the page, so these figures assume storm-season debris.</p>
                )}
              </form>

              <div className="lg:col-span-7 lg:sticky lg:top-28">
                <div className="bg-[#F7F3EA] border border-ink/15 rounded-[3px] shadow-[0_1px_0_rgba(14,18,19,0.06),0_24px_48px_-32px_rgba(14,18,19,0.35)]">
                  <div className="flex items-center justify-between gap-4 px-6 sm:px-8 py-4 border-b border-dashed border-ink/25 font-mono text-[11px] text-ink/55">
                    <span className="uppercase tracking-[0.14em]">Monthly ledger</span>
                    <span className="tnum">~{c.trips} trips &middot; {stateData.name}</span>
                  </div>

                  <dl className="px-6 sm:px-8 py-6 space-y-4">
                    {parts.map((p) => (
                      <div key={p.k} className="flex items-end gap-2 text-[15px]">
                        <dt className="flex items-center gap-2.5 min-w-0">
                          <span className="w-2 h-2 shrink-0 rounded-[1px]" style={{ backgroundColor: p.color }} aria-hidden="true"></span>
                          <span className="truncate">{p.k}</span>
                        </dt>
                        <span className="flex-1 mb-1.5 border-b border-dotted border-ink/30 min-w-6" aria-hidden="true"></span>
                        <dd className="tnum font-mono text-[14px]">₹<AnimatedNumber value={p.v} /></dd>
                      </div>
                    ))}
                  </dl>

                  <div className="px-6 sm:px-8">
                    <div className="flex h-2.5 overflow-hidden rounded-[1px] bg-ink/10" aria-hidden="true">
                      {parts.map((p) => (
                        <span key={p.k} className="h-full transition-all duration-500" style={{ width: `${c.monthly ? (p.v / c.monthly) * 100 : 0}%`, backgroundColor: p.color }}></span>
                      ))}
                    </div>
                  </div>

                  <div className="mx-6 sm:mx-8 mt-6 pt-4 border-t border-ink flex items-baseline justify-between text-[15px]">
                    <span>Each month</span>
                    <span className="tnum font-mono">₹<AnimatedNumber value={c.monthly} /></span>
                  </div>

                  <div className="px-6 sm:px-8 pt-8 pb-7">
                    <p className="text-[13px] text-ink/60">Over a year, this boat loses</p>
                    <p className={`mt-2 font-serif tnum text-[56px] sm:text-[72px] leading-none tracking-[-0.02em] ${monsoonSurge ? 'text-rust' : 'text-ink'}`} aria-live="polite">
                      ₹<AnimatedNumber value={c.annual} />
                    </p>
                    <p className="mt-4 text-[15px] leading-relaxed text-ink/75 max-w-md">
                      {earnings > 0
                        ? <>That is about <strong className="font-semibold text-ink">{monthsOfPay.toFixed(1)} months</strong> of the crew&apos;s pay. On top of that, roughly <strong className="font-semibold text-ink">{c.catchLoss}%</strong> of each haul slips out through torn mesh.</>
                        : <>Roughly <strong className="font-semibold text-ink">{c.catchLoss}%</strong> of each haul also slips out through torn mesh.</>}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 px-6 sm:px-8 py-4 border-t border-dashed border-ink/25">
                    <p className="text-[12px] text-ink/50">Model from ICAR-CMFRI field surveys. An estimate, not an invoice.</p>
                    <button
                      onClick={handleExportPDF}
                      className="inline-flex items-center gap-2 h-10 px-4 rounded-[3px] bg-ink text-paper text-[13px] font-medium hover:bg-rust transition-colors"
                    >
                      <Icon name="download" className="w-3.5 h-3.5" />
                      Print this ledger (PDF)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      );
    };

    /* ========================================================================
       9. FOOD WEB — FIVE STAGES
       ======================================================================== */
    const TrophicSimulator = () => {
      const [idx, setIdx] = useState(0);
      const step = TROPHIC_STEPS[idx];
      const n = TROPHIC_STEPS.length;
      const tabsRef = useRef([]);

      const go = (i, focus = false) => {
        const next = (i + n) % n;
        setIdx(next);
        soundscape.playSonarPing();
        if (focus && tabsRef.current[next]) tabsRef.current[next].focus();
      };
      const onKey = (e) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); go(idx + 1, true); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); go(idx - 1, true); }
      };

      return (
        <section id="trophic-cascade" className="py-24 sm:py-28 border-b border-white/[0.06]">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <SectionHead
              index="04"
              kicker="Food web"
              title="A plastic bag gets smaller. It never goes away."
              dek="Follow one piece of packaging from a storm drain to the gut of a prawn, and see where the science draws the line on what reaches your plate."
            />

            <div role="tablist" aria-label="Stages of the food web" onKeyDown={onKey} className="relative grid grid-cols-5">
              <span className="absolute left-[10%] right-[10%] top-[12px] h-px bg-white/10" aria-hidden="true"></span>
              <span className="absolute left-[10%] top-[12px] h-px bg-acc-secondary transition-all duration-500" style={{ width: `${idx * 20}%` }} aria-hidden="true"></span>
              {TROPHIC_STEPS.map((s, i) => {
                const on = i === idx;
                return (
                  <button
                    key={s.step}
                    ref={(el) => (tabsRef.current[i] = el)}
                    role="tab"
                    id={`stage-tab-${i}`}
                    aria-selected={on}
                    aria-controls="stage-panel"
                    tabIndex={on ? 0 : -1}
                    onClick={() => go(i)}
                    className="group relative flex flex-col items-center text-center gap-3 px-1 outline-none"
                  >
                    <span className={`relative z-10 w-[25px] h-[25px] rounded-full border flex items-center justify-center font-mono text-[10px] tnum transition-colors group-focus-visible:ring-2 group-focus-visible:ring-acc-secondary/50 ${i <= idx ? 'bg-acc-secondary border-acc-secondary text-ink' : 'bg-ink border-white/20 text-txt-tertiary group-hover:border-white/45'}`}>
                      {s.step}
                    </span>
                    <span className={`hidden sm:block text-[13px] leading-snug max-w-[12rem] ${on ? 'text-white' : 'text-txt-secondary group-hover:text-txt-primary'}`}>{s.title}</span>
                  </button>
                );
              })}
            </div>

            <div id="stage-panel" role="tabpanel" aria-labelledby={`stage-tab-${idx}`} key={idx} className="jt-fade mt-14 grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-7">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-acc-secondary">Stage {step.step} of {n}</p>
                <h3 className="mt-4 font-serif text-[36px] sm:text-[46px] leading-[1.02] text-white text-balance">{step.title}</h3>
                <p className="mt-3 text-[13px] text-txt-tertiary">{step.location}</p>
                <p className="mt-6 text-[17px] leading-[1.7] text-txt-muted max-w-[38rem] text-pretty">{step.mechanics}</p>
                <div className="mt-8 flex items-center gap-2">
                  <button onClick={() => go(idx - 1)} className="h-10 px-4 rounded-[3px] border border-white/15 text-[13px] text-txt-primary hover:border-white/35 transition-colors">&larr; Previous</button>
                  <button onClick={() => go(idx + 1)} className="h-10 px-4 rounded-[3px] bg-white text-ink text-[13px] font-medium hover:bg-acc-secondary transition-colors">
                    {idx === n - 1 ? 'Back to the start' : 'Next stage'} &rarr;
                  </button>
                </div>
              </div>

              <dl className="lg:col-span-5 border-t lg:border-t-0 lg:border-l border-white/[0.08] pt-8 lg:pt-0 lg:pl-10 space-y-8">
                <div>
                  <dt className="text-[12px] text-txt-tertiary">Particle size by now</dt>
                  <dd className="mt-2 font-serif text-[32px] leading-none text-white">{step.size}</dd>
                </div>
                <div>
                  <dt className="text-[12px] text-txt-tertiary">What it has become</dt>
                  <dd className="mt-2 text-[16px] text-txt-primary">{step.category}</dd>
                </div>
                <div>
                  <dt className="flex items-baseline justify-between text-[12px] text-txt-tertiary">
                    <span>Exposure score</span>
                    <span className="font-mono text-[13px] tnum text-white">{step.score} / 100</span>
                  </dt>
                  <dd className="mt-3 h-[3px] bg-white/[0.08]">
                    <span className="block h-full transition-all duration-700" style={{ width: `${step.score}%`, backgroundColor: step.color }}></span>
                  </dd>
                </div>
              </dl>
            </div>

            <aside className="mt-14 grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-10 border-t border-white/[0.08] pt-8">
              <p className="md:col-span-3 font-mono text-[11px] uppercase tracking-[0.16em] text-acc-secondary">What the research says</p>
              <div key={idx} className="jt-fade md:col-span-9">
                <p className="text-[16px] leading-relaxed text-txt-primary text-pretty">{step.guardrail}</p>
                <p className="mt-3 text-[12px] text-txt-tertiary">ICAR-CMFRI marine fish toxicology protocols, 2024&ndash;2026.</p>
              </div>
            </aside>
          </div>
        </section>
      );
    };

