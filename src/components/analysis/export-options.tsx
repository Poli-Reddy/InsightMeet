'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Download, FileText, Mail } from 'lucide-react';
import { AnalysisData } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface ExportOptionsProps {
  data: AnalysisData;
}

const ExportOptions = ({ data }: ExportOptionsProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const downloadTranscript = (format: 'txt' | 'csv') => {
    try {
      let content = '';
      
      if (format === 'txt') {
        content = `Meeting: ${data.summary.title}\n`;
        content += `Overall Sentiment: ${data.summary.overallSentiment}\n\n`;
        content += `TRANSCRIPT\n${'='.repeat(50)}\n\n`;
        
        data.transcript.forEach(entry => {
          content += `[${entry.timestamp}] ${entry.label} (${entry.speaker}):\n`;
          content += `${entry.text}\n`;
          content += `Sentiment: ${entry.sentiment} | Emotion: ${entry.emotion}\n\n`;
        });
      } else if (format === 'csv') {
        content = 'Timestamp,Speaker,Label,Text,Sentiment,Emotion\n';
        data.transcript.forEach(entry => {
          const text = entry.text.replace(/"/g, '""');
          content += `"${entry.timestamp}","${entry.speaker}","${entry.label}","${text}","${entry.sentiment}","${entry.emotion}"\n`;
        });
      }

      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transcript-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Download Complete',
        description: `Transcript downloaded as ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: 'Download Failed',
        description: 'Failed to download transcript',
        variant: 'destructive',
      });
    }
  };

  const generateMeetingMinutes = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/generate-minutes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      });

      if (!response.ok) throw new Error('Failed to generate minutes');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meeting-minutes-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'PDF Generated',
        description: 'Meeting minutes downloaded successfully',
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to generate PDF. Feature coming soon!',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5" />
          Export & Share
        </CardTitle>
        <CardDescription>Download meeting analysis and transcripts</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => downloadTranscript('txt')}
          >
            <FileText className="w-4 h-4 mr-2" />
            Download Transcript (TXT)
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => downloadTranscript('csv')}
          >
            <FileText className="w-4 h-4 mr-2" />
            Download Transcript (CSV)
          </Button>

          <Button
            variant="default"
            className="w-full justify-start md:col-span-2"
            onClick={generateMeetingMinutes}
            disabled={isExporting}
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? 'Generating...' : 'Generate Meeting Minutes (PDF)'}
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start md:col-span-2"
            disabled
          >
            <Mail className="w-4 h-4 mr-2" />
            Email Summary (Coming Soon)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExportOptions;
