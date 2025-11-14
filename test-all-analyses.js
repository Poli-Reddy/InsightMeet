/**
 * Comprehensive Test for All Analyses (Free & AI Modes)
 * Tests all 11 analysis endpoints in both modes
 */

const testTranscript = `Speaker A (00:00:05): Good morning everyone. Let's start the meeting.
Speaker B (00:00:10): Good morning! I have some concerns about the project timeline.
Speaker A (00:00:15): What are your specific concerns?
Speaker B (00:00:20): We need to deliver by next Friday, but I'm not sure we can make it.
Speaker C (00:00:25): I agree with Speaker B. We should extend the deadline.
Speaker A (00:00:30): Okay, let's decide to extend the deadline by one week.
Speaker B (00:00:35): That sounds good. I'll update the project plan.
Speaker A (00:00:40): Great. Any other questions?
Speaker C (00:00:45): What about the budget?
Speaker A (00:00:50): Let's discuss that in the next meeting.`;

const API_BASE = 'http://localhost:3000/api';

const analyses = [
  { name: 'Keywords', endpoint: '/keywords', payload: { transcript: testTranscript } },
  { name: 'Summary', endpoint: '/summary-report', payload: { transcript: testTranscript } },
  { name: 'Action Items', endpoint: '/action-items', payload: { transcript: testTranscript } },
  { name: 'Decisions', endpoint: '/decisions', payload: { transcript: testTranscript } },
  { name: 'Interruptions', endpoint: '/interruptions', payload: { transcript: testTranscript } },
  { name: 'Questions', endpoint: '/unanswered-questions', payload: { transcript: testTranscript } },
  { name: 'Topics', endpoint: '/topics', payload: { transcript: testTranscript } },
  { name: 'Emotions', endpoint: '/emotions', payload: { text: 'I am very happy today!' } },
  { name: 'Relationship Graph', endpoint: '/relationship-graph', payload: { transcript: testTranscript } },
];

