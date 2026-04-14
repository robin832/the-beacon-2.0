// Static industry content shown on the analysis loading screen.
// Curated facts, headlines, quotes, and poll data per vertical, used by the
// split-view loader while the Edge Function runs in the background.
//
// Last updated: 2026-04-14
//
// TODO: Replace with dynamic content from an n8n workflow that fetches recent
// headlines from curated source RSS feeds per vertical (weekly) and stores them
// in a Supabase table. The IndustryBriefing component would then query that
// table instead of reading from this static file.
//
// RECENCY RULE: Headlines should ideally be max 1 month old. When the dynamic
// n8n pipeline lands, filter for `published_at > now() - interval '30 days'`.
// For this static file, when Robin (or whoever) refreshes the content, bump the
// `Last updated` date above and replace stale headlines with current-quarter
// items from the curated source list.

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

export interface IndustryQuote {
  text: string;
  attribution?: string;
}

export interface PollOption {
  id: string;
  label: string;
  icon: string;
  percentage: number;
}

export interface IndustryPoll {
  question: string;
  options: PollOption[];
}

export interface IndustryContent {
  facts: IndustryFact[];
  headlines: IndustryHeadline[];
  quotes: IndustryQuote[];
  polls: IndustryPoll[];
}

const DEFAULT_POLLS: IndustryPoll[] = [
  {
    question: "What's the biggest innovation barrier in your industry?",
    options: [
      { id: 'regulation', label: 'Regulation & compliance', icon: '\u{1F3DB}\uFE0F', percentage: 28 },
      { id: 'budget', label: 'Budget constraints', icon: '\u{1F4B0}', percentage: 24 },
      { id: 'talent', label: 'Talent shortage', icon: '\u{1F465}', percentage: 22 },
      { id: 'legacy', label: 'Legacy systems', icon: '\u{1F3D7}\uFE0F', percentage: 26 },
    ],
  },
  {
    question: 'Where does your innovation budget actually go?',
    options: [
      { id: 'tooling', label: 'Tools & software licenses', icon: '\u{1F6E0}\uFE0F', percentage: 31 },
      { id: 'people', label: 'Hiring specialists', icon: '\u{1F468}\u200D\u{1F4BB}', percentage: 27 },
      { id: 'pilots', label: 'POCs and pilot projects', icon: '\u{1F9EA}', percentage: 24 },
      { id: 'partners', label: 'External consultants', icon: '\u{1F91D}', percentage: 18 },
    ],
  },
  {
    question: 'What blocks most digital projects from scaling beyond pilot?',
    options: [
      { id: 'integration', label: 'Integration with legacy systems', icon: '\u{1F517}', percentage: 34 },
      { id: 'sponsor', label: 'No clear executive sponsor', icon: '\u{1F465}', percentage: 23 },
      { id: 'roi', label: 'Unclear ROI', icon: '\u{1F4C9}', percentage: 25 },
      { id: 'change', label: 'Change management', icon: '\u{1F504}', percentage: 18 },
    ],
  },
];

const DEFAULT_QUOTES: IndustryQuote[] = [
  { text: 'The best innovation strategy is the one you actually write down. Bonus points if anyone reads it.' },
  { text: 'Every industry is a tech industry now. The only question is whether you\u2019ve noticed.' },
  { text: 'Fun fact: 87% of digital transformation projects fail. The other 13% are just lying about their timeline.' },
  { text: 'If your innovation roadmap hasn\u2019t changed in 18 months, it\u2019s not a roadmap \u2014 it\u2019s a museum exhibit.' },
  { text: 'Strategy without execution is hallucination. Execution without strategy is just busy work.' },
  { text: 'The best time to fix the roof is when the sun is shining. The same goes for legacy IT.' },
  { text: 'A pilot that never scales is just an expensive demo with stakeholders.' },
  { text: 'Innovation budgets are like gym memberships \u2014 most companies pay for them but never show up.' },
  { text: 'If your competitive moat depends on \u201cnobody else has noticed yet,\u201d it\u2019s not a moat.' },
  { text: 'Culture eats strategy for breakfast. Then it eats your transformation roadmap for lunch.' },
];

