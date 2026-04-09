'use client';

import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { MaturityDimension } from '@/lib/types';

interface RadarChartProps {
  dimensions: MaturityDimension[];
}

const shortNames: Record<string, string> = {
  'R&D & Technology Investment': 'R&D & Tech',
  'Product & Service Innovation': 'Product',
  'Digital Transformation': 'Digital',
  'External Partnerships & Open Innovation': 'Partnerships',
  'Market Leadership & Strategic Vision': 'Vision',
};

export default function RadarChart({ dimensions }: RadarChartProps) {
  const data = dimensions.map((d) => ({
    dimension: shortNames[d.dimension_name] || d.dimension_name,
    score: Number(d.score) || 0,
    fullMark: 5,
  }));

  if (data.length === 0) return null;

  return (
    <div className="w-full">
      <div className="h-[380px]">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsRadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
            <PolarGrid stroke="#E5E1DB" strokeWidth={1} />
            <PolarAngleAxis
              dataKey="dimension"
              tick={{ fontSize: 13, fill: '#07242D', fontWeight: 700 }}
              tickLine={false}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 5]}
              tick={{ fontSize: 10, fill: '#A2A2A2' }}
              tickCount={6}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#07242D',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '13px',
                fontFamily: 'monospace',
              }}
              formatter={(value) => [`${Number(value).toFixed(1)} / 5.0`, 'Score']}
            />
            <Radar
              name="Score"
              dataKey="score"
              stroke="#00ACD9"
              fill="#00ACD9"
              fillOpacity={0.2}
              strokeWidth={2.5}
              dot={{ r: 5, fill: '#00ACD9', stroke: '#fff', strokeWidth: 2 }}
            />
          </RechartsRadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
