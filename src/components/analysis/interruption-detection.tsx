import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Interruption } from "@/lib/types";

interface InterruptionDetectionProps {
  interruptions: Interruption[];
}

export function InterruptionDetection({ interruptions }: InterruptionDetectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Interruption Detection</CardTitle>
      </CardHeader>
      <CardContent>
        {interruptions.length > 0 ? (
          <ul className="space-y-2">
            {interruptions.map((item, index) => (
              <li key={index} className="flex items-start">
                <div className="flex-1">
                  <p className="font-semibold">
                    {item.interrupter} interrupted {item.interrupted}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Timestamp: {item.timestamp}
                  </p>
                  <p className="text-sm italic">"{item.text}"</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>No interruptions identified.</p>
        )}
      </CardContent>
    </Card>
  );
}
