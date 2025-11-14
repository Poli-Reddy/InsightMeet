'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, FileText, FileJson, FileSpreadsheet } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AnalysisData } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface ExportResultsButtonProps {
  analysisData: AnalysisData;
}

export default function ExportResultsButton({ analysisData }: ExportResultsButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const downloadTranscript = (format: 'txt' | 'csv') => {
    try {
      let content = '';
      
      if (format === 'txt') {
        content = `Meeting: ${analysisData.summary.title}\n`;
        content += `Overall Sentiment: ${analysisData.summary.overallSentiment}\n\n`;
        content += `TRANSCRIPT\n${'='.repeat(50)}\n\n`;
        
        analysisData.transcript.forEach(entry => {
          content += `[${entry.timestamp}] ${entry.label} (${entry.speaker}):\n`;
          content += `${entry.text}\n`;
          content += `Sentiment: ${entry.sentiment} | Emotion: ${entry.emotion}\n\n`;
        });
      } else if (format === 'csv') {
        content = 'Timestamp,Speaker,Label,Text,Sentiment,Emotion\n';
        analysisData.transcript.forEach(entry => {
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
      setIsOpen(false);
    } catch (error) {
      toast({
        title: 'Download Failed',
        description: 'Failed to download transcript',
        variant: 'destructive',
      });
    }
  };

  const downloadJSON = () => {
    try {
      const blob = new Blob([JSON.stringify(analysisData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analysis-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast({
        title: 'Download Complete',
        description: 'Analysis data downloaded as JSON',
      });
      setIsOpen(false);
    } catch (error) {
      toast({
        title: 'Download Failed',
        description: 'Failed to download JSON',
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
        body: JSON.stringify({ data: analysisData }),
      });

      if (!response.ok) throw new Error('Failed to generate minutes');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meeting-minutes-${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Download Complete',
        description: 'Meeting minutes downloaded successfully',
      });
      setIsOpen(false);
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to generate meeting minutes',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative inline-flex items-center justify-center rounded-full text-sm font-medium bg-gradient-to-r from-mocha to-caramel text-ivory shadow-2xl h-12 px-6 overflow-hidden group w-full"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-mocha-light to-caramel-light opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="relative flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Results
          </span>
        </motion.button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Analysis Results</DialogTitle>
          <DialogDescription>
            Choose the format you want to download your meeting analysis
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-4">
          <Button
            variant="outline"
            className="w-full justify-start h-auto py-4"
            onClick={() => downloadTranscript('txt')}
          >
            <FileText className="w-5 h-5 mr-3" />
            <div className="text-left">
              <div className="font-semibold">Transcript (TXT)</div>
              <div className="text-xs text-muted-foreground">Full transcript with timestamps and sentiment</div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start h-auto py-4"
            onClick={() => downloadTranscript('csv')}
          >
            <FileSpreadsheet className="w-5 h-5 mr-3" />
            <div className="text-left">
              <div className="font-semibold">Transcript (CSV)</div>
              <div className="text-xs text-muted-foreground">Spreadsheet format for data analysis</div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start h-auto py-4"
            onClick={generateMeetingMinutes}
            disabled={isExporting}
          >
            <FileText className="w-5 h-5 mr-3" />
            <div className="text-left">
              <div className="font-semibold">Meeting Minutes (TXT)</div>
              <div className="text-xs text-muted-foreground">
                {isExporting ? 'Generating...' : 'Summary with action items and decisions'}
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start h-auto py-4"
            onClick={downloadJSON}
          >
            <FileJson className="w-5 h-5 mr-3" />
            <div className="text-left">
              <div className="font-semibold">Full Analysis (JSON)</div>
              <div className="text-xs text-muted-foreground">Complete data for developers</div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
