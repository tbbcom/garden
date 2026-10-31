# Content plan: 60 articles in 6 daily batches of 10

The scheduled writer takes the first 10 rows with status `todo` each day (skipping any whose file already exists on `main` or in an open PR), writes them per `docs/WRITING-GUIDE.md`, sets them to `drafted`, and opens one PR. Merging the PR creates the Blogger drafts. **Merge one batch PR at a time** (the pipeline sends at most 10 drafts per run).

Order follows US search demand and season: lawn care first (searches peak February–April), then mulch/soil (March–May), vegetable planning (January–March), hardscape (spring), then fall and winter tasks, then "when to plant [crop]" posts (day 6) that link to the planting calendar. Garlic sits in day 1 because its searches peak in October.

Volumes are US monthly averages from Ubersuggest (Oct 2026); "–" means not checked. Each post links to the calculator in the last column with descriptive anchor text.

**Crop posts (garlic and day 6):** each must be crop-specific, not a template with the crop name swapped: the crop's own soil-temperature threshold, frost tolerance, start-indoors vs direct-sow rule, days to maturity, a dates table by USDA zone (3–10) computed from average last/first frost dates, and crop-specific mistakes. Link the planting calendar near the top ("find your exact dates by ZIP code") and again in the tool CTA. Garlic is a fall crop: plant dates are relative to the first fall frost. When the post mentions frost dates, link the NOAA data at https://tools.homegardenlot.com/frost-dates/ (anchor such as "frost dates by ZIP code"), and cite NOAA NCEI 1991–2020 U.S. Climate Normals in Sources.

**Status:** `todo` → `drafted` (in a PR / Blogger draft) → `live` (you published it; update by hand).

