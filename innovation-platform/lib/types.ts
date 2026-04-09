export interface Session {
  id: string;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  device_type: string | null;
  country: string | null;
  started_at: string;
  last_activity_at: string | null;
}

export interface Analysis {
  id: string;
  company_name: string;
  company_website: string | null;
  industry: string | null;
  company_type: string | null;
  overall_score: number | null;
  maturity_level: string | null;
  technologies_detected: TechnologyDetected[];
  strategic_goals: StrategicGoal[];
  active_projects: ActiveProject[];
  innovation_gaps: InnovationOpportunity[];
  pain_points_detected: PainPoint[];
  beacon_relevance: string | null;
  recommended_offerings: RecommendedOffering[];
  industry_context: string | null;
  industry_landscape: IndustryLandscape | null;
  data_confidence: string | null;
  data_confidence_explanation: string | null;
  surprising_insight: string | null;
  quick_win: QuickWin | null;
  sources: AnalysisSource[];
  analysis_status: string;
  full_analysis_json: Record<string, unknown> | null;
  account_id: string | null;
  session_id: string | null;
  previous_analysis_id: string | null;
  confirmed_verticals: string[];
  analyzed_at: string;
  created_at: string;
  updated_at: string;
}

export interface MaturityDimension {
  id: string;
  analysis_id: string;
  dimension_name: string;
  score: number | null;
  weight: number | null;
  evidence: string | null;
  key_findings: string[];
  sub_scores: Record<string, number>;
  insight?: string;
  created_at: string;
}

export interface EcosystemMatch {
  id: string;
  analysis_id: string;
  matched_account_id: string;
  match_rank: number;
  match_score: number | null;
  match_rationale: string | null;
  match_category: string | null;
  shared_themes: string[];
  collaboration_idea: string | null;
  is_visible: boolean;
  unlocked_at: string | null;
  created_at: string;
  account_name?: string;
  account_website?: string;
  account_description?: string;
  account_industry?: string;
  account_technologies?: string[];
  match_details?: MatchDetails;
}

export interface MatchDetails {
  member_expertise: string[];
  conversation_starter: string | null;
  teaser_text: string | null;
}

export interface Interaction {
  id?: string;
  session_id: string;
  event_type: string;
  page: string | null;
  metadata: Record<string, unknown> | null;
  timestamp?: string;
}

export interface Lead {
  id?: string;
  analysis_id: string;
  session_id: string | null;
  name: string | null;
  email: string | null;
  company_name: string | null;
  phone: string | null;
  message: string | null;
  lead_type: string;
  rating: number | null;
  calendly_booked: boolean;
  contact_id: string | null;
  deal_id: string | null;
  status: string;
  created_at?: string;
}

export interface TechnologyDetected {
  technology: string;
  source?: string;
  context?: string;
}

export interface StrategicGoal {
  goal: string;
  relevance: string;
  source?: string;
}

export interface ActiveProject {
  name: string;
  status: string;
  description: string;
  source?: string;
}

export interface InnovationOpportunity {
  opportunity: string;
  explanation: string;
  priority: string;
  quick_win?: boolean;
  beacon_connection?: string;
  // Backwards compat with old gap format
  gap?: string;
}

export interface PainPoint {
  pain_point: string;
  explanation: string;
  source?: string;
}

export interface RecommendedOffering {
  offering: string;
  price?: string;
  match_reason: string;
}

export interface QuickWin {
  action: string;
  why: string;
  beacon_link?: string;
  beacon_connection?: string;
}

export interface IndustryLandscape {
  current_trends: string;
  competitive_position: string;
  emerging_opportunities: string;
}

export interface AnalysisSource {
  id: string;
  title: string;
  url: string;
  date: string;
  type: string;
}

export interface CompanyCandidate {
  name: string;
  website: string | null;
  headquarters: string | null;
  industry: string | null;
  description: string | null;
  employee_range: string | null;
  founded: number | null;
  confidence: number;
  source: string | null;
  suggested_verticals?: string[];
}

export interface DimensionInsight {
  dimension_name: string;
  score: number;
  weight: number;
  evidence: string;
  key_findings: string[];
  insight: string;
}
