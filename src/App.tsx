import { useState, type ChangeEvent, type ReactNode } from 'react'
import {
  regions,
  scenarios,
  stageProbabilities,
  stages,
  type RegionSelection,
  type Scenario,
} from './demoData'
import {
  getDataIssues,
  getForecastMetrics,
  getHistoricalFunnel,
  getHistoricalWinRate,
  getPipelineStages,
  getRegionalComparison,
  getScenarioComparison,
  getStageProbability,
  getWeakestTransition,
} from './metrics'
import './App.css'

type View = 'overview' | 'conversion' | 'forecast'
type IconName = 'overview' | 'funnel' | 'forecast' | 'arrow' | 'target' | 'alert' | 'check'

const dollars = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 2,
})
const whole = new Intl.NumberFormat('en-US')

function money(value: number): string { return dollars.format(value) }
function percent(value: number | null): string { return value === null ? 'N/A' : `${(value * 100).toFixed(1)}%` }
function signedMoney(value: number): string { return `${value < 0 ? '−' : '+'}${money(Math.abs(value))}` }
function widthFor(value: number, max: number): string { return `${Math.max(0, Math.min(100, max > 0 ? value / max * 100 : 0))}%` }
function validRegion(value: string): value is RegionSelection { return value === 'All Regions' || regions.some((item) => item === value) }
function validScenario(value: string): value is Scenario { return scenarios.some((item) => item === value) }

function Icon({ name, size = 19 }: { name: IconName; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true as const }
  switch (name) {
    case 'overview': return <svg {...common}><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/></svg>
    case 'funnel': return <svg {...common}><path d="M3 4h18l-7 8v6l-4 2v-8L3 4Z"/><path d="M8 8h8"/></svg>
    case 'forecast': return <svg {...common}><path d="M3 20h18M6 16l5-5 4 3 5-8"/><path d="M15 6h5v5"/></svg>
    case 'arrow': return <svg {...common}><path d="M5 18 19 5M9 5h10v10"/></svg>
    case 'target': return <svg {...common}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></svg>
    case 'alert': return <svg {...common}><path d="m12 3 10 18H2L12 3Z"/><path d="M12 10v4m0 3h.01"/></svg>
    case 'check': return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></svg>
  }
}

function Metric({ label, value, detail, tone = 'default' }: {
  label: string
  value: string
  detail: string
  tone?: 'default' | 'risk' | 'good'
}) {
  return <article className={`roc-metric roc-metric-${tone}`}>
    <span className="roc-metric-label">{label}</span>
    <strong className="roc-metric-value">{value}</strong>
    <span className="roc-metric-detail">{detail}</span>
  </article>
}

function Surface({ title, subtitle, children, className = '' }: {
  title: string
  subtitle?: string
  children: ReactNode
  className?: string
}) {
  return <section className={`roc-surface ${className}`}>
    <div className="roc-surface-head"><h3>{title}</h3>{subtitle && <p>{subtitle}</p>}</div>
    {children}
  </section>
}

function ExecutiveNote({ label, children, tone = 'neutral' }: {
  label: string
  children: ReactNode
  tone?: 'neutral' | 'caution' | 'good'
}) {
  return <div className={`roc-decision roc-decision-${tone}`}>
    <span className="roc-decision-label">{label}</span>
    <p>{children}</p>
  </div>
}

function ForecastTargetBar({ forecast, target }: { forecast: number; target: number }) {
  const completion = target > 0 ? forecast / target : 0
  return <div className="roc-goal">
    <div className="roc-goal-caption"><strong>{percent(completion)} of target</strong><span>Target {money(target)}</span></div>
    <div className="roc-goal-track" role="img" aria-label={`${percent(completion)} forecast attainment of ${money(target)} bookings target`}>
      <div className="roc-goal-fill" style={{ width: widthFor(forecast, target) }}/>
      <span className="roc-goal-marker" />
    </div>
    <div className="roc-goal-foot"><span>0</span><span>100% target</span></div>
  </div>
}

