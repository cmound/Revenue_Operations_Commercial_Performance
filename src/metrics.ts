import {
  historicalFunnel,
  opportunities,
  regionalTargets,
  regions,
  scenarioMultipliers,
  scenarios,
  stageProbabilities,
  stages,
  type HistoricFunnel,
  type Region,
  type RegionSelection,
  type Scenario,
  type Stage,
} from './demoData'

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0)
}

export function safeRatio(numerator: number, denominator: number): number | null {
  return denominator > 0 ? numerator / denominator : null
}

export function getStageProbability(stage: Stage, scenario: Scenario): number {
  return Math.min(1, stageProbabilities[stage] * scenarioMultipliers[scenario])
}

export interface ForecastMetrics {
  openPipeline: number
  opportunityCount: number
  weightedForecast: number
  bookingsTarget: number
  forecastGap: number
  pipelineCoverage: number | null
  forecastAttainment: number | null
}

export function getForecastMetrics(region: RegionSelection, scenario: Scenario): ForecastMetrics {
  const chosen = opportunities.filter((item) => region === 'All Regions' || item.region === region)
  const openPipeline = sum(chosen.map((item) => item.value))
  const weightedForecast = sum(chosen.map((item) => item.value * getStageProbability(item.stage, scenario)))
  const bookingsTarget = sum(regionalTargets.filter((item) => region === 'All Regions' || item.region === region).map((item) => item.bookingsTarget))
  return {
    openPipeline,
    opportunityCount: chosen.length,
    weightedForecast,
    bookingsTarget,
    forecastGap: weightedForecast - bookingsTarget,
    pipelineCoverage: safeRatio(openPipeline, bookingsTarget),
    forecastAttainment: safeRatio(weightedForecast, bookingsTarget),
  }
}

export interface PipelineStageMetrics {
  stage: Stage
  count: number
  openValue: number
  weightedValue: number
  probability: number
}

export function getPipelineStages(region: RegionSelection, scenario: Scenario): readonly PipelineStageMetrics[] {
  const chosen = opportunities.filter((item) => region === 'All Regions' || item.region === region)
  return stages.map((stage) => {
    const matching = chosen.filter((item) => item.stage === stage)
    const openValue = sum(matching.map((item) => item.value))
    const probability = getStageProbability(stage, scenario)
    return { stage, count: matching.length, openValue, weightedValue: openValue * probability, probability }
  })
}

export function getRegionalComparison(scenario: Scenario): readonly (ForecastMetrics & { region: Region })[] {
  return regions.map((region) => ({ region, ...getForecastMetrics(region, scenario) }))
}

export interface FunnelStep {
  label: string
  count: number
  advancement: number | null
  dropOff: number | null
  dropOffCount: number | null
}

function cohort(region: RegionSelection): Omit<HistoricFunnel, 'region'> {
  const chosen = historicalFunnel.filter((item) => region === 'All Regions' || item.region === region)
  return {
    qualified: sum(chosen.map((item) => item.qualified)),
    discovery: sum(chosen.map((item) => item.discovery)),
    proposal: sum(chosen.map((item) => item.proposal)),
    negotiation: sum(chosen.map((item) => item.negotiation)),
    won: sum(chosen.map((item) => item.won)),
  }
}

export function getHistoricalFunnel(region: RegionSelection): readonly FunnelStep[] {
  const record = cohort(region)
  const points = [
    { label: 'Qualified', count: record.qualified },
    { label: 'Discovery', count: record.discovery },
    { label: 'Proposal', count: record.proposal },
    { label: 'Negotiation', count: record.negotiation },
    { label: 'Won', count: record.won },
  ]
  return points.map((point, index) => {
    const prior = index > 0 ? points[index - 1] : undefined
    const advancement = prior ? safeRatio(point.count, prior.count) : null
    return {
      label: point.label,
      count: point.count,
      advancement,
      dropOff: advancement === null ? null : 1 - advancement,
      dropOffCount: prior ? prior.count - point.count : null,
    }
  })
}

export function getHistoricalWinRate(region: RegionSelection): number | null {
  const record = cohort(region)
  return safeRatio(record.won, record.qualified)
}

/** Lowest progression rate among the four completed stage transitions. */
export function getWeakestTransition(region: RegionSelection): FunnelStep | null {
  const steps = getHistoricalFunnel(region).filter((item) => item.advancement !== null)
  return steps.reduce<FunnelStep | null>((weakest, step) =>
    weakest === null || (step.advancement ?? 1) < (weakest.advancement ?? 1) ? step : weakest, null)
}

export function getScenarioComparison(region: RegionSelection) {
  return scenarios.map((scenario) => ({ scenario, ...getForecastMetrics(region, scenario) }))
}

/** Independent source consistency and reconciliation checks; returns no errors for the bundled demonstration. */
export function getDataIssues(): readonly string[] {
  const errors: string[] = []
  const ids = new Set<string>()
  for (const item of opportunities) {
    if (ids.has(item.id)) errors.push(`Duplicate opportunity: ${item.id}`)
    ids.add(item.id)
    if (!Number.isFinite(item.value) || item.value <= 0 || !regions.includes(item.region) || !stages.includes(item.stage) || item.expectedCloseQuarter !== '2026-Q4') {
      errors.push(`Invalid open opportunity: ${item.id}`)
    }
  }
  for (const region of regions) {
    if (regionalTargets.filter((item) => item.region === region).length !== 1) errors.push(`Invalid target configuration: ${region}`)
    if (historicalFunnel.filter((item) => item.region === region).length !== 1) errors.push(`Invalid historical cohort: ${region}`)
    const record = historicalFunnel.find((item) => item.region === region)
    if (record && !(record.qualified >= record.discovery && record.discovery >= record.proposal && record.proposal >= record.negotiation && record.negotiation >= record.won && record.won >= 0)) {
      errors.push(`Funnel stages do not reconcile: ${region}`)
    }
  }
  for (const stage of stages) {
    for (const scenario of scenarios) {
      const p = getStageProbability(stage, scenario)
      if (p < 0 || p > 1 || !Number.isFinite(p)) errors.push(`Invalid scenario probability: ${stage}, ${scenario}`)
    }
  }
  for (const scenario of scenarios) {
    const entire = getForecastMetrics('All Regions', scenario)
    const acrossRegions = getRegionalComparison(scenario)
    const groupedStages = getPipelineStages('All Regions', scenario)
    const tolerance = 0.001
    if (Math.abs(entire.openPipeline - sum(acrossRegions.map((item) => item.openPipeline))) > tolerance ||
      Math.abs(entire.bookingsTarget - sum(acrossRegions.map((item) => item.bookingsTarget))) > tolerance ||
      Math.abs(entire.weightedForecast - sum(acrossRegions.map((item) => item.weightedForecast))) > tolerance ||
      Math.abs(entire.weightedForecast - sum(groupedStages.map((item) => item.weightedValue))) > tolerance) {
      errors.push(`Regional/stage forecast reconciliation failed: ${scenario}`)
    }
  }
  return errors
}
