/** Entirely fictional demonstration business and sales records; USD. */
export type Region = 'West' | 'Central' | 'East'
export type RegionSelection = Region | 'All Regions'
export type Stage = 'Qualification' | 'Discovery' | 'Proposal' | 'Negotiation'
export type Scenario = 'Conservative' | 'Base' | 'Upside'

export const regions: readonly Region[] = ['West', 'Central', 'East']
export const stages: readonly Stage[] = ['Qualification', 'Discovery', 'Proposal', 'Negotiation']
export const scenarios: readonly Scenario[] = ['Conservative', 'Base', 'Upside']

export interface Opportunity {
  id: string
  region: Region
  stage: Stage
  value: number
  expectedCloseQuarter: '2026-Q4'
}

/** Q4 opportunity snapshot, not closed sales or recognized revenue. */
export const opportunities: readonly Opportunity[] = [
  { id: 'CH-101', region: 'West', stage: 'Negotiation', value: 1_200_000, expectedCloseQuarter: '2026-Q4' },
  { id: 'CH-102', region: 'West', stage: 'Proposal', value: 900_000, expectedCloseQuarter: '2026-Q4' },
  { id: 'CH-103', region: 'West', stage: 'Discovery', value: 1_050_000, expectedCloseQuarter: '2026-Q4' },
  { id: 'CH-104', region: 'West', stage: 'Qualification', value: 500_000, expectedCloseQuarter: '2026-Q4' },
  { id: 'CH-105', region: 'West', stage: 'Proposal', value: 800_000, expectedCloseQuarter: '2026-Q4' },
  { id: 'CH-201', region: 'Central', stage: 'Negotiation', value: 750_000, expectedCloseQuarter: '2026-Q4' },
  { id: 'CH-202', region: 'Central', stage: 'Proposal', value: 1_000_000, expectedCloseQuarter: '2026-Q4' },
  { id: 'CH-203', region: 'Central', stage: 'Discovery', value: 950_000, expectedCloseQuarter: '2026-Q4' },
  { id: 'CH-204', region: 'Central', stage: 'Qualification', value: 750_000, expectedCloseQuarter: '2026-Q4' },
  { id: 'CH-205', region: 'Central', stage: 'Proposal', value: 520_000, expectedCloseQuarter: '2026-Q4' },
  { id: 'CH-301', region: 'East', stage: 'Negotiation', value: 650_000, expectedCloseQuarter: '2026-Q4' },
  { id: 'CH-302', region: 'East', stage: 'Proposal', value: 800_000, expectedCloseQuarter: '2026-Q4' },
  { id: 'CH-303', region: 'East', stage: 'Discovery', value: 900_000, expectedCloseQuarter: '2026-Q4' },
  { id: 'CH-304', region: 'East', stage: 'Qualification', value: 750_000, expectedCloseQuarter: '2026-Q4' },
  { id: 'CH-305', region: 'East', stage: 'Discovery', value: 550_000, expectedCloseQuarter: '2026-Q4' },
]

export interface RegionTarget {
  region: Region
  bookingsTarget: number
}

/** Illustrative bookings objectives for Q4 2026. */
export const regionalTargets: readonly RegionTarget[] = [
  { region: 'West', bookingsTarget: 2_600_000 },
  { region: 'Central', bookingsTarget: 2_200_000 },
  { region: 'East', bookingsTarget: 1_800_000 },
]

/** Subjective scenario assumptions, NOT derived from the historical funnel. */
export const stageProbabilities: Readonly<Record<Stage, number>> = {
  Qualification: 0.15,
  Discovery: 0.30,
  Proposal: 0.55,
  Negotiation: 0.80,
}

/** A multiplier applies to every stage probability. All resulting values are <= 1. */
export const scenarioMultipliers: Readonly<Record<Scenario, number>> = {
  Conservative: 0.85,
  Base: 1,
  Upside: 1.15,
}

/** Historical, resolved qualification cohort (not the open Q4 pipeline). */
export interface HistoricFunnel {
  region: Region
  qualified: number
  discovery: number
  proposal: number
  negotiation: number
  won: number
}

export const historicalFunnel: readonly HistoricFunnel[] = [
  { region: 'West', qualified: 160, discovery: 112, proposal: 70, negotiation: 45, won: 32 },
  { region: 'Central', qualified: 140, discovery: 91, proposal: 52, negotiation: 29, won: 18 },
  { region: 'East', qualified: 120, discovery: 72, proposal: 38, negotiation: 18, won: 9 },
]
