/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

export { ttsEngine, TTSEngine } from './engine'
export { voiceManager, VoiceManager } from './voice-manager'
export { SpeechQueue } from './queue'
export type { TTSState, SpeechConfig, TTSEvents, VoiceInfo } from './types'
export {
  createReadingModeConfig,
  shouldReadLine,
  getLineVolume,
  isUserLine,
  SilentMode,
  AudioMode,
  ItalianMode,
} from './readingModes'
export type { ReadingMode, ReadingModeConfig } from './readingModes'
