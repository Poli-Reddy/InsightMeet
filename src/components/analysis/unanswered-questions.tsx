import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UnansweredQuestion } from "@/lib/types";

interface UnansweredQuestionsProps {
  unansweredQuestions: UnansweredQuestion[];
}

export function UnansweredQuestions({ unansweredQuestions }: UnansweredQuestionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Unanswered Questions</CardTitle>
      </CardHeader>
      <CardContent>
        {unansweredQuestions.length > 0 ? (
          <ul className="space-y-2">
            {unansweredQuestions.map((item, index) => (
              <li key={index} className="flex items-start">
                <div className="flex-1">
                  <p className="font-semibold">{item.question}</p>
                  <p className="text-sm text-muted-foreground">
                    Asked by {item.speaker} at {item.timestamp}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>No unanswered questions identified.</p>
        )}
      </CardContent>
    </Card>
  );
}