function StageValueChart({ region, scenario }: { region: RegionSelection; scenario: Scenario }) {
  const pipeline = getPipelineStages(region, scenario)
  const max = Math.max(1, ...pipeline.map((item) => item.openValue))
  const total = getForecastMetrics(region, scenario)
  return <>
    <div className="roc-stage-values">
      {pipeline.map((item) => <div className="roc-stage-value" key={item.stage}>
        <div className="roc-stage-value-info"><strong>{item.stage}</strong><span>{item.count} open · {money(item.openValue)}</span></div>
        <div className="roc-stage-value-track" aria-hidden="true"><div style={{ width: widthFor(item.openValue, max) }}/></div>
        <div className="roc-stage-value-sub">{percent(item.probability)} assumed close probability · {money(item.weightedValue)} weighted</div>
      </div>)}
    </div>
    <p className="roc-footnote">Stage totals reconcile to <strong>{money(total.openPipeline)}</strong> in open pipeline and <strong>{money(total.weightedForecast)}</strong> in scenario-weighted bookings.</p>
  </>
}

function RegionPerformanceTable({ region, scenario }: { region: RegionSelection; scenario: Scenario }) {
  const rows = getRegionalComparison(scenario)
  const all = getForecastMetrics('All Regions', scenario)
  return <div className="roc-table-wrap"><table className="roc-table">
    <caption className="sr-only">Forecast versus target across all regions using {scenario.toLowerCase()} assumptions</caption>
    <thead><tr><th scope="col">Territory</th><th scope="col">Open pipeline</th><th scope="col">Weighted forecast</th><th scope="col">Q4 target</th><th scope="col">Gap</th><th scope="col">Attainment</th></tr></thead>
    <tbody>
      {rows.map((row) => <tr key={row.region} className={region === row.region ? 'roc-table-selected' : undefined}>
        <th scope="row">{row.region}{region === row.region && <span className="roc-selected-mark">Selected</span>}</th>
        <td>{money(row.openPipeline)}</td><td>{money(row.weightedForecast)}</td><td>{money(row.bookingsTarget)}</td>
        <td className={row.forecastGap < 0 ? 'roc-amount-negative' : 'roc-amount-positive'}>{signedMoney(row.forecastGap)}</td>
        <td>{percent(row.forecastAttainment)}</td>
      </tr>)}
      <tr className="roc-total-row"><th scope="row">Company total</th><td>{money(all.openPipeline)}</td><td>{money(all.weightedForecast)}</td><td>{money(all.bookingsTarget)}</td><td className={all.forecastGap < 0 ? 'roc-amount-negative' : 'roc-amount-positive'}>{signedMoney(all.forecastGap)}</td><td>{percent(all.forecastAttainment)}</td></tr>
    </tbody>
  </table></div>
}

