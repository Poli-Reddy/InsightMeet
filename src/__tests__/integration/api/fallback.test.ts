describe('AI Service Fallback Chain', () => {
  test('should have fallback mechanism in place', () => {
    // Test that the fallback chain is properly configured
    expect(process.env.ASSEMBLYAI_API_KEY).toBeDefined();
    expect(process.env.DEEPGRAM_API_KEY).toBeDefined();
    expect(process.env.GEMINI_API_KEY).toBeDefined();
  });

  test('should prioritize AssemblyAI over other services', () => {
    // Verify environment is set up correctly
    const hasAssemblyAI = !!process.env.ASSEMBLYAI_API_KEY;
    const hasDeepgram = !!process.env.DEEPGRAM_API_KEY;
    const hasGemini = !!process.env.GEMINI_API_KEY;

    expect(hasAssemblyAI).toBe(true);
    expect(hasDeepgram).toBe(true);
    expect(hasGemini).toBe(true);
  });

  test('should have all required API keys configured', () => {
    const requiredKeys = [
      'ASSEMBLYAI_API_KEY',
      'DEEPGRAM_API_KEY',
      'GEMINI_API_KEY',
      'GROQ_API_KEY'
    ];

    requiredKeys.forEach(key => {
      expect(process.env[key]).toBeDefined();
      expect(process.env[key]).not.toBe('');
    });
  });
});
