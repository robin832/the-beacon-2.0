// Curated source lists per industry vertical.
// These are verified, reliable sources that consistently publish relevant content.
// The innovation-analysis Edge Function injects the matching list into the user
// message so Claude prioritizes these when researching.
//
// Keys MUST match the values used in The Beacon's industry classification
// (see prompts/company-lookup.md and the verticals list).

export interface CuratedSource {
  domain: string;
  url: string;
  description: string;
}

export const CURATED_SOURCES: Record<string, CuratedSource[]> = {
  "Maritime & Port": [
    { domain: "portofantwerpbruges.com", url: "https://newsroom.portofantwerpbruges.com", description: "Port of Antwerp-Bruges newsroom — primary source for Antwerp port innovation" },
    { domain: "bluecluster.be", url: "https://www.bluecluster.be/news", description: "Blue Cluster — Flemish maritime innovation cluster" },
    { domain: "fmc.be", url: "https://www.fmc.be", description: "Flanders Maritime Cluster" },
    { domain: "flows.be", url: "https://en.flows.be", description: "Flows.be — Belgian shipping, logistics and ports news" },
    { domain: "vlaio.be", url: "https://www.vlaio.be/en", description: "Flanders Innovation & Entrepreneurship (VLAIO) — grants and innovation programs" },
    { domain: "portofzeebrugge.be", url: "https://www.portofzeebrugge.be/en/news", description: "Port of Zeebrugge news" },
    { domain: "imo.org", url: "https://www.imo.org/en/MediaCentre", description: "International Maritime Organization — regulations, green shipping" },
    { domain: "emsa.europa.eu", url: "https://www.emsa.europa.eu", description: "European Maritime Safety Agency" },
    { domain: "offshore-energy.biz", url: "https://www.offshore-energy.biz", description: "Offshore Energy — offshore wind, energy, maritime" },
    { domain: "hellenicshippingnews.com", url: "https://www.hellenicshippingnews.com", description: "Hellenic Shipping News — international shipping industry" },
    { domain: "splash247.com", url: "https://splash247.com", description: "Splash 247 — maritime news and analysis" },
    { domain: "safety4sea.com", url: "https://safety4sea.com", description: "Safety4Sea — maritime safety and sustainability" },
    { domain: "seatrade-maritime.com", url: "https://www.seatrade-maritime.com", description: "Seatrade Maritime — global maritime news" },
    { domain: "marineinsight.com", url: "https://www.marineinsight.com", description: "Marine Insight — maritime industry articles" },
    { domain: "mckinsey.com", url: "https://www.mckinsey.com/industries/travel-logistics-and-infrastructure", description: "McKinsey Maritime & Logistics insights" },
    { domain: "dnv.com", url: "https://www.dnv.com/maritime", description: "DNV Maritime — classification, standards, innovation reports" },
    { domain: "wartsila.com", url: "https://www.wartsila.com/insights", description: "Wärtsilä Insights — maritime technology trends" },
    { domain: "lr.org", url: "https://www.lr.org/en", description: "Lloyd's Register — maritime innovation and safety" },
    { domain: "bimco.org", url: "https://www.bimco.org", description: "BIMCO — shipping association, market analysis" },
    { domain: "unctad.org", url: "https://unctad.org/topic/transport-and-trade-logistics/review-of-maritime-transport", description: "UNCTAD Maritime Transport Review" },
    { domain: "iaphworldports.org", url: "https://www.iaphworldports.org", description: "International Association of Ports and Harbors" },
  ],
  "Chemical & Process Industry": [
    { domain: "essenscia.be", url: "https://www.essenscia.be/en", description: "Essenscia — Belgian chemical federation (primary source)" },
    { domain: "catalisti.be", url: "https://www.catalisti.be/en", description: "Catalisti — Flanders chemistry/plastics cluster" },
    { domain: "bluechem.be", url: "https://www.bluechem.be/en", description: "BlueChem — Antwerp cleantech incubator for chemistry" },
    { domain: "flandersinvestmentandtrade.com", url: "https://www.flandersinvestmentandtrade.com", description: "Flanders Investment & Trade" },
    { domain: "vito.be", url: "https://www.vito.be/en", description: "VITO — Flemish research organization, cleantech/chemistry" },
    { domain: "vlaio.be", url: "https://www.vlaio.be/en", description: "VLAIO — innovation funding for chemical companies" },
    { domain: "cefic.org", url: "https://www.cefic.org", description: "CEFIC — European Chemical Industry Council" },
    { domain: "chemicalweek.com", url: "https://www.chemicalweek.com", description: "Chemical Week — global chemical industry news" },
    { domain: "icis.com", url: "https://www.icis.com", description: "ICIS — chemical market intelligence" },
    { domain: "chemindustry.com", url: "https://www.chemindustry.com", description: "ChemIndustry — chemical industry news aggregator" },
    { domain: "ec.europa.eu", url: "https://ec.europa.eu/environment/chemicals", description: "EU Chemicals Strategy" },
    { domain: "echa.europa.eu", url: "https://echa.europa.eu", description: "European Chemicals Agency — REACH, regulations" },
    { domain: "mckinsey.com", url: "https://www.mckinsey.com/industries/chemicals", description: "McKinsey Chemicals practice" },
    { domain: "bcg.com", url: "https://www.bcg.com/industries/industrial-goods", description: "BCG Industrial & Chemical insights" },
    { domain: "deloitte.com", url: "https://www2.deloitte.com/global/en/industries/energy-resources-industrials.html", description: "Deloitte Chemical sector" },
    { domain: "accenture.com", url: "https://www.accenture.com/us-en/industries/chemicals", description: "Accenture Chemicals" },
    { domain: "basf.com", url: "https://www.basf.com/global/en/media/news-releases.html", description: "BASF news — benchmark for innovation leadership" },
    { domain: "processindustryinformer.com", url: "https://www.processindustryinformer.com", description: "Process Industry Informer" },
    { domain: "thechemicalengineer.com", url: "https://www.thechemicalengineer.com", description: "The Chemical Engineer" },
    { domain: "chemengonline.com", url: "https://www.chemengonline.com", description: "Chemical Engineering Online" },
    { domain: "nature.com", url: "https://www.nature.com/subjects/chemical-engineering", description: "Nature Chemical Engineering" },
  ],
  "Logistics & Supply Chain": [
    { domain: "vil.be", url: "https://www.vil.be/en", description: "VIL — Flemish Institute for Logistics" },
    { domain: "flows.be", url: "https://en.flows.be", description: "Flows.be — logistics, ports, shipping from Belgian perspective" },
    { domain: "portofantwerpbruges.com", url: "https://newsroom.portofantwerpbruges.com", description: "Port of Antwerp-Bruges — logistics hub news" },
    { domain: "flandersinvestmentandtrade.com", url: "https://www.flandersinvestmentandtrade.com", description: "Flanders Investment & Trade" },
    { domain: "vlaio.be", url: "https://www.vlaio.be/en", description: "VLAIO — innovation programs for logistics" },
    { domain: "febetra.be", url: "https://www.febetra.be/en", description: "FEBETRA — Belgian transport federation" },
    { domain: "ela-logistics.eu", url: "https://www.ela-logistics.eu", description: "European Logistics Association" },
    { domain: "supplychain247.com", url: "https://www.supplychain247.com", description: "Supply Chain 247" },
    { domain: "supplychaindive.com", url: "https://www.supplychaindive.com", description: "Supply Chain Dive" },
    { domain: "logisticsmgmt.com", url: "https://www.logisticsmgmt.com", description: "Logistics Management" },
    { domain: "freightwaves.com", url: "https://www.freightwaves.com", description: "FreightWaves — freight and logistics data/news" },
    { domain: "theloadstar.com", url: "https://theloadstar.com", description: "The Loadstar — supply chain news" },
    { domain: "logisticsinsider.eu", url: "https://www.logisticsinsider.eu", description: "Logistics Insider Europe" },
    { domain: "mckinsey.com", url: "https://www.mckinsey.com/industries/travel-logistics-and-infrastructure", description: "McKinsey Logistics" },
    { domain: "bcg.com", url: "https://www.bcg.com/industries/transportation-logistics", description: "BCG Transportation & Logistics" },
    { domain: "deloitte.com", url: "https://www2.deloitte.com/global/en/industries/transport.html", description: "Deloitte Transport & Logistics" },
    { domain: "gartner.com", url: "https://www.gartner.com/en/supply-chain", description: "Gartner Supply Chain — top 25, reports" },
    { domain: "capgemini.com", url: "https://www.capgemini.com/insights/research-library/?topic=supply-chain", description: "Capgemini Supply Chain insights" },
    { domain: "dhl.com", url: "https://www.dhl.com/global-en/delivered/trends-and-innovation.html", description: "DHL Logistics Trend Radar" },
    { domain: "weforum.org", url: "https://www.weforum.org/topics/supply-chain-and-transport", description: "World Economic Forum Supply Chain" },
    { domain: "kearney.com", url: "https://www.kearney.com/transportation-and-logistics", description: "Kearney Transport & Logistics" },
    { domain: "ipcsa.international", url: "https://ipcsa.international", description: "International Port Community Systems Association" },
  ],
  "Manufacturing & Engineering": [
    { domain: "sirris.be", url: "https://www.sirris.be/en", description: "Sirris — Belgian technology center for industry" },
    { domain: "agoria.be", url: "https://www.agoria.be/en", description: "Agoria — Belgian technology industry federation" },
    { domain: "flandersmake.be", url: "https://www.flandersmake.be/en", description: "Flanders Make — strategic research center for manufacturing" },
    { domain: "flanderssmartfactory.be", url: "https://www.flanderssmartfactory.be", description: "Flanders Smart Factory" },
    { domain: "imec-int.com", url: "https://www.imec-int.com/en", description: "imec — nanoelectronics & digital tech research" },
    { domain: "vlaio.be", url: "https://www.vlaio.be/en", description: "VLAIO" },
    { domain: "effra.eu", url: "https://www.effra.eu", description: "European Factories of the Future Research Association" },
    { domain: "plattform-i40.de", url: "https://www.plattform-i40.de/IP/Navigation/EN/Home/home.html", description: "Platform Industrie 4.0 — Germany Industry 4.0 reference" },
    { domain: "manufacturingglobal.com", url: "https://www.manufacturingglobal.com", description: "Manufacturing Global" },
    { domain: "themanufacturer.com", url: "https://www.themanufacturer.com", description: "The Manufacturer" },
    { domain: "industryweek.com", url: "https://www.industryweek.com", description: "Industry Week" },
    { domain: "automationworld.com", url: "https://www.automationworld.com", description: "Automation World" },
    { domain: "mckinsey.com", url: "https://www.mckinsey.com/capabilities/operations/our-insights", description: "McKinsey Manufacturing & Operations" },
    { domain: "bcg.com", url: "https://www.bcg.com/industries/industrial-goods", description: "BCG Industrial Goods" },
    { domain: "deloitte.com", url: "https://www2.deloitte.com/global/en/industries/manufacturing.html", description: "Deloitte Manufacturing" },
    { domain: "capgemini.com", url: "https://www.capgemini.com/insights/research-library/?topic=intelligent-industry", description: "Capgemini Intelligent Industry" },
    { domain: "pwc.com", url: "https://www.pwc.com/gx/en/industries/industrial-manufacturing.html", description: "PwC Industrial Manufacturing" },
    { domain: "weforum.org", url: "https://www.weforum.org/topics/advanced-manufacturing-and-value-chains", description: "WEF Advanced Manufacturing" },
    { domain: "idc.com", url: "https://www.idc.com/promo/manufacturing-insights", description: "IDC Manufacturing Insights" },
    { domain: "rolandberger.com", url: "https://www.rolandberger.com/en/Insights/Industries/Industrial-Products-Services.html", description: "Roland Berger Industrial Products" },
  ],
  "Technology & Software": [
    { domain: "imec-int.com", url: "https://www.imec-int.com/en", description: "imec — nanoelectronics, AI, life sciences tech" },
    { domain: "vito.be", url: "https://www.vito.be/en", description: "VITO — cleantech, energy, digital" },
    { domain: "vlaio.be", url: "https://www.vlaio.be/en", description: "VLAIO — startup & scaleup programs" },
    { domain: "startit.be", url: "https://startit.be", description: "Start it @KBC — Belgian startup accelerator" },
    { domain: "agoria.be", url: "https://www.agoria.be/en", description: "Agoria — tech industry federation" },
    { domain: "knack.be", url: "https://datanews.knack.be", description: "Data News — Belgian IT/tech news" },
    { domain: "flanderstoday.eu", url: "https://www.flanderstoday.eu", description: "Flanders Today — includes tech news" },
    { domain: "tech.eu", url: "https://tech.eu", description: "Tech.eu — European tech news" },
    { domain: "eu-startups.com", url: "https://www.eu-startups.com", description: "EU-Startups — European startup ecosystem" },
    { domain: "sifted.eu", url: "https://sifted.eu", description: "Sifted — European tech and startup news by FT" },
    { domain: "thenextweb.com", url: "https://thenextweb.com", description: "The Next Web — European tech media" },
    { domain: "techcrunch.com", url: "https://www.techcrunch.com/tag/europe", description: "TechCrunch Europe" },
    { domain: "mckinsey.com", url: "https://www.mckinsey.com/capabilities/mckinsey-digital/our-insights", description: "McKinsey Digital" },
    { domain: "gartner.com", url: "https://www.gartner.com/en/information-technology", description: "Gartner IT" },
    { domain: "forrester.com", url: "https://www.forrester.com", description: "Forrester Research" },
    { domain: "hbr.org", url: "https://hbr.org/topic/technology", description: "Harvard Business Review Technology" },
    { domain: "bcg.com", url: "https://www.bcg.com/capabilities/digital-technology-data", description: "BCG Digital/Tech" },
    { domain: "accenture.com", url: "https://www.accenture.com/us-en/insights/technology", description: "Accenture Technology Insights" },
    { domain: "weforum.org", url: "https://www.weforum.org/topics/emerging-technologies", description: "WEF Emerging Technologies" },
    { domain: "technologyreview.com", url: "https://www.technologyreview.com", description: "MIT Technology Review" },
  ],
};

