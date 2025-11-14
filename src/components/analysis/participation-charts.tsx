'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { ParticipationMetric } from '@/lib/types';
import { BarChart3 } from 'lucide-react';

const ParticipationCharts = ({ metrics }: { metrics: ParticipationMetric[] }) => {
  if (!metrics) {
    return <div>Loading participation metrics...</div>;
  }

  const speakingTimeData = metrics.map(m => ({
    name: m.label || m.speaker,
    'Speaking Time (seconds)': m.speakingTime || 0,
  }));

  const wordCountData = metrics.map(m => ({
    name: m.label || m.speaker,
    'Word Count': m.wordCount || 0,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Participation Metrics
        </CardTitle>
        <CardDescription>Speaking time and word count analysis</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Speaking Time</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={speakingTimeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Speaking Time (seconds)" fill="hsl(var(--chart-1))" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Word Count</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={wordCountData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Word Count" fill="hsl(var(--chart-2))" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ParticipationCharts;
