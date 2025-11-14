import { isVideoFile } from '@/lib/audio-extractor';

describe('Audio Extractor Utils', () => {
  test('identifies video files correctly', () => {
    expect(isVideoFile('video/mp4')).toBe(true);
    expect(isVideoFile('video/webm')).toBe(true);
    expect(isVideoFile('video/quicktime')).toBe(true);
  });

  test('identifies non-video files correctly', () => {
    expect(isVideoFile('audio/mpeg')).toBe(false);
    expect(isVideoFile('audio/wav')).toBe(false);
    expect(isVideoFile('image/png')).toBe(false);
  });
});
