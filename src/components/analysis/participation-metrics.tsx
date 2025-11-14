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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { ParticipationMetric } from '@/lib/types';
import { User, Clock, MessageSquare, TrendingUp, Heart } from 'lucide-react';

const ParticipationMetrics = ({ metrics }: { metrics: ParticipationMetric[] }) => {
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

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'Positive': return 'text-green-600';
      case 'Negative': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getSentimentBg = (sentiment?: string) => {
    switch (sentiment) {
      case 'Positive': return 'bg-green-100';
      case 'Negative': return 'bg-red-100';
      default: return 'bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Participant Profile Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Participant Profile Dashboard
          </CardTitle>
          <CardDescription>Individual speaker analysis and engagement metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.map((metric, idx) => {
              const speakingTimeSec = metric.speakingTime || 0;
              
              return (
                <Card key={idx} className="border-2">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div 
                        className={`w-10 h-10 rounded-full ${metric.characteristic?.color || 'bg-gray-400'} flex items-center justify-center text-white font-bold`}
                      >
                        {(metric.label || metric.speaker).charAt(0)}
                      </div>
                      <div>
                        <CardTitle className="text-base">{metric.label || metric.speaker}</CardTitle>
                        <p className="text-xs text-muted-foreground">{metric.speaker}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        Speaking Time
                      </span>
                      <span className="font-semibold">{speakingTimeSec}s</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <MessageSquare className="w-4 h-4" />
                        Word Count
                      </span>
                      <span className="font-semibold">{metric.wordCount || 0}</span>
                    </div>

                    {metric.engagement !== undefined && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <TrendingUp className="w-4 h-4" />
                          Engagement
                        </span>
                        <span className="font-semibold">{metric.engagement.toFixed(1)}%</span>
                      </div>
                    )}

                    {metric.sentiment && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Heart className="w-4 h-4" />
                          Avg Sentiment
                        </span>
                        <span className={`font-semibold px-2 py-1 rounded ${getSentimentBg(metric.sentiment)} ${getSentimentColor(metric.sentiment)}`}>
                          {metric.sentiment}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Overall Participation Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Participation Metrics</CardTitle>
          <CardDescription>Speaking time and word count for each participant</CardDescription>
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
    </div>
  );
};

export default ParticipationMetrics;