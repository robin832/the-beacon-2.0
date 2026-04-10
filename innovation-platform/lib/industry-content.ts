// Static industry content shown on the analysis loading screen.
// Curated facts and headlines per vertical, used by the split-view loader
// while the Edge Function runs in the background.
//
// TODO: Replace with dynamic content from an n8n workflow that fetches recent
// headlines from curated source RSS feeds per vertical (weekly) and stores them
// in a Supabase table. The IndustryBriefing component would then query that
// table instead of reading from this static file. For now, headlines link to
// the source homepage so users always have somewhere to click through.

export interface IndustryFact {
  stat: string;
  source: string;
}

export interface IndustryHeadline {
  title: string;
  source: string;
  date: string;
  snippet: string;
  url?: string;
}

export interface IndustryContent {
  facts: IndustryFact[];
  headlines: IndustryHeadline[];
}

const DEFAULT_CONTENT: IndustryContent = {
  facts: [
    { stat: "Only 23% of Belgian industrial companies have a formal digital transformation strategy in place.", source: "VLAIO Digital Barometer" },
    { stat: "The Port of Antwerp-Bruges processes 290 million tonnes of cargo per year — Europe's second largest port.", source: "Port of Antwerp-Bruges" },
    { stat: "Belgian companies invest 3.4% of GDP in R&D — above the EU average of 2.3%.", source: "Eurostat" },
    { stat: "The Beacon connects over 200 member companies across 5 industrial verticals.", source: "The Beacon" },
    { stat: "Flanders ranks in the top 5 innovation regions in the EU according to the Regional Innovation Scoreboard.", source: "European Commission" },
  ],
  headlines: [
    { title: "Belgian innovation ecosystem expands with new cross-sector partnerships", source: "VLAIO", date: "Q1 2025", snippet: "VLAIO reports a 15% year-over-year increase in formal innovation collaborations between Belgian industrial firms and tech scale-ups.", url: "https://www.vlaio.be/en" },
    { title: "EU Green Deal drives €200B investment in European industrial decarbonization", source: "European Commission", date: "Q1 2025", snippet: "Belgian industrial clusters are positioned to capture a significant share of the green transition funding.", url: "https://commission.europa.eu/strategy-and-policy/priorities-2019-2024/european-green-deal_en" },
  ],
};

