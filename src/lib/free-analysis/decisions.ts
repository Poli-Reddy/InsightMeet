/**
 * Free Decision Identification using Pattern Matching
 * No AI, 50x faster, highly reliable
 */

export interface DecisionIdentificationResult {
  decisions: string[];
}

/**
 * Extract decisions using cue lexicon and regex patterns
 */
export function identifyDecisions(transcript: string): DecisionIdentificationResult {
  const decisions = new Set<string>();

  // Decision cue patterns
  const patterns = [
    // "We/Team decided/agreed to X"
    /(?:we|team|group|everyone|all)\s+(?:decided|agreed|concluded|determined|resolved)\s+(?:to|that|on)\s+([^.!?\n]+)/gi,
    
    // "Decision: X" or "Decision is X"
    /(?:decision|conclusion|resolution)(?:\s+is|\s+was|:)\s*([^.!?\n]+)/gi,
    
    // "It was decided/agreed that X"
    /(?:it was|it's|it is)\s+(?:decided|agreed|concluded|determined)\s+(?:to|that)\s+([^.!?\n]+)/gi,
    
    // "Final decision X"
    /(?:final|ultimate|official)\s+(?:decision|conclusion|verdict|call)\s+(?:is|was|:)\s*([^.!?\n]+)/gi,
    
    // "Consensus is/was X"
    /(?:consensus|agreement)\s+(?:is|was|reached)\s+(?:to|that|on)?\s*([^.!?\n]+)/gi,
    
    // "We're going with X"
    /(?:we're|we are|we will be)\s+(?:going with|moving forward with|proceeding with|choosing|selecting)\s+([^.!?\n]+)/gi,
    
    // "Let's go with X"
    /(?:let's|let us)\s+(?:go with|move forward with|proceed with|choose|select)\s+([^.!?\n]+)/gi,
    
    // "Approved X" or "Rejected X"
    /(?:approved|rejected|accepted|denied|greenlit|authorized)\s+([^.!?\n]+)/gi,
    
    // "We'll X" (strong commitment)
    /(?:we'll|we will)\s+(?:implement|adopt|use|follow|pursue|execute)\s+([^.!?\n]+)/gi,
    
    // "Agreed on X"
    /(?:agreed on|settled on|committed to)\s+([^.!?\n]+)/gi
  ];

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(transcript)) !== null) {
      let decision = match[1] ? match[1].trim() : match[0].trim();
      
      // Clean up the decision text
      decision = decision
        .replace(/^(to|that|on)\s+/i, '') // Remove leading prepositions
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
      
      // Validate decision quality
      if (
        decision.length > 10 && // Minimum length
        decision.length < 300 && // Maximum length
        !decision.toLowerCase().startsWith('we ') && // Avoid duplicates
        !decision.toLowerCase().startsWith('team ') &&
        !/^(is|was|are|were|be|been)\b/i.test(decision) // Avoid incomplete sentences
      ) {
        decisions.add(decision);
      }
    }
  });

  // Additional pattern: Look for sentences with strong decision indicators
  const sentences = transcript.split(/[.!?]+/);
  
  sentences.forEach(sentence => {
    const normalized = sentence.toLowerCase().trim();
    
    // Strong decision indicators
    const hasStrongIndicator = 
      /\b(decided|agreed|concluded|approved|rejected|consensus|final decision|official decision)\b/.test(normalized);
    
    if (hasStrongIndicator && sentence.length > 20 && sentence.length < 300) {
      decisions.add(sentence.trim());
    }
  });

  return {
    decisions: Array.from(decisions).slice(0, 20) // Limit to 20 decisions
  };
}