function Overview({ region, scenario }: { region: RegionSelection; scenario: Scenario }) {
  const m = getForecastMetrics(region, scenario)
  const weakest = getWeakestTransition(region)
  const mostAdvanced = getPipelineStages(region, scenario).filter((stage) => stage.stage === 'Negotiation')[0]
  const shortfall = Math.max(0, -m.forecastGap)
  return <section className="roc-view" aria-labelledby="roc-page-title">
    <div className="roc-heading"><div><p className="roc-eyebrow">01 / Commercial intelligence</p><h1 id="roc-page-title">Revenue Command Center</h1><p>Q4 2026 pipeline exposure, expected bookings, and executive priorities.</p></div><span className="roc-period">Q4 2026 · Illustrative</span></div>
    <div className="roc-overview-top">
      <section className="roc-hero" aria-label="Quarterly bookings outlook">
        <p className="roc-hero-eyebrow">Probability-weighted Q4 bookings · {scenario} scenario</p>
        <div className="roc-hero-number">{money(m.weightedForecast)}</div>
        <p className="roc-hero-context">{m.forecastGap < 0 ? `${money(shortfall)} below target` : `${money(m.forecastGap)} above target`} · {region}</p>
        <ForecastTargetBar forecast={m.weightedForecast} target={m.bookingsTarget}/>
        <p className="roc-hero-small">A modeled bookings expectation, not recognized revenue or a commitment.</p>
      </section>
      <div className="roc-overview-metrics">
        <Metric label="Open opportunity value" value={money(m.openPipeline)} detail={`${m.opportunityCount} Q4 opportunities`}/>
        <Metric label="Pipeline coverage" value={m.pipelineCoverage === null ? 'N/A' : `${m.pipelineCoverage.toFixed(2)}×`} detail="Open value / bookings target"/>
        <Metric label="Historical cohort win rate" value={percent(getHistoricalWinRate(region))} detail="Resolved cohort, separate from Q4"/>
        <Metric label="Forecast gap" value={signedMoney(m.forecastGap)} detail={m.forecastGap < 0 ? 'Unfavorable · below plan' : 'Favorable · above plan'} tone={m.forecastGap < 0 ? 'risk' : 'good'}/>
      </div>
    </div>
    <div className="roc-overview-bottom">
      <Surface title="Open pipeline by stage" subtitle="Real Q4 opportunity values; probability weighting is shown separately.">
        <StageValueChart region={region} scenario={scenario}/>
      </Surface>
      <Surface title="Executive decision brief" subtitle="Interpretation derived from the selected region and scenario." className="roc-brief-panel">
        <ExecutiveNote label="01 · Forecast exposure" tone={m.forecastGap < 0 ? 'caution' : 'good'}>
          {m.forecastGap < 0 ? <>The weighted forecast covers <strong>{percent(m.forecastAttainment)}</strong> of the bookings target, leaving <strong>{money(shortfall)}</strong> of modeled exposure.</> : <>The forecast exceeds the target by <strong>{money(m.forecastGap)}</strong>. Treat the apparent surplus as scenario-dependent.</>}
        </ExecutiveNote>
        <ExecutiveNote label="02 · Pipeline maturity">
          <strong>{mostAdvanced?.count ?? 0} opportunities</strong> are in Negotiation, representing <strong>{money(mostAdvanced?.openValue ?? 0)}</strong> of open pipeline before probability weighting. Review close timing and deal readiness.
        </ExecutiveNote>
        <ExecutiveNote label="03 · Management priority">
          {weakest ? <>The weakest historical progression is into <strong>{weakest.label}</strong> at <strong>{percent(weakest.advancement)}</strong>. Investigate that handoff before assuming faster conversions.</> : <>Historical transition evidence is unavailable for this region.</>}
        </ExecutiveNote>
      </Surface>
    </div>
    <div className="roc-note-bar"><Icon name="alert" size={16}/><span>All records are synthetic. Historical conversion and assumed opportunity close probabilities are different measures.</span></div>
  </section>
}