export const INDUSTRY_CONTENT: Record<string, IndustryContent> = {
  "Maritime & Port": {
    facts: [
      { stat: "The Port of Antwerp-Bruges processes 290 million tonnes of cargo annually — making it Europe's second largest port.", source: "Port of Antwerp-Bruges" },
      { stat: "IMO regulations require a 40% CO₂ reduction by 2030 and 70% by 2050 for international shipping.", source: "International Maritime Organization" },
      { stat: "Port of Antwerp-Bruges aims to become Europe's leading green hydrogen import hub by 2028.", source: "Port of Antwerp-Bruges" },
      { stat: "Only 18% of European ports have a fully integrated digital twin system.", source: "IAPH" },
      { stat: "Belgian maritime cluster companies employ over 115,000 people across the port ecosystem.", source: "Blue Cluster" },
    ],
    headlines: [
      { title: "Port of Antwerp-Bruges launches AI traffic management for inland shipping", source: "Flows.be", date: "Q1 2025", snippet: "The port authority deployed a new AI-powered system to optimize barge traffic along the Scheldt corridor, reducing waiting times by up to 25%.", url: "https://en.flows.be" },
      { title: "Blue Cluster announces €20M innovation fund for maritime tech scale-ups", source: "Blue Cluster", date: "Q1 2025", snippet: "Flemish maritime innovation cluster launches a dedicated fund to accelerate autonomous shipping and green port technology startups.", url: "https://www.bluecluster.be/news" },
      { title: "FuelEU Maritime: what it means for Belgian operators in 2026", source: "EMSA", date: "Q1 2025", snippet: "The new regulation on greenhouse gas intensity of fuels applies to all ships above 5,000 GT calling at EU ports from January 2026.", url: "https://www.emsa.europa.eu" },
    ],
  },
  "Chemical & Process Industry": {
    facts: [
      { stat: "Belgium is home to the second largest chemical cluster in Europe, concentrated along the Antwerp-Rotterdam-Rhine corridor.", source: "Essenscia" },
      { stat: "The Belgian chemical sector invested €2.7B in R&D in 2024 — 4.8% of revenue.", source: "Essenscia" },
      { stat: "Over 60% of Belgian chemical companies have committed to reducing CO₂ emissions by 2030.", source: "CEFIC" },
      { stat: "BlueChem is Belgium's first dedicated cleantech chemistry incubator, hosting 20+ chemistry startups.", source: "BlueChem" },
      { stat: "Catalisti coordinates over 50 collaborative R&D projects between chemical companies and research institutions.", source: "Catalisti" },
    ],
    headlines: [
      { title: "Essenscia reports 12% increase in chemical sector R&D spend for 2024", source: "Essenscia", date: "Q1 2025", snippet: "Belgian chemical federation highlights the sector's continued commitment to innovation despite economic headwinds, with digital transformation projects leading the increase.", url: "https://www.essenscia.be/en" },
      { title: "EU Chemicals Strategy for Sustainability enters second implementation phase", source: "EU Commission", date: "Q1 2025", snippet: "New requirements on substance-of-concern reporting and safe-by-design products will apply to Belgian chemical manufacturers from mid-2026.", url: "https://ec.europa.eu/environment/chemicals" },
      { title: "Catalisti funds €8M project for circular polymers technology", source: "Catalisti", date: "Q1 2025", snippet: "A consortium of 7 Flemish chemical companies joins forces to develop advanced recycling technology for polyolefin streams.", url: "https://www.catalisti.be/en" },
    ],
  },
  "Logistics & Supply Chain": {
    facts: [
      { stat: "Belgium's logistics sector contributes over 11% to national GDP and employs 250,000 people.", source: "VIL" },
      { stat: "Only 30% of Belgian logistics companies have real-time supply chain visibility across their network.", source: "VIL Digital Barometer" },
      { stat: "Flanders ranks among the top 3 logistics hubs in Europe by the World Bank LPI.", source: "World Bank LPI" },
      { stat: "Over 40% of European warehouse automation investments flow through Belgian distribution centers.", source: "VIL" },
      { stat: "Antwerp is connected to 800+ ports globally, handling freight flows to every continent.", source: "Port of Antwerp-Bruges" },
    ],
    headlines: [
      { title: "VIL launches open innovation platform for Belgian logistics SMEs", source: "VIL", date: "Q1 2025", snippet: "The Flemish logistics institute connects SMEs with tech scale-ups to tackle shared challenges in last-mile, visibility, and decarbonization.", url: "https://www.vil.be/en" },
      { title: "CBAM takes effect: what Belgian logistics providers need to know", source: "EU Commission", date: "Q1 2025", snippet: "The Carbon Border Adjustment Mechanism's full reporting phase begins January 2026, affecting Belgian importers of steel, aluminium, and chemicals.", url: "https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism_en" },
      { title: "Port of Antwerp-Bruges pilots autonomous truck corridor with 5 logistics operators", source: "Flows.be", date: "Q1 2025", snippet: "A new pilot tests Level 4 autonomous trucks for container transport between terminals, targeting 15% efficiency gains.", url: "https://en.flows.be" },
    ],
  },
  "Manufacturing & Engineering": {
    facts: [
      { stat: "Flanders Make coordinates research for over 500 Belgian manufacturers, spanning mechatronics, vehicles, and smart factories.", source: "Flanders Make" },
      { stat: "Sirris supports 2,500+ Belgian industrial SMEs with applied technology projects each year.", source: "Sirris" },
      { stat: "Only 35% of Belgian manufacturers have moved beyond pilot projects for Industry 4.0 technologies.", source: "Agoria" },
      { stat: "Belgian technology industry employs 320,000 people across manufacturing, engineering, and ICT.", source: "Agoria" },
      { stat: "The Made Different program has guided 400+ Belgian factories through digital transformation roadmaps.", source: "Agoria, Sirris" },
    ],
    headlines: [
      { title: "Agoria pushes for €500M acceleration plan for Belgian smart manufacturing", source: "Agoria", date: "Q1 2025", snippet: "Belgian tech industry federation proposes a national investment plan to accelerate Industry 4.0 adoption among mid-sized manufacturers.", url: "https://www.agoria.be/en" },
      { title: "Flanders Make opens new research center for circular manufacturing", source: "Flanders Make", date: "Q1 2025", snippet: "The strategic research center launches a dedicated lab for disassembly, remanufacturing, and material recovery technology.", url: "https://www.flandersmake.be/en" },
      { title: "EU Machinery Regulation 2026: new cyber-security requirements for connected equipment", source: "European Commission", date: "Q1 2025", snippet: "Belgian machine builders must comply with new digital safety and cyber-resilience requirements by mid-2026.", url: "https://single-market-economy.ec.europa.eu/sectors/mechanical-engineering/machinery_en" },
    ],
  },
  "Technology & Software": {
    facts: [
      { stat: "imec is one of the world's leading nanoelectronics research centers, with €700M+ annual R&D spend.", source: "imec" },
      { stat: "Belgium hosts 5,000+ active tech startups, with Flanders accounting for 70% of them.", source: "VLAIO, Start it @KBC" },
      { stat: "Start it @KBC has supported over 1,500 tech startups, with a combined valuation above €2B.", source: "Start it @KBC" },
      { stat: "The EU AI Act creates new compliance obligations for high-risk AI systems, including many enterprise SaaS tools.", source: "European Commission" },
      { stat: "Belgian SaaS companies raised a record €680M in 2024 across seed, Series A, and growth rounds.", source: "Sifted, Tech.eu" },
    ],
    headlines: [
      { title: "Belgian AI startups raise record funding as EU AI Act takes shape", source: "Sifted", date: "Q1 2025", snippet: "Flemish deep-tech scale-ups secure €120M in Q1 2025 as investors bet on AI companies built with regulation-by-design principles.", url: "https://sifted.eu" },
      { title: "imec unveils new chiplet interconnect technology with European partners", source: "imec", date: "Q1 2025", snippet: "The research center announces a breakthrough in 3D chiplet integration, strengthening Europe's semiconductor autonomy.", url: "https://www.imec-int.com/en" },
      { title: "Start it @KBC launches dedicated cyber-security accelerator cohort", source: "Start it @KBC", date: "Q1 2025", snippet: "Belgian startup accelerator opens applications for a vertical-focused program addressing NIS2, DORA, and Cyber Resilience Act challenges.", url: "https://startit.be" },
    ],
  },
};

/**
 * Returns content for the given industry, falling back to defaults when unknown.
 */
export function getIndustryContent(industry: string | null | undefined): IndustryContent {
  if (!industry) return DEFAULT_CONTENT;
  return INDUSTRY_CONTENT[industry] || DEFAULT_CONTENT;
}
