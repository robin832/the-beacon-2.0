'use client';

import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import { MaturityDimension } from '@/lib/types';

interface RadarChartProps {
  dimensions: MaturityDimension[];
}

const shortNames: Record<string, string> = {
  'R&D & Technology Investment': 'R&D & Tech',
  'Product & Service Innovation': 'Product Innovation',
  'Digital Transformation': 'Digital Transform.',
  'External Partnerships & Open Innovation': 'Partnerships',
  'Market Leadership & Strategic Vision': 'Market Vision',
};

export default function RadarChart({ dimensions }: RadarChartProps) {
  const data = dimensions.map((d) => ({
    dimension: shortNames[d.dimension_name] || d.dimension_name,
    score: d.score || 0,
    fullMark: 5,
  }));

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid stroke="#E5E1DB" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fontSize: 11, fill: '#A2A2A2' }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 5]}
            tick={{ fontSize: 10, fill: '#A2A2A2' }}
            tickCount={6}
          />
          <Radar
            name="Score"
            dataKey="score"
            stroke="#00ACD9"
            fill="#00ACD9"
            fillOpacity={0.2}
            strokeWidth={2}
          />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
}
