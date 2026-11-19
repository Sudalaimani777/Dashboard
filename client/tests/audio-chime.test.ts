import assert from 'node:assert/strict';
import { playNotificationChime } from '../src/shared/utils/audioChime';

async function run() {
  console.log('🧪 Testing Web Audio API Chime Synthesizer...');

  // 1. Safe in SSR / non-browser environment (window is undefined)
  assert.doesNotThrow(() => {
    playNotificationChime();
  }, 'Should not throw when window is undefined');

  // 2. Mock browser environment with AudioContext
  let oscillatorsCreated = 0;
  let gainsCreated = 0;
  const frequencies: number[] = [];
  const startTimes: number[] = [];
  const stopTimes: number[] = [];
  let resumed = false;

  class MockGainNode {
    gain = {
      setValueAtTime: (_val: number, _time: number) => {},
      exponentialRampToValueAtTime: (_val: number, _time: number) => {},
    };
    connect(_dest: unknown) {}
  }

  class MockOscillatorNode {
    type = 'sine';
    frequency = {
      setValueAtTime: (val: number, _time: number) => {
        frequencies.push(val);
      },
    };
    connect(_dest: unknown) {}
    start(time: number) {
      startTimes.push(time);
    }
    stop(time: number) {
      stopTimes.push(time);
    }
  }

  class MockAudioContext {
    currentTime = 10.0;
    state = 'suspended';
    destination = {};

    async resume() {
      resumed = true;
    }

    createOscillator() {
      oscillatorsCreated++;
      return new MockOscillatorNode();
    }

    createGain() {
      gainsCreated++;
      return new MockGainNode();
    }
  }

  (globalThis as any).window = {
    AudioContext: MockAudioContext,
  };

  assert.doesNotThrow(() => {
    playNotificationChime();
  }, 'Should not throw with mocked AudioContext');

  assert.equal(oscillatorsCreated, 2, 'Should create 2 oscillators for dual-tone chime');
  assert.equal(gainsCreated, 2, 'Should create 2 gain nodes for dual-tone chime');
  assert.equal(frequencies[0], 587.33, 'First tone should be D5 (587.33 Hz)');
  assert.equal(frequencies[1], 880.0, 'Second tone should be A5 (880.00 Hz)');
  assert.equal(resumed, true, 'Should attempt to resume suspended AudioContext');

  // 3. Graceful handling when AudioContext throws (e.g. autoplay policy restriction)
  class BrokenAudioContext {
    constructor() {
      throw new DOMException('Autoplay policy prevented audio playback', 'NotAllowedError');
    }
  }

  (globalThis as any).window.AudioContext = BrokenAudioContext;

  assert.doesNotThrow(() => {
    playNotificationChime();
  }, 'Should gracefully catch autoplay restriction errors without crashing');

  // Clean up global mock
  delete (globalThis as any).window;

  console.log('✅ ALL AUDIO CHIME TESTS PASSED!');
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
