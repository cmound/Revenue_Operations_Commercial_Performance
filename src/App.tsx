import { useState, type ReactNode } from 'react'
import { regions, scenarios, stageProbabilities, type RegionSelection, type Scenario } from './demoData'
import {
  getDataIssues,
  getForecastMetrics,
  getHistoricalFunnel,
  getHistoricalWinRate,
  getPipelineStages,
  getRegionalComparison,
  getScenarioComparison,
  getWeakestTransition,
  type ForecastMetrics,
} from './metrics'
import './App.css'

type View = 'overview' | 'conversion' | 'forecast'

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 2 })
const integer = new Intl.NumberFormat('en-US')

function money(value: number): string { return usd.format(value) }
function pct(value: number | null): string { return value === null ? 'N/A' : `${(value * 100).toFixed(1)}%` }
function signedMoney(value: number): string { return `${value < 0 ? '−' : '+'}${money(Math.abs(value))}` }
function selectedRegion(value: string): value is RegionSelection { return value === 'All Regions' || regions.some((region) => region === value) }
function selectedScenario(value: string): value is Scenario { return scenarios.some((scenario) => scenario === value) }
function barWidth(value: number, scale: number): string { return `${Math.max(0, Math.min(100, scale > 0 ? value / scale * 100 : 0))}%` }

function Kpi({ label, value, note, trend = 'neutral' }: {
  label: string
  value: string
  note: string
  trend?: 'positive' | 'negative' | 'neutral'
}) {
  return <article className="kpi"><p className="kpi-label">{label}</p><strong className="kpi-value">{value}</strong><p className={`kpi-note ${trend}`}>{note}</p></article>
}

function Panel({ title, detail, children }: { title: string; detail: string; children: ReactNode }) {
  return <section className="panel"><header className="panel-head"><h3>{title}</h3><p>{detail}</p></header>{children}</section>
}

function ProgressRow({ name, value, scale, detail, secondary }: {
  name: string
  value: number
  scale: number
  detail: string
  secondary?: boolean
}) {
  return <div className="progress-row"><div className="progress-top"><span>{name}</span><strong>{detail}</strong></div><div className="progress-track" aria-hidden="true"><div className={secondary ? 'progress-fill secondary-fill' : 'progress-fill'} style={{ width: barWidth(value, scale) }} /></div></div>
}

function ComparisonRow({ label, actualLabel, actual, targetLabel, target, scale, active }: {
  label: string
  actualLabel: string
  actual: number
  targetLabel: string
  target: number
  scale: number
  active?: boolean
}) {
  return <div className={`comparison-row ${active ? 'comparison-active' : ''}`}>
    <strong className="comparison-title">{label}</strong>
    <div className="comparison-line"><span>{actualLabel}</span><div className="progress-track" aria-hidden="true"><div className="progress-fill" style={{ width: barWidth(actual, scale) }} /></div><strong>{money(actual)}</strong></div>
    <div className="comparison-line"><span>{targetLabel}</span><div className="progress-track" aria-hidden="true"><div className="progress-fill secondary-fill" style={{ width: barWidth(target, scale) }} /></div><strong>{money(target)}</strong></div>
  </div>
}

function Insight({ number, children }: { number: string; children: ReactNode }) {
  return <div className="insight"><span className="insight-number">{number}</span><p>{children}</p></div>
}

function Insights({ title, children }: { title: string; children: ReactNode }) {
  return <section className="insights"><header className="insights-head"><div><p className="eyebrow">Management interpretation</p><h3>{title}</h3></div><span className="insights-tag">Calculated from synthetic records</span></header><div className="insights-grid">{children}</div></section>
}

function GapSummary({ metrics }: { metrics: ForecastMetrics }) {
  return <>{metrics.forecastGap >= 0
    ? <><strong>{money(metrics.forecastGap)} above</strong> the Q4 bookings target</>
    : <><strong>{money(Math.abs(metrics.forecastGap))} below</strong> the Q4 bookings target</>}</>
}