| # | Day | Status | File (`content/posts/…`) | Working title | Primary keyword (vol) | Label | Link to tool |
|---|---|---|---|---|---|---|---|
| 1 | 1 | drafted | when-to-fertilize-lawn.html | When to Fertilize Your Lawn: Month-by-Month Schedule by Grass Type | when to fertilize lawn (6,600) | Lawn Care | /p/lawn-fertilizer-npk-calculator.html |
| 2 | 1 | drafted | how-long-to-water-lawn.html | How Long to Water Your Lawn (Sprinkler Run Times That Work) | how long to water lawn (3,600) | Lawn Care | /p/irrigation-runtime-calculator.html |
| 3 | 1 | drafted | how-much-grass-seed-do-i-need.html | How Much Grass Seed Do I Need? Rates by Grass Type | how much grass seed do i need (1,000) | Lawn Care | /p/garden-calculator.html |
| 4 | 1 | drafted | fertilizer-numbers-npk-explained.html | What Do Fertilizer Numbers Mean? NPK Explained Simply | fertilizer numbers meaning (–) | Lawn Care | /p/lawn-fertilizer-npk-calculator.html |
| 5 | 1 | drafted | how-much-fertilizer-per-1000-sq-ft.html | How Much Fertilizer per 1,000 Sq Ft? (Pounds of Nitrogen Made Easy) | fertilizer per 1000 sq ft (–) | Lawn Care | /p/lawn-fertilizer-npk-calculator.html |
| 6 | 1 | drafted | when-to-overseed-lawn.html | When to Overseed Your Lawn (and How to Do It Right) | when to overseed lawn (–) | Lawn Care | /p/garden-calculator.html |
| 7 | 1 | drafted | cool-season-vs-warm-season-grass.html | Cool-Season vs Warm-Season Grass: Which Grows Where You Live | cool season vs warm season grass (–) | Lawn Care | /p/lawn-fertilizer-npk-calculator.html |
| 8 | 1 | drafted | how-to-measure-lawn-square-footage.html | How to Measure Your Lawn's Square Footage (Any Shape) | how to measure lawn square footage (–) | Lawn Care | /p/garden-calculator.html |
| 9 | 1 | drafted | lawn-aeration-guide.html | Lawn Aeration: When, Why and How to Aerate Your Yard | when to aerate lawn (–) | Lawn Care | /p/lawn-fertilizer-npk-calculator.html |
| 10 | 1 | drafted | when-to-plant-garlic.html | When to Plant Garlic: Fall Planting Dates by USDA Zone | when to plant garlic (6,600; 14,800 in Oct) | Vegetable | /p/planting-calendar.html |
| 11 | 2 | todo | how-deep-should-mulch-be.html | How Deep Should Mulch Be? Depth Guide by Mulch Type | how deep should mulch be (480) | Garden Maintenance | /p/mulch-calculator.html |
| 12 | 2 | todo | bagged-vs-bulk-mulch.html | Bagged vs Bulk Mulch: Cost, Quality and When Each Wins | bagged vs bulk mulch (–) | Garden Maintenance | /p/mulch-calculator.html |
| 13 | 2 | todo | when-to-mulch.html | When to Mulch: Best Time in Spring and Fall | when to mulch (–) | Garden Maintenance | /p/mulch-calculator.html |
| 14 | 2 | todo | best-mulch-for-vegetable-garden.html | Best Mulch for Vegetable Gardens (and What to Avoid) | best mulch for vegetable garden (–) | Vegetable | /p/mulch-calculator.html |
| 15 | 2 | todo | rubber-mulch-vs-wood-mulch.html | Rubber Mulch vs Wood Mulch: Honest Pros, Cons and Costs | rubber mulch vs wood mulch (–) | Garden Maintenance | /p/mulch-calculator.html |
| 16 | 2 | todo | how-much-soil-for-raised-bed.html | How Much Soil for a Raised Bed? Charts for Every Size | how much soil for raised bed (–) | Vegetable | /p/soil-calculator.html |
| 17 | 2 | todo | best-soil-mix-for-raised-beds.html | The Best Soil Mix for Raised Beds (Simple Recipe) | raised bed soil mix (–) | Vegetable | /p/soil-calculator.html |
| 18 | 2 | todo | topsoil-vs-garden-soil-vs-potting-mix.html | Topsoil vs Garden Soil vs Potting Mix: Which to Use Where | topsoil vs garden soil (–) | Garden Maintenance | /p/soil-calculator.html |
| 19 | 2 | todo | how-to-calculate-cubic-yards.html | How to Calculate Cubic Yards for Soil, Mulch and Gravel | how to calculate cubic yards (–) | Garden Maintenance | /p/topsoil-gravel-calculator.html |
| 20 | 2 | todo | how-to-improve-clay-soil.html | How to Improve Clay Soil for Gardening | how to improve clay soil (–) | Organic Gardening | /p/soil-calculator.html |
| 21 | 3 | drafted | square-foot-gardening-spacing-chart.html | Square Foot Gardening Spacing Chart (Plants per Square) | square foot gardening spacing (210) | Vegetable | /p/plant-spacing-calculator.html |
| 22 | 3 | drafted | how-many-plants-per-raised-bed.html | How Many Plants Fit in a 4x8 Raised Bed? | how many plants in a 4x8 raised bed (–) | Vegetable | /p/plant-spacing-calculator.html |
| 23 | 3 | drafted | tomato-plant-spacing.html | Tomato Plant Spacing: How Far Apart to Plant Tomatoes | tomato plant spacing (–) | Vegetable | /p/plant-spacing-calculator.html |
| 24 | 3 | drafted | vegetable-garden-layout-for-beginners.html | Vegetable Garden Layout for Beginners (Plans You Can Copy) | vegetable garden layout (–) | Vegetable | /p/plant-spacing-calculator.html |
| 25 | 3 | drafted | companion-planting-chart.html | Companion Planting Chart: Good and Bad Vegetable Neighbors | companion planting chart (–) | Organic Gardening | /p/plant-spacing-calculator.html |
| 26 | 3 | drafted | when-to-start-seeds-indoors.html | When to Start Seeds Indoors (Calendar by Last Frost Date) | when to start seeds indoors (–) | Vegetable | /p/planting-calendar.html |
| 27 | 3 | drafted | usda-hardiness-zones-explained.html | USDA Hardiness Zones Explained (and Why They Matter) | usda hardiness zones (–) | Gardening | /p/planting-calendar.html |
| 28 | 3 | drafted | how-to-build-a-raised-garden-bed.html | How to Build a Raised Garden Bed: Materials, Cost and Steps | how to build a raised garden bed (–) | Vegetable | /p/soil-calculator.html |
| 29 | 3 | drafted | how-deep-should-a-raised-bed-be.html | How Deep Should a Raised Bed Be? Depth by Crop | how deep should a raised bed be (–) | Vegetable | /p/soil-calculator.html |
| 30 | 3 | drafted | composting-for-beginners.html | Composting for Beginners: A Simple Backyard Method | how to start composting (–) | Composting | /p/garden-calculator.html |
| 31 | 4 | todo | how-many-pavers-do-i-need.html | How Many Pavers Do I Need? Formula and Examples | how many pavers do i need (390) | Home Improvement | /p/paver-patio-calculator.html |
| 32 | 4 | todo | paver-base-gravel-and-sand.html | How Much Gravel and Sand Under Pavers? Base Depth Guide | paver base depth (–) | Home Improvement | /p/paver-patio-calculator.html |
| 33 | 4 | todo | paver-patio-cost.html | How Much Does a Paver Patio Cost? DIY vs Pro Breakdown | paver patio cost (–) | Home Improvement | /p/paver-patio-calculator.html |
| 34 | 4 | todo | how-much-flooring-do-i-need.html | How Much Flooring Do I Need? Square Footage and Waste Factor | how much flooring do i need (480) | Home Improvement | /p/flooring-calculator.html |
| 35 | 4 | todo | laminate-vs-vinyl-plank-flooring.html | Laminate vs Vinyl Plank Flooring: Which Is Better for You? | laminate vs vinyl plank (–) | Home Improvement | /p/flooring-calculator.html |
| 36 | 4 | todo | how-to-build-a-gravel-path.html | How to Build a Gravel Path (Materials and Steps) | how to build a gravel path (–) | Home Improvement | /p/topsoil-gravel-calculator.html |
| 37 | 4 | todo | landscape-edging-ideas.html | Landscape Edging Ideas: Materials Compared by Cost and Effort | landscape edging ideas (–) | Home Improvement | /p/mulch-calculator.html |
| 38 | 4 | todo | how-to-level-ground-for-a-patio.html | How to Level Ground for a Patio or Shed Base | how to level ground for patio (–) | Home Improvement | /p/topsoil-gravel-calculator.html |
| 39 | 4 | todo | drip-irrigation-for-raised-beds.html | Drip Irrigation for Raised Beds: Simple Setup and Run Times | drip irrigation for raised beds (–) | Gardening | /p/irrigation-runtime-calculator.html |
| 40 | 4 | todo | how-much-topsoil-do-i-need.html | How Much Topsoil Do I Need for a Lawn or Garden? | how much topsoil do i need (–) | Garden Maintenance | /p/topsoil-gravel-calculator.html |
| 41 | 5 | todo | fall-garden-cleanup-checklist.html | Fall Garden Cleanup Checklist (What to Cut, Leave and Mulch) | fall garden cleanup (–) | Garden Maintenance | /p/mulch-calculator.html |
| 42 | 5 | todo | how-to-protect-plants-from-frost.html | How to Protect Plants from Frost (Fast Fixes That Work) | how to protect plants from frost (–) | Gardening | /p/garden-calculator.html |
| 43 | 5 | todo | winter-pruning-guide.html | Winter Pruning Guide: What to Prune and What to Leave | winter pruning (–) | Garden Maintenance | /p/garden-calculator.html |
| 44 | 5 | todo | how-to-winterize-raised-beds.html | How to Winterize Raised Garden Beds | winterize raised beds (–) | Vegetable | /p/soil-calculator.html |
| 45 | 5 | todo | cover-crops-for-home-gardens.html | Cover Crops for Home Gardens: Easy Winter Soil Builders | cover crops for home garden (–) | Organic Gardening | /p/soil-calculator.html |
| 46 | 5 | todo | how-to-test-soil-ph.html | How to Test Soil pH at Home (and Fix It) | how to test soil ph (–) | Organic Gardening | /p/soil-calculator.html |
| 47 | 5 | todo | how-to-kill-weeds-naturally.html | How to Kill Weeds Naturally Without Harming Your Garden | how to kill weeds naturally (–) | Organic Gardening | /p/mulch-calculator.html |
| 48 | 5 | todo | spring-garden-checklist.html | Spring Garden Checklist: Month-by-Month To-Do List | spring garden checklist (–) | Garden Maintenance | /p/garden-calculator.html |
| 49 | 5 | todo | winter-houseplant-care.html | Winter Houseplant Care: Light, Water and Humidity Fixes | winter houseplant care (–) | Gardening | /p/garden-calculator.html |
| 50 | 5 | todo | garden-tool-maintenance.html | Garden Tool Maintenance: Clean, Sharpen and Store for Winter | garden tool maintenance (–) | Garden Maintenance | /p/garden-calculator.html |
| 51 | 6 | todo | when-to-plant-tomatoes.html | When to Plant Tomatoes: Dates by Zone and Last Frost | when to plant tomatoes (8,100; 27,100 in Mar–Apr) | Vegetable | /p/planting-calendar.html |
| 52 | 6 | todo | when-to-plant-potatoes.html | When to Plant Potatoes: Soil Temperature and Dates by Zone | when to plant potatoes (8,100; 22,200 in Mar) | Vegetable | /p/planting-calendar.html |
| 53 | 6 | todo | when-to-plant-strawberries.html | When to Plant Strawberries: Spring vs Fall by Zone | when to plant strawberries (5,400; 18,100 in Mar) | Vegetable | /p/planting-calendar.html |
| 54 | 6 | todo | when-to-plant-pumpkins.html | When to Plant Pumpkins for a Halloween Harvest | when to plant pumpkins (5,400; 12,100 in Jul–Aug) | Vegetable | /p/planting-calendar.html |
| 55 | 6 | todo | when-to-plant-onions.html | When to Plant Onions: Sets, Seeds and Day Length by Zone | when to plant onions (3,600; 8,100 in Mar) | Vegetable | /p/planting-calendar.html |
| 56 | 6 | todo | when-to-plant-carrots.html | When to Plant Carrots: Spring and Fall Sowing Dates | when to plant carrots (3,600; 9,900 in Mar–Apr) | Vegetable | /p/planting-calendar.html |
| 57 | 6 | todo | when-to-plant-cucumbers.html | When to Plant Cucumbers: Soil Temperature and Dates | when to plant cucumbers (2,900; 8,100 in Mar–Apr) | Vegetable | /p/planting-calendar.html |
| 58 | 6 | todo | when-to-plant-watermelon.html | When to Plant Watermelon: Dates by Zone and Soil Temp | when to plant watermelon (1,900; 5,400 in Apr) | Vegetable | /p/planting-calendar.html |
| 59 | 6 | todo | when-to-plant-green-beans.html | When to Plant Green Beans: Dates and Succession Sowing | when to plant green beans (1,600; 5,400 in Apr) | Vegetable | /p/planting-calendar.html |
| 60 | 6 | todo | how-much-gravel-do-i-need.html | How Much Gravel Do I Need? Tons, Yards and Bags Explained | how much gravel do i need (2,400) | Garden Maintenance | /p/topsoil-gravel-calculator.html |