function Conversion({ region }: { region: RegionSelection }) {
  const steps = getHistoricalFunnel(region)
  const first = steps[0]?.count ?? 0
  const last = steps[steps.length - 1]?.count ?? 0
  const weakest = getWeakestTransition(region)
  const nonWins = first - last
  return <section className="roc-view" aria-labelledby="roc-page-title">
    <div className="roc-heading"><div><p className="roc-eyebrow">02 / Historical conversion analysis</p><h1 id="roc-page-title">Sales Funnel &amp; Bottlenecks</h1><p>Follow one resolved qualification cohort through each successive sales stage.</p></div><span className="roc-period">Completed by Q3 2026</span></div>
    <div className="roc-micro-grid">
      <Metric label="Initially qualified" value={whole.format(first)} detail="Historical cohort opportunities"/>
      <Metric label="Ultimately won" value={whole.format(last)} detail={`${percent(getHistoricalWinRate(region))} of qualified cohort`}/>
      <Metric label="Lowest stage advancement" value={percent(weakest?.advancement ?? null)} detail={weakest ? `Into ${weakest.label}` : 'Unavailable'} tone="risk"/>
      <Metric label="Did not win" value={whole.format(nonWins)} detail="Qualified less eventual wins"/>
    </div>
    <div className="roc-funnel-layout">
      <Surface title="Historical opportunity funnel" subtitle={`Resolved opportunities · ${region} · widths represent the share of originally qualified deals`} className="roc-funnel-panel">
        <div className="roc-funnel-list" role="group" aria-label="Historical funnel stage counts and conversion rates">
          {steps.map((step, i) => {
            const ratio = first > 0 ? step.count / first : 0
            const blockWidth = `${Math.max(0, Math.min(100, ratio * 100))}%`
            return <div className="roc-funnel-row" key={step.label}>
              <div className="roc-funnel-label"><strong>{step.label}</strong><span>{whole.format(step.count)} opportunities</span></div>
              <div className="roc-funnel-bar-area"><div className={`roc-funnel-shape roc-funnel-shape-${i}`} style={{ width: blockWidth }}><strong>{whole.format(step.count)}</strong></div></div>
              <div className="roc-funnel-conversion">{i === 0 ? <span>100% baseline</span> : <><strong>{percent(step.advancement)}</strong><span>from prior stage</span></>}</div>
            </div>
          })}
        </div>
        <p className="roc-footnote">All widths use the same original-cohort denominator. Percentage labels show advancement from the preceding stage, not the share of all qualified opportunities.</p>
      </Surface>
      <aside className="roc-intelligence-rail" aria-label="Commercial conversion insights">
        <Surface title="Conversion risk assessment" subtitle="Evidence-based prompts, not automated causal conclusions.">
          <div className="roc-risk-summary"><Icon name="alert" size={22}/><div><span>Lowest advancement</span><strong>{weakest ? `${weakest.label} · ${percent(weakest.advancement)}` : 'Unavailable'}</strong></div></div>
          {weakest && <ExecutiveNote label="Observed cohort loss" tone="caution">The transition into <strong>{weakest.label}</strong> retained <strong>{whole.format(weakest.count)}</strong> opportunities, with <strong>{whole.format(weakest.dropOffCount ?? 0)}</strong> not advancing from the prior stage.</ExecutiveNote>}
          <ExecutiveNote label="Suggested management review">Inspect stage qualification criteria, opportunity aging, objections, and rep follow-up before assigning a cause to the observed drop-off.</ExecutiveNote>
          <ExecutiveNote label="Forecast guardrail">Historical funnel advancement is <strong>not</strong> automatically substituted for Q4 opportunity close probabilities.</ExecutiveNote>
        </Surface>
      </aside>
    </div>
    <Surface title="Stage-to-stage conversion detail" subtitle="Transition counts reconcile to the funnel visualization above.">
      <div className="roc-table-wrap"><table className="roc-table roc-transition-table"><thead><tr><th scope="col">Destination stage</th><th scope="col">Prior stage count</th><th scope="col">Advanced</th><th scope="col">Not advanced</th><th scope="col">Advancement rate</th></tr></thead><tbody>
        {steps.slice(1).map((step, i) => <tr key={step.label} className={step.label === weakest?.label ? 'roc-table-selected' : undefined}><th scope="row">{step.label}{step.label === weakest?.label && <span className="roc-selected-mark">Lowest</span>}</th><td>{whole.format(steps[i]?.count ?? 0)}</td><td>{whole.format(step.count)}</td><td>{whole.format(step.dropOffCount ?? 0)}</td><td>{percent(step.advancement)}</td></tr>)}
      </tbody></table></div>
    </Surface>
    <div className="roc-note-bar"><Icon name="check" size={16}/><span>Historical cohorts are synthetic and separate from the Q4 open opportunity snapshot. This is a conversion analysis, not a predictive model.</span></div>
  </section>
}

function ScenarioComparison({ region, active }: { region: RegionSelection; active: Scenario }) {
  const variants = getScenarioComparison(region)
  const scale = Math.max(1, ...variants.flatMap((item) => [item.weightedForecast, item.bookingsTarget]))
  return <div className="roc-scenario-bars">
    {variants.map((item) => <div className={`roc-scenario-row ${item.scenario === active ? 'roc-scenario-active' : ''}`} key={item.scenario}>
      <div className="roc-scenario-head"><strong>{item.scenario}</strong><span>{money(item.weightedForecast)} · {percent(item.forecastAttainment)} of target</span></div>
      <div className="roc-comparison-track" aria-hidden="true"><div className="roc-comparison-fill" style={{ width: widthFor(item.weightedForecast, scale) }}/><span className="roc-comparison-target" style={{ left: widthFor(item.bookingsTarget, scale) }}/></div>
      <p className={item.forecastGap < 0 ? 'roc-amount-negative' : 'roc-amount-positive'}>{signedMoney(item.forecastGap)} against {money(item.bookingsTarget)} target</p>
    </div>)}
    <div className="roc-legend"><span><i className="roc-legend-forecast"/>Weighted forecast</span><span><i className="roc-legend-target"/>Bookings target marker</span></div>
  </div>
}