function Overview({ region, scenario }: { region: RegionSelection; scenario: Scenario }) {
  const metrics = getForecastMetrics(region, scenario)
  const pipeline = getPipelineStages(region, scenario)
  const comparisons = getRegionalComparison(scenario)
  const weakest = getWeakestTransition(region)
  const stageScale = Math.max(1, ...pipeline.map((item) => item.openValue))
  const regionalScale = Math.max(1, ...comparisons.flatMap((item) => [item.weightedForecast, item.bookingsTarget]))
  return <section className="view" aria-labelledby="view-heading">
    <div className="page-head"><div><p className="eyebrow">01 / Executive overview</p><h2 id="view-heading">Commercial Performance Overview</h2><p>Understand open pipeline, expected Q4 bookings, and the distance to target.</p></div><span className="scope-note">Q4 2026 forecast</span></div>
    <div className="notice">Open opportunities are <strong>not</strong> recognized revenue. Forecast values reflect illustrative stage probabilities and your selected scenario.</div>
    <div className="kpi-grid">
      <Kpi label="Open pipeline value" value={money(metrics.openPipeline)} note={`${metrics.opportunityCount} open Q4 opportunities`} />
      <Kpi label="Weighted bookings forecast" value={money(metrics.weightedForecast)} note={`${scenario} probability assumptions`} />
      <Kpi label="Forecast-to-target gap" value={signedMoney(metrics.forecastGap)} note={`${pct(metrics.forecastAttainment)} of ${money(metrics.bookingsTarget)} target`} trend={metrics.forecastGap >= 0 ? 'positive' : 'negative'} />
      <Kpi label="Historical cohort win rate" value={pct(getHistoricalWinRate(region))} note="Resolved historical cohort, not Q4 open deals" />
    </div>
    <div className="chart-grid">
      <Panel title="Open pipeline by stage" detail="Opportunity value by current stage; stage weighting affects forecast, not open value.">
        <div className="stage-bars">{pipeline.map((item) => <ProgressRow key={item.stage} name={`${item.stage} · ${item.count} opportunities`} value={item.openValue} scale={stageScale} detail={money(item.openValue)} />)}</div>
        <p className="panel-foot">Sum of stage values: <strong>{money(metrics.openPipeline)}</strong>. Weighted value: <strong>{money(metrics.weightedForecast)}</strong>.</p>
      </Panel>
      <Panel title="Regional forecast vs. bookings target" detail="Each region's scenario-weighted forecast reconciles to the selected company total.">
        <div className="comparisons">{comparisons.map((item) => <ComparisonRow key={item.region} label={item.region} actualLabel="Forecast" actual={item.weightedForecast} targetLabel="Target" target={item.bookingsTarget} scale={regionalScale} active={region === item.region} />)}</div>
      </Panel>
    </div>
    <Insights title={`Executive insights · ${region}`}>
      <Insight number="01">The {scenario.toLowerCase()} forecast is <GapSummary metrics={metrics} /> ({pct(metrics.forecastAttainment)} attainment). The open pipeline alone does not establish likely bookings.</Insight>
      <Insight number="02">Pipeline coverage is <strong>{metrics.pipelineCoverage === null ? 'N/A' : `${metrics.pipelineCoverage.toFixed(2)}×`}</strong> the Q4 bookings target. Coverage is unweighted and should not be interpreted as close probability.</Insight>
      <Insight number="03">{weakest ? <>The historical cohort's lowest stage-to-stage advancement was into <strong>{weakest.label}</strong> ({pct(weakest.advancement)}). Review qualification and stalled deals before assuming stronger conversion.</> : 'No historical conversion benchmark is available.'}</Insight>
    </Insights>
  </section>
}

function Conversion({ region }: { region: RegionSelection }) {
  const funnel = getHistoricalFunnel(region)
  const first = funnel[0]
  const last = funnel[funnel.length - 1]
  const weakest = getWeakestTransition(region)
  const counted = first?.count ?? 0
  const won = last?.count ?? 0
  const scale = Math.max(1, counted)
  const steps = funnel.slice(1)
  const dropOffTotal = counted - won
  return <section className="view" aria-labelledby="view-heading">
    <div className="page-head"><div><p className="eyebrow">02 / Historical funnel</p><h2 id="view-heading">Pipeline Conversion &amp; Bottlenecks</h2><p>Trace a resolved qualification cohort to identify where opportunities stopped progressing.</p></div><span className="scope-note">Historical cohort · completed by Q3 2026</span></div>
    <div className="notice">This is a <strong>separate historical cohort</strong> from the Q4 open pipeline. Rates measure advancement among these fictional opportunities, not the Q4 forecast probabilities.</div>
    <div className="kpi-grid">
      <Kpi label="Originally qualified" value={integer.format(counted)} note="Historical cohort size" />
      <Kpi label="Ultimately won" value={integer.format(won)} note={`${pct(getHistoricalWinRate(region))} overall cohort win rate`} />
      <Kpi label="Lowest advancement" value={pct(weakest?.advancement ?? null)} note={weakest ? `Transition into ${weakest.label}` : 'No comparison available'} trend="negative" />
      <Kpi label="Did not ultimately win" value={integer.format(dropOffTotal)} note="Qualified less eventual wins; not a single-stage loss" />
    </div>
    <div className="chart-grid conversion-grid">
      <Panel title="Historical opportunity progression" detail="One cohort, tracked from Qualification through Won. Counts decrease as the cohort advances.">
        <div className="stage-bars">{funnel.map((item) => <ProgressRow key={item.label} name={item.label} value={item.count} scale={scale} detail={`${integer.format(item.count)} opportunities`} secondary={item.label === 'Won'} />)}</div>
      </Panel>
      <Panel title="Stage-to-stage conversion" detail="Each rate uses the immediately preceding stage's count as its denominator.">
        <div className="transition-list">{steps.map((step, index) => <div className="transition-row" key={step.label}>
          <div><strong>{funnel[index]?.label} → {step.label}</strong><span>{integer.format(step.dropOffCount ?? 0)} did not advance</span></div>
          <strong className="conversion-rate">{pct(step.advancement)}</strong>
        </div>)}</div>
      </Panel>
    </div>
    <Insights title={`Conversion insights · ${region}`}>
      <Insight number="01">The historical cohort progressed from <strong>{integer.format(counted)} qualified</strong> to <strong>{integer.format(won)} wins</strong> ({pct(getHistoricalWinRate(region))} overall).</Insight>
      <Insight number="02">{weakest ? <>The transition into <strong>{weakest.label}</strong> was the lowest by percentage ({pct(weakest.advancement)}), with {integer.format(weakest.dropOffCount ?? 0)} opportunities not advancing at that step.</> : 'No conversion bottleneck identified.'}</Insight>
      <Insight number="03">Investigate stage definitions, deal quality, objections, and follow-up discipline. These figures identify a <strong>review priority</strong>, not a proven cause of attrition.</Insight>
    </Insights>
  </section>
}

function Forecast({ region, scenario }: { region: RegionSelection; scenario: Scenario }) {
  const metrics = getForecastMetrics(region, scenario)
  const variants = getScenarioComparison(region)
  const stagesSummary = getPipelineStages(region, scenario)
  const scale = Math.max(1, metrics.bookingsTarget, ...variants.map((item) => item.weightedForecast))
  const targetGap = Math.max(0, -metrics.forecastGap)
  const uplift = metrics.weightedForecast > 0 ? targetGap / metrics.weightedForecast : null
  return <section className="view" aria-labelledby="view-heading">
    <div className="page-head"><div><p className="eyebrow">03 / Decision scenarios</p><h2 id="view-heading">Commercial Forecast &amp; Decision Scenarios</h2><p>Stress-test assumptions and determine how far the weighted forecast is from Q4 goals.</p></div><span className="scope-note">Illustrative Q4 2026 bookings</span></div>
    <div className="notice">Scenario multipliers modify <strong>assumed close probabilities</strong>. They do not change historical conversion rates or actual opportunity values.</div>
    <div className="kpi-grid">
      <Kpi label={`${scenario} forecast`} value={money(metrics.weightedForecast)} note="Probability-weighted expected bookings" />
      <Kpi label="Q4 bookings target" value={money(metrics.bookingsTarget)} note={`${region} · synthetic objective`} />
      <Kpi label="Forecast shortfall / surplus" value={signedMoney(metrics.forecastGap)} note={metrics.forecastGap >= 0 ? 'At or above target' : 'Below target'} trend={metrics.forecastGap >= 0 ? 'positive' : 'negative'} />
      <Kpi label="Pipeline coverage" value={metrics.pipelineCoverage === null ? 'N/A' : `${metrics.pipelineCoverage.toFixed(2)}×`} note="Unweighted open pipeline ÷ target" />
    </div>
    <div className="chart-grid">
      <Panel title="Scenario comparison" detail="Same open opportunities and targets under three alternative close-probability assumptions.">
        <div className="comparisons">{variants.map((item) => <ComparisonRow key={item.scenario} label={item.scenario} actualLabel="Forecast" actual={item.weightedForecast} targetLabel="Target" target={item.bookingsTarget} scale={scale} active={item.scenario === scenario} />)}</div>
      </Panel>
      <Panel title="Assumptions applied by sales stage" detail="Base probability × scenario multiplier, with an upper bound of 100%.">
        <div className="assumption-table" role="table" aria-label="Stage close probabilities">
          <div className="assumption-heading" role="row"><span role="columnheader">Stage</span><span role="columnheader">Base</span><span role="columnheader">Selected</span></div>
          {stagesSummary.map((item) => <div className="assumption-row" role="row" key={item.stage}><span role="cell">{item.stage}</span><span role="cell">{pct(stageProbabilities[item.stage])}</span><strong role="cell">{pct(item.probability)}</strong></div>)}
        </div>
        <p className="panel-foot">Conservative: 0.85× · Base: 1.00× · Upside: 1.15×</p>
      </Panel>
    </div>
    <Insights title={`Management decisions · ${region} · ${scenario}`}>
      <Insight number="01">The weighted forecast is <strong>{money(metrics.weightedForecast)}</strong> against a <strong>{money(metrics.bookingsTarget)}</strong> target, leaving {metrics.forecastGap < 0 ? <><strong>{money(targetGap)}</strong> to close</> : <><strong>{money(metrics.forecastGap)}</strong> of forecast headroom</>}.</Insight>
      <Insight number="02">{metrics.forecastGap < 0 ? <>Closing the forecast gap would require an uplift equivalent to <strong>{uplift === null ? 'N/A' : pct(uplift)}</strong> of the current weighted forecast, holding target constant. This is a sizing calculation, not an attainable conversion prediction.</> : <>On these assumptions the target is met. Monitor stage probability changes and expected close dates before treating the surplus as secured bookings.</>}</Insight>
      <Insight number="03">Use the historical funnel to focus coaching and deal reviews; validate proposal quality and closing timelines before changing forecast probabilities. <strong>Scenario outcomes are not commitments.</strong></Insight>
    </Insights>
  </section>
}

const views: readonly { key: View; number: string; name: string }[] = [
  { key: 'overview', number: '01', name: 'Commercial Overview' },
  { key: 'conversion', number: '02', name: 'Pipeline Conversion' },
  { key: 'forecast', number: '03', name: 'Forecast & Scenarios' },
]

function App() {
  const [view, setView] = useState<View>('overview')
  const [region, setRegion] = useState<RegionSelection>('All Regions')
  const [scenario, setScenario] = useState<Scenario>('Base')
  const errors = getDataIssues()
  return <div className="roc-app">
    <header className="site-header"><div className="brand"><img src={`${import.meta.env.BASE_URL}revenue-icon.png`} alt="" width="48" height="48" /><div><strong>Revenue Operations &amp; Commercial Performance</strong><span>Commercial forecasting · Pipeline intelligence · Executive decisions</span></div></div><span className="data-label">SYNTHETIC DATA · DEMONSTRATION</span></header>
    <div className="workspace">
      <aside className="sidebar" aria-label="Dashboard navigation"><p className="sidebar-caption">COMMERCIAL INTELLIGENCE</p><nav className="side-links" aria-label="Choose dashboard">{views.map((item) => <button type="button" key={item.key} className={view === item.key ? 'nav-item active' : 'nav-item'} aria-current={view === item.key ? 'page' : undefined} onClick={() => setView(item.key)}><span className="nav-number">{item.number}</span>{item.name}</button>)}</nav><div className="sidebar-company"><strong>Crescent Harbor Business Services</strong><span>Fictional commercial services company</span><span>Q4 2026 illustrative forecast</span></div></aside>
      <main className="main">
        <div className="filters"><label>Sales region<select value={region} onChange={(event) => { if (selectedRegion(event.target.value)) setRegion(event.target.value) }}><option value="All Regions">All Regions</option>{regions.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>{view !== 'conversion' && <label>Forecast scenario<select value={scenario} onChange={(event) => { if (selectedScenario(event.target.value)) setScenario(event.target.value) }}>{scenarios.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>}</div>
        {errors.length > 0 && <div className="data-error" role="alert"><strong>Synthetic data integrity checks failed.</strong><ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>}
        {view === 'overview' && <Overview region={region} scenario={scenario} />}
        {view === 'conversion' && <Conversion region={region} />}
        {view === 'forecast' && <Forecast region={region} scenario={scenario} />}
        <footer className="site-footer"><span>Revenue Operations &amp; Commercial Performance · Portfolio demonstration</span><span>All business records and conclusions are illustrative, not real-world results.</span></footer>
      </main>
    </div>
  </div>
}

export default App
