/**
 * Copyright (c) 2025 Répét Contributors
 * Licensed under the MIT License
 * See LICENSE file in the project root for full license text
 */

/**
 * Type declarations for Emscripten WASM modules
 */

/**
 * Emscripten File System API
 */
interface EmscriptenFS {
  /**
   * Write data to a file
   */
  writeFile(path: string, data: string | ArrayBufferView, opts?: { encoding?: string }): void

  /**
   * Read a file
   */
  readFile(path: string, opts?: { encoding?: string }): string | Uint8Array

  /**
   * Create a directory
   */
  mkdir(path: string): void

  /**
   * Delete a file
   */
  unlink(path: string): void

  /**
   * Delete a directory
   */
  rmdir(path: string): void

  /**
   * Check if a path exists
   */
  stat(path: string): { size: number; mtime: Date; isDir: boolean }

  /**
   * Analyze a path (more detailed than stat)
   */
  analyzePath(path: string): { exists: boolean; isRoot: boolean; error?: string }

  /**
   * List directory contents
   */
  readdir(path: string): string[]

  /**
   * Initialize stdin/stdout/stderr streams
   */
  init(
    stdin: (() => number | null) | null,
    stdout: ((char: number) => void) | null,
    stderr: ((char: number) => void) | null
  ): void
}

/**
 * Emscripten Module interface
 */
interface EmscriptenModule {
  /**
   * File system API
   */
  FS: EmscriptenFS

  /**
   * Call the main function
   */
  callMain(args: string[]): number

  /**
   * Print function
   */
  print?: (text: string) => void

  /**
   * Print error function
   */
  printErr?: (text: string) => void

  /**
   * Locate file function for loading dependencies
   */
  locateFile?: (path: string, scriptDirectory?: string) => string

  /**
   * Called when module is ready
   */
  onRuntimeInitialized?: () => void

  /**
   * Don't call main() automatically
   */
  noInitialRun?: boolean

  /**
   * Stdin callback - return char code or null for EOF
   */
  stdin?: () => number | null

  /**
   * Stdout callback - called for each character written to stdout
   */
  stdout?: (charCode: number) => void

  /**
   * Stderr callback - called for each character written to stderr
   */
  stderr?: (charCode: number) => void

  /**
   * Memory view
   */
  HEAP8?: Int8Array
  HEAP16?: Int16Array
  HEAP32?: Int32Array
  HEAPU8?: Uint8Array
  HEAPU16?: Uint16Array
  HEAPU32?: Uint32Array
  HEAPF32?: Float32Array
  HEAPF64?: Float64Array
}

/**
 * Window extension for Emscripten modules
 */
/**
 * Piper Phonemize specific module interface
 */
export interface PiperPhonemizeModule extends EmscriptenModule {
  FS: EmscriptenFS
  callMain(args: string[]): number
}

declare global {
  interface Window {
    /**
     * Piper Phonemize module factory
     */
    createPiperPhonemize?: (
      moduleOverrides?: Partial<PiperPhonemizeModule>
    ) => Promise<PiperPhonemizeModule>
  }
}

export {}