const DEFAULT_CONTENT: IndustryContent = {
  facts: [
    { stat: 'Only 23% of Belgian industrial companies have a formal digital transformation strategy in place.', source: 'VLAIO Digital Barometer' },
    { stat: 'The Port of Antwerp-Bruges processes 290 million tonnes of cargo per year \u2014 Europe\u2019s second largest port.', source: 'Port of Antwerp-Bruges' },
    { stat: 'Belgian companies invest 3.4% of GDP in R&D \u2014 above the EU average of 2.3%.', source: 'Eurostat' },
    { stat: 'The Beacon connects over 200 member companies across 5 industrial verticals.', source: 'The Beacon' },
    { stat: 'Flanders ranks in the top 5 innovation regions in the EU according to the Regional Innovation Scoreboard.', source: 'European Commission' },
  ],
  headlines: [
    { title: 'Belgian innovation ecosystem expands with new cross-sector partnerships', source: 'VLAIO', date: 'Apr 2026', snippet: 'VLAIO reports a 15% year-over-year increase in formal innovation collaborations between Belgian industrial firms and tech scale-ups.', url: 'https://www.vlaio.be/en' },
    { title: 'EU Green Deal drives \u20AC200B investment in European industrial decarbonization', source: 'European Commission', date: 'Mar 2026', snippet: 'Belgian industrial clusters are positioned to capture a significant share of the green transition funding.', url: 'https://commission.europa.eu/strategy-and-policy/priorities-2019-2024/european-green-deal_en' },
  ],
  quotes: DEFAULT_QUOTES,
  polls: DEFAULT_POLLS,
};

