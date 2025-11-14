/**
 * Free Keyword Extraction using TF-IDF + NER
 * No AI, 100x faster, better for technical terms
 * Note: Uses simple TF-IDF implementation to avoid natural library issues
 */

import nlp from 'compromise';

export interface KeywordExtractionResult {
  keywords: string[];
}

const stopwords = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
  'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'should', 'could', 'may', 'might', 'must', 'can', 'this', 'that',
  'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
  'what', 'which', 'who', 'when', 'where', 'why', 'how', 'um', 'uh',
  'yeah', 'yes', 'no', 'okay', 'ok', 'well', 'so', 'like', 'just'
]);

/**
 * Extract keywords using simple TF-IDF and Named Entity Recognition
 */
export function extractKeywords(transcript: string): KeywordExtractionResult {
  const keywords = new Set<string>();

  // Method 1: Simple TF-IDF for important terms
  try {
    const words = transcript
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopwords.has(word));

    // Count word frequencies
    const wordFreq = new Map<string, number>();
    words.forEach(word => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });

    // Get top 15 most frequent words
    const topWords = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([word]) => word);

    topWords.forEach(word => keywords.add(word));
  } catch (error) {
    console.warn('TF-IDF extraction failed:', error);
  }

  // Method 2: Named Entity Recognition for people, places, organizations
  try {
    const doc = nlp(transcript);

    // Extract people names
    doc.people().forEach((person: any) => {
      const name = person.text().trim();
      if (name.length > 2) {
        keywords.add(name);
      }
    });

    // Extract organizations
    doc.organizations().forEach((org: any) => {
      const name = org.text().trim();
      if (name.length > 2) {
        keywords.add(name);
      }
    });

    // Extract places
    doc.places().forEach((place: any) => {
      const name = place.text().trim();
      if (name.length > 2) {
        keywords.add(name);
      }
    });

    // Extract important nouns
    const nouns = doc.nouns().out('array') as string[];
    const nounCounts = new Map<string, number>();
    
    nouns.forEach(noun => {
      const normalized = noun.toLowerCase().trim();
      if (normalized.length > 3 && !stopwords.has(normalized)) {
        nounCounts.set(normalized, (nounCounts.get(normalized) || 0) + 1);
      }
    });

    // Add top 10 frequent nouns
    Array.from(nounCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([noun]) => keywords.add(noun));
  } catch (error) {
    console.warn('NER extraction failed:', error);
  }

  // Convert to array and limit to 20 keywords
  return {
    keywords: Array.from(keywords).slice(0, 20)
  };
}