// Belgian business generalists — always included alongside the vertical-specific list
export const GENERAL_BELGIAN_SOURCES: CuratedSource[] = [
  { domain: "tijd.be", url: "https://www.tijd.be", description: "De Tijd — Belgian financial newspaper" },
  { domain: "lecho.be", url: "https://www.lecho.be", description: "L'Echo — French-language Belgian business news" },
  { domain: "knack.be", url: "https://trends.knack.be", description: "Trends — Belgian business magazine" },
  { domain: "brusselstimes.com", url: "https://www.brusselstimes.com/business", description: "Brussels Times Business" },
  { domain: "flanderstoday.eu", url: "https://www.flanderstoday.eu", description: "Flanders Today" },
  { domain: "flandersinvestmentandtrade.com", url: "https://www.flandersinvestmentandtrade.com", description: "Flanders Investment & Trade" },
  { domain: "nbb.be", url: "https://www.nbb.be/en", description: "National Bank of Belgium — economic data" },
  { domain: "vbo-feb.be", url: "https://www.vbo-feb.be/en", description: "FEB — Federation of Belgian Enterprises" },
  { domain: "unizo.be", url: "https://www.unizo.be", description: "UNIZO — SME federation" },
];

/**
 * Returns the merged curated list for the given industry + the general Belgian list.
 * Unknown industries fall back to just the general list.
 */
export function getCuratedSources(industry: string | null | undefined): CuratedSource[] {
  const vertical = industry && CURATED_SOURCES[industry] ? CURATED_SOURCES[industry] : [];
  // Dedupe by domain (vertical sources take precedence)
  const seen = new Set<string>();
  const result: CuratedSource[] = [];
  for (const s of [...vertical, ...GENERAL_BELGIAN_SOURCES]) {
    if (!seen.has(s.domain)) {
      seen.add(s.domain);
      result.push(s);
    }
  }
  return result;
}