export const INDUSTRY_CONTENT: Record<string, IndustryContent> = {
  'Maritime & Port': {
    facts: [
      { stat: 'The Port of Antwerp-Bruges processes 290 million tonnes of cargo annually \u2014 making it Europe\u2019s second largest port.', source: 'Port of Antwerp-Bruges' },
      { stat: 'IMO regulations require a 40% CO\u2082 reduction by 2030 and 70% by 2050 for international shipping.', source: 'International Maritime Organization' },
      { stat: 'Port of Antwerp-Bruges aims to become Europe\u2019s leading green hydrogen import hub by 2028.', source: 'Port of Antwerp-Bruges' },
      { stat: 'Only 18% of European ports have a fully integrated digital twin system.', source: 'IAPH' },
      { stat: 'Belgian maritime cluster companies employ over 115,000 people across the port ecosystem.', source: 'Blue Cluster' },
    ],
    headlines: [
      { title: 'Port of Antwerp-Bruges launches AI traffic management for inland shipping', source: 'Flows.be', date: 'Apr 2026', snippet: 'The port authority deployed a new AI-powered system to optimize barge traffic along the Scheldt corridor, reducing waiting times by up to 25%.', url: 'https://en.flows.be' },
      { title: 'Blue Cluster announces \u20AC20M innovation fund for maritime tech scale-ups', source: 'Blue Cluster', date: 'Mar 2026', snippet: 'Flemish maritime innovation cluster launches a dedicated fund to accelerate autonomous shipping and green port technology startups.', url: 'https://www.bluecluster.be/news' },
      { title: 'FuelEU Maritime enters full enforcement phase for Belgian operators', source: 'EMSA', date: 'Mar 2026', snippet: 'The regulation on greenhouse gas intensity of fuels now applies to all ships above 5,000 GT calling at EU ports.', url: 'https://www.emsa.europa.eu' },
    ],
    quotes: [
      { text: 'The best time to digitize your port operations was 5 years ago. The second best time is after reading this report.' },
      { text: 'A ship in harbor is safe, but that\u2019s not what ships \u2014 or innovation budgets \u2014 are built for.' },
      { text: 'Fun fact: the average container ship carries enough cargo to fill 745 fully loaded Boeing 747s. Your supply chain is more complex than you think.' },
      { text: 'If your logistics dashboard still runs on Excel, congratulations \u2014 you have something in common with 67% of the industry.' },
      { text: 'You can\u2019t manage what you can\u2019t see. Most ports still can\u2019t see half of what\u2019s moving through them.' },
      { text: 'Decarbonization is a moving target. The good news: so is the technology to hit it.' },
      { text: 'Fun fact: Antwerp\u2019s lock chambers can hold up to 60,000 tonnes of cargo at once. Your data warehouse should be so productive.' },
      { text: 'A port is the world\u2019s most complex IoT network. Most just don\u2019t treat it like one yet.' },
      { text: 'If your terminal scheduling still depends on phone calls, you\u2019re not late to digitalization \u2014 you\u2019re missing the boat.' },
      { text: 'The shipping industry runs on 200-year-old paperwork and 30-year-old software. Both are due for an upgrade.' },
    ],
    polls: [
      {
        question: "What's the biggest innovation barrier in maritime & port operations?",
        options: [
          { id: 'regulation', label: 'Regulation & compliance', icon: '\u{1F3DB}\uFE0F', percentage: 34 },
          { id: 'budget', label: 'Budget constraints', icon: '\u{1F4B0}', percentage: 18 },
          { id: 'talent', label: 'Talent shortage', icon: '\u{1F465}', percentage: 19 },
          { id: 'legacy', label: 'Legacy systems', icon: '\u{1F3D7}\uFE0F', percentage: 29 },
        ],
      },
      {
        question: 'Where will the biggest port-tech ROI come from in the next 3 years?',
        options: [
          { id: 'pcs', label: 'Port community systems / data sharing', icon: '\u{1F310}', percentage: 32 },
          { id: 'autonomy', label: 'Autonomous vessels & drones', icon: '\u{1F6F8}', percentage: 21 },
          { id: 'green', label: 'Alternative fuels & shore power', icon: '\u{26A1}', percentage: 28 },
          { id: 'twin', label: 'Digital twins of terminals', icon: '\u{1F500}', percentage: 19 },
        ],
      },
      {
        question: 'What\u2019s the hardest part of running a smart port pilot?',
        options: [
          { id: 'stakeholders', label: 'Aligning multiple stakeholders', icon: '\u{1F465}', percentage: 36 },
          { id: 'data', label: 'Getting clean operational data', icon: '\u{1F4CA}', percentage: 24 },
          { id: 'cyber', label: 'Cybersecurity sign-off', icon: '\u{1F512}', percentage: 18 },
          { id: 'funding', label: 'Securing co-funding', icon: '\u{1F4B6}', percentage: 22 },
        ],
      },
    ],
  },
  'Chemical & Process Industry': {
    facts: [
      { stat: 'Belgium is home to the second largest chemical cluster in Europe, concentrated along the Antwerp-Rotterdam-Rhine corridor.', source: 'Essenscia' },
      { stat: 'The Belgian chemical sector invested \u20AC2.7B in R&D in 2024 \u2014 4.8% of revenue.', source: 'Essenscia' },
      { stat: 'Over 60% of Belgian chemical companies have committed to reducing CO\u2082 emissions by 2030.', source: 'CEFIC' },
      { stat: 'BlueChem is Belgium\u2019s first dedicated cleantech chemistry incubator, hosting 20+ chemistry startups.', source: 'BlueChem' },
      { stat: 'Catalisti coordinates over 50 collaborative R&D projects between chemical companies and research institutions.', source: 'Catalisti' },
    ],
    headlines: [
      { title: 'Essenscia reports 12% increase in chemical sector R&D spend', source: 'Essenscia', date: 'Apr 2026', snippet: 'Belgian chemical federation highlights the sector\u2019s continued commitment to innovation despite economic headwinds, with digital transformation projects leading the increase.', url: 'https://www.essenscia.be/en' },
      { title: 'EU Chemicals Strategy enters second implementation phase', source: 'EU Commission', date: 'Mar 2026', snippet: 'New requirements on substance-of-concern reporting and safe-by-design products now apply to Belgian chemical manufacturers.', url: 'https://ec.europa.eu/environment/chemicals' },
      { title: 'Catalisti funds \u20AC8M project for circular polymers technology', source: 'Catalisti', date: 'Mar 2026', snippet: 'A consortium of 7 Flemish chemical companies joins forces to develop advanced recycling technology for polyolefin streams.', url: 'https://www.catalisti.be/en' },
    ],
    quotes: [
      { text: 'There are only two types of chemical companies: those that have a digital twin strategy, and those that will.' },
      { text: 'Your plant probably runs 24/7. Your innovation strategy shouldn\u2019t take weekends off either.' },
      { text: 'Fun fact: the Belgian chemical cluster produces more per square kilometer than any other in Europe. Efficiency is in your DNA.' },
      { text: 'If your R&D process takes longer than the half-life of Nobelium (58 minutes), there might be room for improvement.' },
      { text: 'Process safety and process innovation aren\u2019t opposites. They just need the same governance.' },
      { text: 'CSRD reporting feels expensive until you compare it to the cost of being unable to report at all.' },
      { text: 'A pilot reactor is small. The decision to scale it isn\u2019t.' },
      { text: 'Fun fact: 1 kg of catalyst can convert thousands of tonnes of feedstock. Your data scientists should be just as leveraged.' },
      { text: 'Decarbonization without digitalization is wishful thinking with extra steps.' },
      { text: 'Your batch records know more about your plant than your management dashboards. Maybe that\u2019s the problem.' },
    ],
    polls: [
      {
        question: "What's the biggest innovation barrier in chemical & process industry?",
        options: [
          { id: 'regulation', label: 'Regulation & compliance', icon: '\u{1F3DB}\uFE0F', percentage: 38 },
          { id: 'budget', label: 'Budget constraints', icon: '\u{1F4B0}', percentage: 22 },
          { id: 'talent', label: 'Talent shortage', icon: '\u{1F465}', percentage: 15 },
          { id: 'legacy', label: 'Legacy systems', icon: '\u{1F3D7}\uFE0F', percentage: 25 },
        ],
      },
      {
        question: 'Which sustainability lever has the most impact for your plant?',
        options: [
          { id: 'energy', label: 'Energy efficiency & heat recovery', icon: '\u{1F525}', percentage: 33 },
          { id: 'electrify', label: 'Electrification of processes', icon: '\u{26A1}', percentage: 26 },
          { id: 'circular', label: 'Circular feedstocks', icon: '\u{267B}\uFE0F', percentage: 22 },
          { id: 'ccs', label: 'Carbon capture & storage', icon: '\u{1F32B}\uFE0F', percentage: 19 },
        ],
      },
      {
        question: 'How mature is your plant\u2019s use of operational data?',
        options: [
          { id: 'spreadsheet', label: 'Mostly spreadsheets', icon: '\u{1F4C4}', percentage: 28 },
          { id: 'historian', label: 'Historian + ad-hoc dashboards', icon: '\u{1F4CA}', percentage: 35 },
          { id: 'advanced', label: 'Advanced analytics in production', icon: '\u{1F9E0}', percentage: 22 },
          { id: 'aiops', label: 'AI/ML closing the loop', icon: '\u{1F916}', percentage: 15 },
        ],
      },
    ],
  },
  'Logistics & Supply Chain': {
    facts: [
      { stat: 'Belgium\u2019s logistics sector contributes over 11% to national GDP and employs 250,000 people.', source: 'VIL' },
      { stat: 'Only 30% of Belgian logistics companies have real-time supply chain visibility across their network.', source: 'VIL Digital Barometer' },
      { stat: 'Flanders ranks among the top 3 logistics hubs in Europe by the World Bank LPI.', source: 'World Bank LPI' },
      { stat: 'Over 40% of European warehouse automation investments flow through Belgian distribution centers.', source: 'VIL' },
      { stat: 'Antwerp is connected to 800+ ports globally, handling freight flows to every continent.', source: 'Port of Antwerp-Bruges' },
    ],
    headlines: [
      { title: 'VIL launches open innovation platform for Belgian logistics SMEs', source: 'VIL', date: 'Apr 2026', snippet: 'The Flemish logistics institute connects SMEs with tech scale-ups to tackle shared challenges in last-mile, visibility, and decarbonization.', url: 'https://www.vil.be/en' },
      { title: 'CBAM full reporting phase now in force for Belgian importers', source: 'EU Commission', date: 'Mar 2026', snippet: 'The Carbon Border Adjustment Mechanism\u2019s full reporting phase affects Belgian importers of steel, aluminium, and chemicals.', url: 'https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism_en' },
      { title: 'Port of Antwerp-Bruges pilots autonomous truck corridor with 5 operators', source: 'Flows.be', date: 'Mar 2026', snippet: 'A new pilot tests Level 4 autonomous trucks for container transport between terminals, targeting 15% efficiency gains.', url: 'https://en.flows.be' },
    ],
    quotes: [
      { text: 'Your package tracking works better than most companies\u2019 innovation tracking. Let\u2019s fix that.' },
      { text: 'The average supply chain has 7 handoffs. The average innovation idea has 12. Guess which one needs more optimization.' },
      { text: 'Fun fact: Belgium processes more goods per capita than any other EU country. You\u2019re literally sitting on an innovation goldmine.' },
      { text: 'If your last-mile delivery is smarter than your innovation strategy, this report will be eye-opening.' },
      { text: 'A control tower without clean data is just a very expensive painting.' },
      { text: 'Resilience is the new efficiency. The companies that figured that out in 2021 are the winners now.' },
      { text: 'Fun fact: a single missing CMR can cost more than the truck carrying it. Digital documents pay for themselves.' },
      { text: 'Modal shift is easy on a slide, hard on a Tuesday morning.' },
      { text: 'Your forecast accuracy is probably the single highest-leverage KPI in the company. Treat it that way.' },
      { text: 'EDI was supposed to be the future. That was 1985. Maybe it\u2019s time for an upgrade.' },
    ],
    polls: [
      {
        question: "What's the biggest innovation barrier in logistics & supply chain?",
        options: [
          { id: 'regulation', label: 'Regulation & compliance', icon: '\u{1F3DB}\uFE0F', percentage: 22 },
          { id: 'budget', label: 'Budget constraints', icon: '\u{1F4B0}', percentage: 26 },
          { id: 'talent', label: 'Talent shortage', icon: '\u{1F465}', percentage: 24 },
          { id: 'legacy', label: 'Legacy systems', icon: '\u{1F3D7}\uFE0F', percentage: 28 },
        ],
      },
      {
        question: 'Which capability has the highest unmet demand in your network?',
        options: [
          { id: 'visibility', label: 'End-to-end shipment visibility', icon: '\u{1F50D}', percentage: 36 },
          { id: 'forecast', label: 'Demand forecasting', icon: '\u{1F4C8}', percentage: 24 },
          { id: 'sustain', label: 'Emissions reporting per shipment', icon: '\u{1F343}', percentage: 22 },
          { id: 'docs', label: 'Document & customs automation', icon: '\u{1F4C4}', percentage: 18 },
        ],
      },
      {
        question: 'What\u2019s the most painful gap between your TMS/WMS and reality?',
        options: [
          { id: 'late', label: 'Late status updates', icon: '\u{23F1}\uFE0F', percentage: 30 },
          { id: 'manual', label: 'Manual workarounds at the edges', icon: '\u{270D}\uFE0F', percentage: 32 },
          { id: 'silos', label: 'Data stuck in silos', icon: '\u{1F5C4}\uFE0F', percentage: 22 },
          { id: 'change', label: 'Vendors slow to change', icon: '\u{1F40C}', percentage: 16 },
        ],
      },
    ],
  },
  'Manufacturing & Engineering': {
    facts: [
      { stat: 'Flanders Make coordinates research for over 500 Belgian manufacturers, spanning mechatronics, vehicles, and smart factories.', source: 'Flanders Make' },
      { stat: 'Sirris supports 2,500+ Belgian industrial SMEs with applied technology projects each year.', source: 'Sirris' },
      { stat: 'Only 35% of Belgian manufacturers have moved beyond pilot projects for Industry 4.0 technologies.', source: 'Agoria' },
      { stat: 'Belgian technology industry employs 320,000 people across manufacturing, engineering, and ICT.', source: 'Agoria' },
      { stat: 'The Made Different program has guided 400+ Belgian factories through digital transformation roadmaps.', source: 'Agoria, Sirris' },
    ],
    headlines: [
      { title: 'Agoria pushes for \u20AC500M acceleration plan for Belgian smart manufacturing', source: 'Agoria', date: 'Apr 2026', snippet: 'Belgian tech industry federation proposes a national investment plan to accelerate Industry 4.0 adoption among mid-sized manufacturers.', url: 'https://www.agoria.be/en' },
      { title: 'Flanders Make opens new research center for circular manufacturing', source: 'Flanders Make', date: 'Mar 2026', snippet: 'The strategic research center launches a dedicated lab for disassembly, remanufacturing, and material recovery technology.', url: 'https://www.flandersmake.be/en' },
      { title: 'EU Machinery Regulation 2026 enters enforcement for connected equipment', source: 'European Commission', date: 'Mar 2026', snippet: 'Belgian machine builders must comply with new digital safety and cyber-resilience requirements.', url: 'https://single-market-economy.ec.europa.eu/sectors/mechanical-engineering/machinery_en' },
    ],
    quotes: [
      { text: 'Industry 4.0 has been \u201Ccoming soon\u201D since 2011. At some point, you have to actually press the button.' },
      { text: 'Your machines generate more data in an hour than your management team reviews in a quarter.' },
      { text: 'Fun fact: Flemish manufacturers who adopted predictive maintenance saw 25% fewer unplanned stops. Your machines are trying to talk to you.' },
      { text: 'The factory of the future was supposed to be here by now. Shall we check what\u2019s holding it up?' },
      { text: 'OEE is a number. The decisions you make with it are the actual strategy.' },
      { text: 'Servitization isn\u2019t a marketing word. It\u2019s a margin word.' },
      { text: 'Fun fact: a single retrofit sensor can pay for itself in a week of avoided downtime. The math is rarely the blocker.' },
      { text: 'Cobots don\u2019t replace operators. They replace ergonomics complaints.' },
      { text: 'The hardest part of digital transformation isn\u2019t the digital. It\u2019s the transformation.' },
      { text: 'If your spare-parts strategy is \u201Chope,\u201D your uptime strategy probably is too.' },
    ],
    polls: [
      {
        question: "What's the biggest innovation barrier in manufacturing & engineering?",
        options: [
          { id: 'regulation', label: 'Regulation & compliance', icon: '\u{1F3DB}\uFE0F', percentage: 18 },
          { id: 'budget', label: 'Budget constraints', icon: '\u{1F4B0}', percentage: 27 },
          { id: 'talent', label: 'Talent shortage', icon: '\u{1F465}', percentage: 23 },
          { id: 'legacy', label: 'Legacy systems', icon: '\u{1F3D7}\uFE0F', percentage: 32 },
        ],
      },
      {
        question: 'Which Industry 4.0 lever delivers the fastest payback for you?',
        options: [
          { id: 'predictive', label: 'Predictive maintenance', icon: '\u{1F527}', percentage: 31 },
          { id: 'quality', label: 'Vision-based quality control', icon: '\u{1F441}\uFE0F', percentage: 22 },
          { id: 'cobots', label: 'Cobots & flexible automation', icon: '\u{1F916}', percentage: 21 },
          { id: 'mes', label: 'MES / connected shop floor', icon: '\u{1F517}', percentage: 26 },
        ],
      },
      {
        question: 'Where does your shop floor data go to die?',
        options: [
          { id: 'paper', label: 'Printed reports nobody reads', icon: '\u{1F4C3}', percentage: 24 },
          { id: 'silo', label: 'A silo your ERP can\u2019t see', icon: '\u{1F5C4}\uFE0F', percentage: 36 },
          { id: 'vendor', label: 'A vendor cloud you can\u2019t access', icon: '\u{2601}\uFE0F', percentage: 18 },
          { id: 'used', label: 'Honestly? We use it', icon: '\u{2705}', percentage: 22 },
        ],
      },
    ],
  },
  'Technology & Software': {
    facts: [
      { stat: 'imec is one of the world\u2019s leading nanoelectronics research centers, with \u20AC700M+ annual R&D spend.', source: 'imec' },
      { stat: 'Belgium hosts 5,000+ active tech startups, with Flanders accounting for 70% of them.', source: 'VLAIO, Start it @KBC' },
      { stat: 'Start it @KBC has supported over 1,500 tech startups, with a combined valuation above \u20AC2B.', source: 'Start it @KBC' },
      { stat: 'The EU AI Act creates new compliance obligations for high-risk AI systems, including many enterprise SaaS tools.', source: 'European Commission' },
      { stat: 'Belgian SaaS companies raised a record \u20AC680M in 2024 across seed, Series A, and growth rounds.', source: 'Sifted, Tech.eu' },
    ],
    headlines: [
      { title: 'Belgian AI startups raise record funding as EU AI Act takes effect', source: 'Sifted', date: 'Apr 2026', snippet: 'Flemish deep-tech scale-ups secure \u20AC120M as investors bet on AI companies built with regulation-by-design principles.', url: 'https://sifted.eu' },
      { title: 'imec unveils new chiplet interconnect technology with European partners', source: 'imec', date: 'Mar 2026', snippet: 'The research center announces a breakthrough in 3D chiplet integration, strengthening Europe\u2019s semiconductor autonomy.', url: 'https://www.imec-int.com/en' },
      { title: 'Start it @KBC launches dedicated cyber-security accelerator cohort', source: 'Start it @KBC', date: 'Mar 2026', snippet: 'Belgian startup accelerator opens applications for a vertical-focused program addressing NIS2, DORA, and Cyber Resilience Act challenges.', url: 'https://startit.be' },
    ],
    quotes: [
      { text: 'Move fast and break things \u2014 unless it\u2019s your CI/CD pipeline. Then move fast and test things.' },
      { text: 'Your product roadmap probably has more features than your innovation strategy has milestones.' },
      { text: 'Fun fact: Belgian SaaS companies raised \u20AC680M in 2024. The question isn\u2019t whether to innovate, but whether you\u2019re doing it fast enough.' },
      { text: 'If your sprint velocity is higher than your innovation velocity, you might be building the wrong things faster.' },
      { text: 'Distribution beats product. Always has. The AI boom hasn\u2019t changed that.' },
      { text: 'Your AI demo is impressive. Your AI in production is what actually pays the bills.' },
      { text: 'Fun fact: most B2B SaaS churn happens in onboarding, not pricing. Fix the first 14 days first.' },
      { text: 'Compliance-by-design is cheaper than compliance-by-lawsuit.' },
      { text: 'The best growth lever is usually the boring one you already know about.' },
      { text: 'Your tech stack isn\u2019t a religion. It\u2019s a tool. Treat it accordingly.' },
    ],
    polls: [
      {
        question: "What's the biggest innovation barrier in tech & software?",
        options: [
          { id: 'regulation', label: 'Regulation & compliance', icon: '\u{1F3DB}\uFE0F', percentage: 24 },
          { id: 'budget', label: 'Budget constraints', icon: '\u{1F4B0}', percentage: 21 },
          { id: 'talent', label: 'Talent shortage', icon: '\u{1F465}', percentage: 38 },
          { id: 'legacy', label: 'Legacy systems', icon: '\u{1F3D7}\uFE0F', percentage: 17 },
        ],
      },
      {
        question: 'Where is generative AI actually moving the needle for your team?',
        options: [
          { id: 'eng', label: 'Engineering productivity', icon: '\u{1F468}\u200D\u{1F4BB}', percentage: 34 },
          { id: 'support', label: 'Customer support deflection', icon: '\u{1F3AF}', percentage: 24 },
          { id: 'content', label: 'Marketing content', icon: '\u{270D}\uFE0F', percentage: 21 },
          { id: 'nowhere', label: 'Honestly nowhere yet', icon: '\u{1F937}', percentage: 21 },
        ],
      },
      {
        question: 'What\u2019s your hardest hire right now?',
        options: [
          { id: 'sre', label: 'Senior backend / SRE', icon: '\u{1F6E0}\uFE0F', percentage: 28 },
          { id: 'ml', label: 'ML / data engineers', icon: '\u{1F9E0}', percentage: 31 },
          { id: 'pm', label: 'Senior product managers', icon: '\u{1F4CB}', percentage: 19 },
          { id: 'sec', label: 'Security engineers', icon: '\u{1F512}', percentage: 22 },
        ],
      },
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