async function testAnalysis(name, endpoint, payload, mode) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, mode }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    const result = await response.json();
    return { success: true, result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🧪 Testing All Analyses - Free & AI Modes\n');
  console.log('='.repeat(80));
  
  const results = {
    free: { passed: 0, failed: 0, errors: [] },
    ai: { passed: 0, failed: 0, errors: [] },
  };

  // Test Free Mode
  console.log('\n🆓 FREE MODE TESTS\n');
  console.log('-'.repeat(80));
  
  for (const analysis of analyses) {
    process.stdout.write(`Testing ${analysis.name.padEnd(20)}... `);
    const result = await testAnalysis(analysis.name, analysis.endpoint, analysis.payload, 'free');
    
    if (result.success) {
      console.log('✅ PASS');
      results.free.passed++;
      
      // Show sample output
      if (analysis.name === 'Keywords' && result.result.keywords) {
        console.log(`   → Found ${result.result.keywords.length} keywords`);
      } else if (analysis.name === 'Summary' && result.result.summaryReport) {
        console.log(`   → Summary: ${result.result.summaryReport.substring(0, 60)}...`);
      } else if (analysis.name === 'Action Items' && result.result.actionItems) {
        console.log(`   → Found ${result.result.actionItems.length} action items`);
      } else if (analysis.name === 'Decisions' && result.result.decisions) {
        console.log(`   → Found ${result.result.decisions.length} decisions`);
      } else if (analysis.name === 'Interruptions' && result.result.interruptions) {
        console.log(`   → Found ${result.result.interruptions.length} interruptions`);
      } else if (analysis.name === 'Questions' && result.result.unansweredQuestions) {
        console.log(`   → Found ${result.result.unansweredQuestions.length} unanswered questions`);
      } else if (analysis.name === 'Topics' && result.result.topics) {
        console.log(`   → Found ${result.result.topics.length} topics`);
      } else if (analysis.name === 'Emotions' && result.result.emotion) {
        console.log(`   → Emotion: ${result.result.emotion}, Sentiment: ${result.result.sentiment}`);
      } else if (analysis.name === 'Relationship Graph' && result.result.graphData) {
        console.log(`   → Graph: ${result.result.graphData.nodes.length} nodes, ${result.result.graphData.links.length} links`);
      }
    } else {
      console.log('❌ FAIL');
      results.free.failed++;
      results.free.errors.push({ name: analysis.name, error: result.error });
      console.log(`   → Error: ${result.error}`);
    }
  }

  // Test AI Mode
  console.log('\n🤖 AI MODE TESTS\n');
  console.log('-'.repeat(80));
  
  for (const analysis of analyses) {
    process.stdout.write(`Testing ${analysis.name.padEnd(20)}... `);
    const result = await testAnalysis(analysis.name, analysis.endpoint, analysis.payload, 'ai');
    
    if (result.success) {
      console.log('✅ PASS');
      results.ai.passed++;
      
      // Show sample output
      if (analysis.name === 'Keywords' && result.result.keywords) {
        console.log(`   → Found ${result.result.keywords.length} keywords`);
      } else if (analysis.name === 'Summary' && result.result.summaryReport) {
        console.log(`   → Summary: ${result.result.summaryReport.substring(0, 60)}...`);
      } else if (analysis.name === 'Action Items' && result.result.actionItems) {
        console.log(`   → Found ${result.result.actionItems.length} action items`);
      } else if (analysis.name === 'Decisions' && result.result.decisions) {
        console.log(`   → Found ${result.result.decisions.length} decisions`);
      } else if (analysis.name === 'Interruptions' && result.result.interruptions) {
        console.log(`   → Found ${result.result.interruptions.length} interruptions`);
      } else if (analysis.name === 'Questions' && result.result.unansweredQuestions) {
        console.log(`   → Found ${result.result.unansweredQuestions.length} unanswered questions`);
      } else if (analysis.name === 'Topics' && result.result.topics) {
        console.log(`   → Found ${result.result.topics.length} topics`);
      } else if (analysis.name === 'Emotions' && result.result.emotion) {
        console.log(`   → Emotion: ${result.result.emotion}`);
      } else if (analysis.name === 'Relationship Graph' && result.result.graphData) {
        console.log(`   → Graph: ${result.result.graphData.nodes.length} nodes, ${result.result.graphData.links.length} links`);
      }
    } else {
      console.log('❌ FAIL');
      results.ai.failed++;
      results.ai.errors.push({ name: analysis.name, error: result.error });
      console.log(`   → Error: ${result.error}`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST SUMMARY\n');
  
  console.log('🆓 Free Mode:');
  console.log(`   ✅ Passed: ${results.free.passed}/${analyses.length}`);
  console.log(`   ❌ Failed: ${results.free.failed}/${analyses.length}`);
  
  console.log('\n🤖 AI Mode:');
  console.log(`   ✅ Passed: ${results.ai.passed}/${analyses.length}`);
  console.log(`   ❌ Failed: ${results.ai.failed}/${analyses.length}`);
  
  const totalPassed = results.free.passed + results.ai.passed;
  const totalTests = analyses.length * 2;
  const passRate = ((totalPassed / totalTests) * 100).toFixed(1);
  
  console.log(`\n📈 Overall: ${totalPassed}/${totalTests} tests passed (${passRate}%)`);
  
  // Show errors
  if (results.free.errors.length > 0 || results.ai.errors.length > 0) {
    console.log('\n❌ ERRORS:\n');
    
    if (results.free.errors.length > 0) {
      console.log('Free Mode Errors:');
      results.free.errors.forEach(err => {
        console.log(`   - ${err.name}: ${err.error}`);
      });
    }
    
    if (results.ai.errors.length > 0) {
      console.log('\nAI Mode Errors:');
      results.ai.errors.forEach(err => {
        console.log(`   - ${err.name}: ${err.error}`);
      });
    }
  }
  
  console.log('\n' + '='.repeat(80));
  
  // Exit with appropriate code
  const allPassed = results.free.failed === 0 && results.ai.failed === 0;
  if (allPassed) {
    console.log('\n🎉 All tests passed!\n');
    process.exit(0);
  } else {
    console.log('\n⚠️ Some tests failed. Please check the errors above.\n');
    process.exit(1);
  }
}

// Run tests
console.log('Starting tests in 2 seconds...');
console.log('Make sure the Next.js server is running on http://localhost:3000\n');

setTimeout(runTests, 2000);
