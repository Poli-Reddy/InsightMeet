'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';

export type AnalysisMode = 'ai' | 'free';

interface ModeSelectorProps {
  value: AnalysisMode;
  onChange: (mode: AnalysisMode) => void;
}

export function ModeSelector({ value, onChange }: ModeSelectorProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Analysis Mode</CardTitle>
        <CardDescription>Choose how you want to analyze your meeting</CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup value={value} onValueChange={(v) => onChange(v as AnalysisMode)}>
          {/* AI Mode */}
          <div className="flex items-start space-x-3 space-y-0 rounded-md border border-mocha/30 p-4 hover:bg-mocha/20 hover:border-mocha/50 transition-all cursor-pointer">
            <RadioGroupItem value="ai" id="ai" />
            <div className="flex-1">
              <Label htmlFor="ai" className="cursor-pointer">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-ivory">🤖 AI Analysis (Premium)</span>
                  <Badge variant="default">Fast</Badge>
                </div>
              </Label>
            </div>
          </div>

          {/* Free Mode */}
          <div className="flex items-start space-x-3 space-y-0 rounded-md border border-mocha/30 p-4 hover:bg-caramel/20 hover:border-caramel/50 transition-all cursor-pointer">
            <RadioGroupItem value="free" id="free" />
            <div className="flex-1">
              <Label htmlFor="free" className="cursor-pointer">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-ivory">💰 Free Analysis (100% Free)</span>
                  <Badge variant="secondary">No Cost</Badge>
                </div>
              </Label>
            </div>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
}

export function AnalysisModeBadge({ mode }: { mode: AnalysisMode }) {
  if (mode === 'ai') {
    return (
      <Badge variant="default" className="gap-1">
        <span>🤖</span>
        <span>AI Generated</span>
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="gap-1">
      <span>💰</span>
      <span>Free Analysis</span>
    </Badge>
  );
}
