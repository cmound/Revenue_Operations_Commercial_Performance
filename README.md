# Revenue Operations & Commercial Performance

**An interactive commercial forecasting, pipeline-conversion, and executive decision-support portfolio project.**

[Explore the live application](https://cmound.github.io/Revenue_Operations_Commercial_Performance/) · [View the GitHub repository](https://github.com/cmound/Revenue_Operations_Commercial_Performance)

> **Synthetic demonstration data:** Crescent Harbor Business Services is a fictional company. Every opportunity, territory, historical conversion count, bookings target, probability assumption, and recommendation is illustrative. The app uses no real company, customer, or CRM information. Forecasted bookings are not recognized revenue, guaranteed results, or financial advice.

## Business objective

Revenue leaders must distinguish a large sales pipeline from bookings they can reasonably expect, identify where opportunities stop progressing, and weigh commercial decisions against targets. This demonstration connects those questions in three complementary views, moving from **performance visibility** to **conversion diagnosis** to **scenario-based planning**.

The emphasis is on **business analysis, revenue management, commercial forecasting, and managerial judgment**, not software development as a profession.

## Explore the three views

| View | Management question | Interactive analysis |
| --- | --- | --- |
| **01. Revenue Command Center** | How much of the Q4 bookings target is supported by the open pipeline? | Opportunity value, weighted forecast, forecast-to-target gap, stage mix, and executive decision brief. |
| **02. Sales Funnel & Bottlenecks** | At which step did historical opportunities have the weakest progression? | Qualified-to-won cohort funnel, stage-to-stage conversion, drop-off counts, and management review priorities. |
| **03. Forecast & Territory Review** | How would alternative close-probability assumptions change expected bookings? | Conservative/Base/Upside comparisons, territory-level forecast table, target gaps, and scenario-specific executive recommendations. |

**Filters:** Select **All Regions**, **West**, **Central**, or **East**, and choose a **Conservative**, **Base**, or **Upside** forecast scenario. All applicable figures, comparisons, and written insights are calculated from the selected records and assumptions.

## Example of the analytical reasoning

For the full synthetic **Q4 2026 opportunity snapshot** under the **Base** assumptions:

| Measure | Illustration | Interpretation |
| --- | ---: | --- |
| Open opportunities | 15 | Opportunities expected to close in Q4, not completed transactions. |
| Open pipeline value | $12,070,000 | Total unweighted opportunity value; not a revenue result. |
| Probability-weighted expected bookings | $5,626,000 | Stage-weighted planning estimate, not guaranteed bookings. |
| Q4 bookings target | $6,600,000 | Fictional combined regional target. |
| Modeled target gap | −$974,000 | Base forecast is approximately 85.2% of target. |
| Historical qualified-to-won yield | 59 / 420 = 14.0% | Share of the **resolved historical qualification cohort** that ultimately won, separate from the Q4 pipeline. |

The historical funnel progresses from **420 qualified** opportunities to **275 discovery**, **160 proposal**, **92 negotiation**, and **59 won**. The lowest stage-to-stage advancement rate in the pooled cohort is **Proposal to Negotiation (92 / 160 = 57.5%)**. This identifies a sensible area for investigation; it does **not** establish why opportunities failed to advance.

### Illustrative scenarios

The Base stage close probabilities are **15% Qualification**, **30% Discovery**, **55% Proposal**, and **80% Negotiation**. The Conservative scenario applies a **0.85×** multiplier; the Upside scenario applies **1.15×**. Probabilities are capped at 100%.

| Scenario | Weighted expected bookings | Gap against $6.60M target |
| --- | ---: | ---: |
| Conservative | $4,782,100 | −$1,817,900 |
| Base | $5,626,000 | −$974,000 |
| Upside | $6,469,900 | −$130,100 |

This is a **transparent sensitivity analysis**, not a statistical prediction. Historical funnel advancement percentages are **not** substituted automatically for stage close probabilities.

## Calculation definitions

- **Open pipeline:** Sum of open Q4 opportunity values for the selected region.
- **Weighted expected bookings:** Sum of `opportunity value × assumed stage close probability`.
- **Forecast attainment:** Weighted expected bookings ÷ bookings target.
- **Forecast gap:** Weighted expected bookings − bookings target.
- **Pipeline coverage:** Unweighted open pipeline ÷ bookings target.
- **Stage advancement:** Opportunities entering the next stage ÷ opportunities in the preceding stage, within the historical resolved cohort.
- **Historical qualified-to-won yield:** Won opportunities ÷ originally qualified opportunities in that cohort. This differs from the conventional won ÷ (won + lost) rate because explicit lost-deal outcomes are not separately tracked in this example.

**Reconciliation:** The combined regional targets, open opportunity values, and weighted forecasts equal their company totals. Stage-weighted opportunity values also sum to the company forecast. Source checks flag duplicates, invalid amounts, inconsistent funnel counts, and broken regional reconciliation.

## Decision-support boundaries

Executive recommendations highlight where a manager might investigate risk, such as a low stage advancement rate or a gap to forecast target. Because the underlying records are synthetic and simplified, the application does **not** claim that a specific sales behavior caused a shortfall or that changing a probability will produce that outcome.

Opportunity values and forecast assumptions are illustrative. They omit revenue-recognition timing, changes in deal values, detailed contract terms, sales-cycle distributions, and forecast confidence intervals.

## Technology and design

- **React + TypeScript:** Typed business records, interactive region/scenario selection, and calculation-driven rendering.
- **Vite:** Local development and production builds.
- **CSS:** Distinctive desktop/laptop commercial-intelligence interface with visible labels and non-color status cues.
- **GitHub Actions + GitHub Pages:** Automated linting, production builds, and deployment to static hosting.
- **No backend:** No credentials, database, cloud synchronization, external API, or user-account information is required.

The source is deliberately compact: `src/App.tsx` provides the three views; `src/App.css` styles them; `src/demoData.ts` contains synthetic records; and `src/metrics.ts` contains the computations and reconciliation checks.

## Run locally

Requires a compatible Node.js version and npm.

```powershell
npm ci
npm run lint -- --max-warnings=0
npm run build
npm run dev
```

To inspect the built application locally, run `npm run preview` after a successful build and use the URL printed by Vite.

## Portfolio screenshots

High-resolution screenshots of the **Revenue Command Center**, **Sales Funnel & Bottlenecks**, and **Forecast & Territory Review** will be added after the deployed application is visually verified. No example dashboard images are used in place of actual application screenshots.

---

**Live demo:** https://cmound.github.io/Revenue_Operations_Commercial_Performance/  
**Repository:** https://github.com/cmound/Revenue_Operations_Commercial_Performance
