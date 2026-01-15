/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

export { audioCacheService } from './AudioCacheService'
export type { CacheEntry, CacheMetadata, CacheStats } from './AudioCacheService'

export { ttsMetricsService } from './TTSMetricsService'
export type { TTSMetrics, TTSMetricsStats } from './TTSMetricsService'

export { voicePreloadService } from './VoicePreloadService'
export type { PreloadConfig, PreloadResult } from './VoicePreloadService'

export { audioPrefetchService } from './AudioPrefetchService'
export type { PrefetchItem, PrefetchResult } from './AudioPrefetchService'

export { audioStreamingService } from './AudioStreamingService'
export type { TextSegment, AudioSegment, StreamingOptions } from './AudioStreamingService'

export { audioCompressionService } from './AudioCompressionService'
export type { CompressionOptions, CompressionResult } from './AudioCompressionService'