function Forecast({ region, scenario }: { region: RegionSelection; scenario: Scenario }) {
  const m = getForecastMetrics(region, scenario)
  const comparison = getScenarioComparison(region)
  const low = comparison.find((item) => item.scenario === 'Conservative')
  const high = comparison.find((item) => item.scenario === 'Upside')
  const weak = getWeakestTransition(region)
  const gap = Math.max(0, -m.forecastGap)
  const requiredUplift = m.weightedForecast > 0 ? gap / m.weightedForecast : null
  return <section className="roc-view" aria-labelledby="roc-page-title">
    <div className="roc-heading"><div><p className="roc-eyebrow">03 / Commercial planning workspace</p><h1 id="roc-page-title">Forecast &amp; Territory Review</h1><p>Test scenario assumptions and prioritize the regions with the largest planning gaps.</p></div><span className="roc-period">Q4 2026 bookings</span></div>
    <div className="roc-forecast-head">
      <div className="roc-forecast-summary"><span>SELECTED WEIGHTED FORECAST · {scenario.toUpperCase()}</span><strong>{money(m.weightedForecast)}</strong><small>{region} · {percent(m.forecastAttainment)} of {money(m.bookingsTarget)} target</small></div>
      <div className="roc-forecast-summary roc-forecast-summary-cyan"><span>OPEN PIPELINE EXPOSURE</span><strong>{money(m.openPipeline)}</strong><small>{m.opportunityCount} opportunities · unweighted</small></div>
      <div className="roc-forecast-gap"><span>Forecast gap</span><strong className={m.forecastGap < 0 ? 'roc-amount-negative' : 'roc-amount-positive'}>{signedMoney(m.forecastGap)}</strong><small>{m.forecastGap < 0 ? 'Below the bookings target' : 'At or above the bookings target'}</small></div>
    </div>
    <div className="roc-territory-layout">
      <Surface title="Territory plan summary" subtitle="All regions remain visible for comparison; selected region is highlighted. Values reconcile to company totals." className="roc-territory-main">
        <RegionPerformanceTable region={region} scenario={scenario}/>
        <p className="roc-footnote">Regional bookings targets are fictional. The forecast values are stage-weighted expected bookings, not recognized revenue.</p>
      </Surface>
      <Surface title="Executive planning brief" subtitle="Actionable interpretation of the current selection." className="roc-planning-brief">
        <ExecutiveNote label="Target exposure" tone={m.forecastGap < 0 ? 'caution' : 'good'}>{m.forecastGap < 0 ? <><strong>{money(gap)}</strong> in weighted expected bookings separates the {scenario.toLowerCase()} forecast from the target.</> : <>The selected assumptions put forecast expected bookings <strong>{money(m.forecastGap)}</strong> above plan.</>}</ExecutiveNote>
        <ExecutiveNote label="Scenario sensitivity">Across scenarios for {region}, weighted bookings range from <strong>{money(low?.weightedForecast ?? 0)}</strong> to <strong>{money(high?.weightedForecast ?? 0)}</strong>. This is an assumption range, not a confidence interval.</ExecutiveNote>
        <ExecutiveNote label="Priority review">{weak ? <>Historical advancement into <strong>{weak.label}</strong> is lowest at <strong>{percent(weak.advancement)}</strong>. Review progression and deal readiness before raising close probabilities.</> : 'Historical progression detail is unavailable.'}</ExecutiveNote>
      </Surface>
    </div>
    <div className="roc-forecast-bottom">
      <Surface title="Scenario impact on bookings" subtitle="Identical Q4 opportunities under conservative, base, and upside probability assumptions.">
        <ScenarioComparison region={region} active={scenario}/>
      </Surface>
      <Surface title="Close-probability assumptions" subtitle="Stage probabilities are synthetic; scenario multipliers are 0.85×, 1.00×, and 1.15×.">
        <div className="roc-table-wrap"><table className="roc-table roc-prob-table"><thead><tr><th scope="col">Current stage</th><th scope="col">Base</th><th scope="col">{scenario}</th></tr></thead><tbody>{stages.map((stage) => <tr key={stage}><th scope="row">{stage}</th><td>{percent(stageProbabilities[stage])}</td><td><strong>{percent(getStageProbability(stage, scenario))}</strong></td></tr>)}</tbody></table></div>
        <p className="roc-footnote">Applied to each opportunity's value; probabilities are capped at 100%. {m.forecastGap < 0 && requiredUplift !== null ? `Closing the current gap is equivalent to ${percent(requiredUplift)} of the selected weighted forecast, not a prediction of achievable growth.` : 'Reevaluate probabilities if opportunity timing or qualification changes.'}</p>
      </Surface>
    </div>
  </section>
}

