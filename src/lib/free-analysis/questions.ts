/**
 * Free Unanswered Question Detection using Adjacency Logic
 * No AI, 30x faster, checks actual response patterns
 */

export interface UnansweredQuestion {
  question: string;
  speaker: string;
  timestamp: string;
}

export interface UnansweredQuestionDetectionResult {
  unansweredQuestions: UnansweredQuestion[];
}

interface Utterance {
  speaker: string;
  label: string;
  text: string;
  timestamp: string;
}

/**
 * Detect unanswered questions using adjacency-response logic
 */
export function detectUnansweredQuestions(
  utterances: Utterance[]
): UnansweredQuestionDetectionResult {
  const unanswered: UnansweredQuestion[] = [];

  for (let i = 0; i < utterances.length; i++) {
    const utterance = utterances[i];

    // Check if utterance contains a question
    const hasQuestionMark = utterance.text.includes('?');
    const hasQuestionWord = /\b(what|when|where|who|why|how|which|can|could|would|should|will|is|are|do|does|did)\b/i.test(
      utterance.text.substring(0, 50) // Check first 50 chars
    );

    if (!hasQuestionMark && !hasQuestionWord) {
      continue; // Not a question
    }

    // Look ahead for an answer (check next 4 utterances)
    let hasAnswer = false;
    const lookAheadWindow = 4;

    for (let j = i + 1; j < Math.min(i + 1 + lookAheadWindow, utterances.length); j++) {
      const response = utterances[j];

      // Skip if same speaker (self-answering or continuation)
      if (response.speaker === utterance.speaker) {
        continue;
      }

      // Check for answer indicators
      const responseText = response.text.toLowerCase();

      // Direct answer patterns
      const directAnswerPatterns = [
        /^(yes|no|sure|okay|right|correct|exactly|absolutely|definitely|probably|maybe|perhaps)/i,
        /^(i think|i believe|i would say|in my opinion)/i,
        /^(the answer is|it('s| is)|that('s| is))/i,
        /^(because|since|due to)/i,
      ];

      const hasDirectAnswer = directAnswerPatterns.some(pattern =>
        pattern.test(responseText)
      );

      // Indirect answer: response is substantive (not just acknowledgment)
      const isSubstantive = response.text.split(' ').length > 5;

      // Acknowledgment without answer
      const isJustAcknowledgment = /^(okay|ok|alright|got it|understood|noted|thanks|thank you)$/i.test(
        responseText.trim()
      );

      if ((hasDirectAnswer || isSubstantive) && !isJustAcknowledgment) {
        hasAnswer = true;
        break;
      }
    }

    // If no answer found, mark as unanswered
    if (!hasAnswer) {
      // Additional validation: skip rhetorical questions
      const rhetoricalIndicators = [
        /right\?$/i,
        /isn't it\?$/i,
        /don't you think\?$/i,
        /you know\?$/i,
        /correct\?$/i,
      ];

      const isRhetorical = rhetoricalIndicators.some(pattern =>
        pattern.test(utterance.text.trim())
      );

      if (!isRhetorical) {
        unanswered.push({
          question: utterance.text.trim(),
          speaker: utterance.label,
          timestamp: utterance.timestamp,
        });
      }
    }
  }

  return {
    unansweredQuestions: unanswered.slice(0, 20), // Limit to 20 questions
  };
}
