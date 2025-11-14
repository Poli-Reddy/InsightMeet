'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { ParticipationMetric } from '@/lib/types';
import { User, Clock, MessageSquare, TrendingUp, Heart } from 'lucide-react';

const ParticipantProfiles = ({ metrics }: { metrics: ParticipationMetric[] }) => {
  if (!metrics) {
    return <div>Loading participant profiles...</div>;
  }

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Participant Profiles
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
  );
};

export default ParticipantProfiles;