const views: readonly { id: View; title: string; subtitle: string; icon: IconName }[] = [
  { id: 'overview', title: 'Commercial Overview', subtitle: 'Performance at a glance', icon: 'overview' },
  { id: 'conversion', title: 'Pipeline Conversion', subtitle: 'Funnel and bottlenecks', icon: 'funnel' },
  { id: 'forecast', title: 'Forecast & Scenarios', subtitle: 'Territories and planning', icon: 'forecast' },
]

export default function App() {
  const [view, setView] = useState<View>('overview')
  const [region, setRegion] = useState<RegionSelection>('All Regions')
  const [scenario, setScenario] = useState<Scenario>('Base')
  const errors = getDataIssues()
  return <div className="roc-app">
    <aside className="roc-sidebar" aria-label="Application navigation">
      <div className="roc-sidebar-brand"><img src={`${import.meta.env.BASE_URL}revenue-icon.png`} width="44" height="44" alt=""/><div><strong>Revenue<span>IQ</span></strong><small>COMMERCIAL INTELLIGENCE</small></div></div>
      <div className="roc-sidebar-section">WORKSPACE</div>
      <nav className="roc-navigation" aria-label="Dashboards">
        {views.map((item) => <button key={item.id} type="button" className={`roc-navigation-item ${view === item.id ? 'roc-navigation-active' : ''}`} onClick={() => setView(item.id)} aria-current={view === item.id ? 'page' : undefined}>
          <Icon name={item.icon}/><span><strong>{item.title}</strong><small>{item.subtitle}</small></span>
        </button>)}
      </nav>
      <div className="roc-sidebar-bottom"><span className="roc-sidebar-caption">DEMONSTRATION ENTITY</span><strong>Crescent Harbor</strong><p>Business Services · Synthetic Q4 2026 opportunity data</p></div>
    </aside>
    <div className="roc-body">
      <header className="roc-topbar">
        <div className="roc-topbar-identity"><strong>Revenue Operations &amp; Commercial Performance</strong><span>Executive analytics / portfolio demonstration</span></div>
        <div className="roc-topbar-actions"><span className="roc-synthetic">SYNTHETIC DATA · DEMO</span><span className="roc-topbar-separator" aria-hidden="true"/><span className="roc-quarter">Q4 2026</span></div>
      </header>
      <div className="roc-toolbar"><div><span className="roc-toolbar-label">ANALYSIS WORKSPACE</span><strong>{views.find((item) => item.id === view)?.title}</strong></div><div className="roc-toolbar-filters">
        <label>Sales region<select value={region} onChange={(event: ChangeEvent<HTMLSelectElement>) => { if (validRegion(event.target.value)) setRegion(event.target.value) }}><option value="All Regions">All Regions</option>{regions.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        {view !== 'conversion' && <label>Forecast scenario<select value={scenario} onChange={(event: ChangeEvent<HTMLSelectElement>) => { if (validScenario(event.target.value)) setScenario(event.target.value) }}>{scenarios.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>}
      </div></div>
      <main className="roc-main">
        {errors.length > 0 && <div className="roc-data-alert" role="alert"><strong>Source data reconciliation requires attention</strong><ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>}
        {view === 'overview' && <Overview region={region} scenario={scenario}/>} 
        {view === 'conversion' && <Conversion region={region}/>} 
        {view === 'forecast' && <Forecast region={region} scenario={scenario}/>} 
      </main>
      <footer className="roc-footer"><span>RevenueIQ · Commercial Decision-Support Portfolio</span><span>Fictional company, opportunities, historical outcomes, and assumptions. No live CRM data.</span></footer>
    </div>
  </div>
}
