# Example brief — Azure food waste project deck

A filled-in **Part B** brief for `../presentation-agent.md`, grounded in `P5.pdf` from the
repo root. Paste the agent prompt first, then everything inside the fence below.

The source doc is written as interview prep ("Interview Point", "You can say:"), so this
brief frames the deck as a **project walkthrough for a data engineering interview panel**.
Swap the AUDIENCE and PURPOSE lines if you need the college-review or stakeholder version.

```
Build a presentation from the material below.

AUDIENCE:      A data engineering interview panel — a hiring manager plus two senior data
               engineers. They know Azure, star schemas, and medallion architecture cold.
               They care about whether I made real engineering decisions and can defend
               them, not whether I can list services.
PURPOSE:       Persuade — leave the panel confident I can own an end-to-end Azure pipeline
               from ingestion through the serving layer.
LENGTH:        12 minutes / 10 content slides + appendix
FORMAT:        .pptx, 16:9
TONE:          Professional, plain-spoken, no hype. First person, past tense.
THEME:         Light background, single blue accent (#0B6BCB), sans-serif. No emoji, no
               clip art, no Azure marketing imagery.
MUST INCLUDE:  - One full-width architecture diagram: source systems -> ADF -> ADLS
                 (Raw/Clean/Curated) -> Databricks -> Synapse -> Power BI, with the three
                 data types labeled at their entry points.
               - A star schema slide: fact tables (Waste, Consumption) and dimensions
                 (Date, Food Item, Menu).
               - The three KPI formulas, written out.
               - A slide on why Synapse is the serving layer rather than querying the
                 curated lake directly — this is the question the panel will actually ask.
               - A testing slide; most candidates skip testing and it is a differentiator.
MUST AVOID:    - Bulleted service inventories with no decision behind them.
               - Claiming measured results. The source has no observed numbers — every
                 outcome in it is expected, not achieved. Say so on the slide.
               - Pitching future enhancements as if they were built.
ONE-PASS:      yes — build straight through to the .pptx, then show me the outline you used.

SOURCE MATERIAL:

## Project Title
Data-Driven Food Waste Management System using Azure Data Engineering Stack

## Project Goal
Build an end-to-end data engineering pipeline using Azure services to analyze and reduce
cafeteria food waste using structured, semi-structured, and unstructured data. The system
helps: reduce food waste; improve preparation planning; track attendance vs food demand;
monitor student feedback; support data-driven decision making.

## Business Problem
Cafeterias prepare food based on assumptions, leading to excess food waste, financial
loss, poor menu planning, and storage issues. This project uses data pipelines plus
analytics to solve this.

## Data Types Used
- **Structured** — stored in Synapse tables: attendance, food prepared quantity, food
  consumed quantity, food waste quantity, ratings.
- **Semi-structured** — stored in ADLS as JSON: menu plan JSON, feedback JSON, kitchen
  logs. Processed using Databricks.
- **Unstructured** — stored in ADLS blob: food waste images, text feedback, optional
  voice complaints.

## Azure Services Used
| Service | Purpose |
|---|---|
| Azure Data Factory | Data ingestion |
| Azure Data Lake Storage | Data storage (Raw, Clean, Curated) |
| Azure Databricks | Data transformation |
| Azure Synapse Analytics | Data warehouse + SQL analytics |
| Power BI | Dashboard and reporting |

## End-to-End Data Pipeline
1. **Ingestion (ADF)** — loads CSV attendance data, JSON menu data, feedback data, and
   image metadata into the ADLS Raw layer.
2. **Processing (Databricks)** — data cleaning, unit conversion (grams to kg), joining
   multiple datasets, KPI calculations. Output stored in the ADLS Curated layer.
3. **Warehousing (Azure Synapse)** — creating data warehouse tables, star schema
   modeling, SQL analytics queries, creating views for Power BI, fast reporting queries.
   Fact tables: Waste, Consumption. Dimension tables: Date, Food Item, Menu.
4. **Visualization (Power BI)** — connects to Synapse SQL views. Dashboards show waste
   trends, efficiency metrics, menu performance, attendance vs waste.

## Why Azure Synapse Is Important (interview point)
Synapse is used as the serving and analytics layer where curated data is stored in star
schema format and exposed through SQL views for reporting and dashboarding.

## KPIs Calculated
- Waste % = Waste Qty / Prepared Qty x 100
- Consumption Efficiency % = Consumed / Prepared x 100
- Waste Per Student = Waste Kg / Attendance

## Testing Strategy
- **Data quality tests** — no null dates, no negative waste, attendance > 0.
- **Pipeline tests** — ADF pipeline run success, Databricks job success, Synapse tables
  updated.
- **Reporting tests** — Power BI refresh success, KPI values valid.

## Data Architecture Layers
- Raw Layer (ADLS) — original data (CSV, JSON, images)
- Clean Layer (ADLS) — validated and standardized data
- Curated Layer (ADLS + Synapse) — business-ready data and warehouse tables

## Expected Business Outcome
Reduced food waste, better food planning, cost savings, improved student satisfaction.
(Expected — no measured results yet.)

## Future Enhancements
ML-based demand prediction, real-time streaming data, image-based waste detection.
```

## Variants

Change these two lines to retarget the same source:

| Deck | AUDIENCE | PURPOSE |
|---|---|---|
| College review | Faculty panel, mixed technical depth, grading on scope and rigor | Inform — show the full scope and that it works end to end |
| Stakeholder pitch | Cafeteria manager and finance lead, non-technical | Persuade — approve a pilot; lead with cost, not architecture |
| Team handover | Engineers who will run the pipeline | Teach — they can operate and debug it without me |
