/**
 * Performance Demonstration for Transferable Objects
 *
 * This file demonstrates the performance benefits of using transferable objects
 * when communicating with web workers.
 */

import { prepareForTransfer, postMessageWithTransferables } from './transferable-utils';

/**
 * Create a sample book data structure with large ArrayBuffers
 */
function createSampleBookData(imageSizeMB: number = 5, imageCount: number = 10) {
  const images = [];

  for (let i = 0; i < imageCount; i++) {
    const buffer = new ArrayBuffer(imageSizeMB * 1024 * 1024);
    // Fill with some data to simulate real image
    const view = new Uint8Array(buffer);
    for (let j = 0; j < view.length; j += 1000) {
      view[j] = Math.floor(Math.random() * 256);
    }

    images.push({
      id: `image-${i}`,
      buffer,
      mimeType: 'image/jpeg',
      width: 1920,
      height: 1080,
    });
  }

  return {
    type: 'COMPLETE',
    timestamp: Date.now(),
    data: {
      buffer: new ArrayBuffer(10 * 1024 * 1024), // 10MB EPUB/PDF
      fileName: 'sample-book.epub',
      fileSize: 10 * 1024 * 1024,
      mimeType: 'application/epub+zip',
      metadata: {
        pageCount: 300,
        wordCount: 80000,
        processingTimeMs: 5000,
        images,
      },
    },
  };
}

/**
 * Measure the time to prepare data for transfer
 */
export function measureTransferPreparation(
  imageSizeMB: number = 5,
  imageCount: number = 10
): {
  totalDataMB: number;
  transferableCount: number;
  transferableBytesMB: number;
  prepareTimeMs: number;
  throughputMBps: number;
} {
  const bookData = createSampleBookData(imageSizeMB, imageCount);

  const startTime = performance.now();
  const result = prepareForTransfer(bookData);
  const endTime = performance.now();

  const totalDataMB = (imageSizeMB * imageCount + 10);
  const transferableBytesMB = result.metrics.transferableBytes / (1024 * 1024);
  const prepareTimeMs = endTime - startTime;
  const throughputMBps = transferableBytesMB / (prepareTimeMs / 1000);

  return {
    totalDataMB,
    transferableCount: result.metrics.transferableCount,
    transferableBytesMB,
    prepareTimeMs,
    throughputMBps,
  };
}

/**
 * Compare performance between structured clone and transfer
 */
export function compareCloneVsTransfer(
  imageSizeMB: number = 5,
  imageCount: number = 10
): {
  structuredClone: { timeMs: number; sizeMB: number };
  transfer: { timeMs: number; sizeMB: number };
  speedupFactor: number;
} {
  const bookData = createSampleBookData(imageSizeMB, imageCount);
  const totalSizeMB = (imageSizeMB * imageCount + 10);

  // Test structured clone (copies data)
  const cloneStart = performance.now();
  try {
    structuredClone(bookData);
  } catch (e) {
    // Some browsers may not support structuredClone
    console.warn('structuredClone not supported');
  }
  const cloneEnd = performance.now();
  const cloneTime = cloneEnd - cloneStart;

  // Test transfer preparation (ownership transfer)
  const transferStart = performance.now();
  prepareForTransfer(bookData);
  const transferEnd = performance.now();
  const transferTime = transferEnd - transferStart;

  const speedupFactor = cloneTime / transferTime;

  return {
    structuredClone: {
      timeMs: cloneTime,
      sizeMB: totalSizeMB,
    },
    transfer: {
      timeMs: transferTime,
      sizeMB: totalSizeMB,
    },
    speedupFactor,
  };
}

/**
 * Run performance benchmarks and log results
 */
export function runPerformanceBenchmarks() {
  console.log('=== Transferable Objects Performance Benchmark ===\n');

  // Test 1: Small data (5MB total)
  console.log('Test 1: Small data (1 image × 5MB)');
  const small = measureTransferPreparation(5, 1);
  console.log(`  Total data: ${small.totalDataMB}MB`);
  console.log(`  Transferables found: ${small.transferableCount}`);
  console.log(`  Transferable data: ${small.transferableBytesMB.toFixed(2)}MB`);
  console.log(`  Preparation time: ${small.prepareTimeMs.toFixed(2)}ms`);
  console.log(`  Throughput: ${small.throughputMBps.toFixed(2)}MB/s\n`);

  // Test 2: Medium data (50MB total)
  console.log('Test 2: Medium data (10 images × 5MB)');
  const medium = measureTransferPreparation(5, 10);
  console.log(`  Total data: ${medium.totalDataMB}MB`);
  console.log(`  Transferables found: ${medium.transferableCount}`);
  console.log(`  Transferable data: ${medium.transferableBytesMB.toFixed(2)}MB`);
  console.log(`  Preparation time: ${medium.prepareTimeMs.toFixed(2)}ms`);
  console.log(`  Throughput: ${medium.throughputMBps.toFixed(2)}MB/s\n`);

  // Test 3: Large data (100MB total)
  console.log('Test 3: Large data (10 images × 10MB)');
  const large = measureTransferPreparation(10, 10);
  console.log(`  Total data: ${large.totalDataMB}MB`);
  console.log(`  Transferables found: ${large.transferableCount}`);
  console.log(`  Transferable data: ${large.transferableBytesMB.toFixed(2)}MB`);
  console.log(`  Preparation time: ${large.prepareTimeMs.toFixed(2)}ms`);
  console.log(`  Throughput: ${large.throughputMBps.toFixed(2)}MB/s\n`);

  // Test 4: Clone vs Transfer comparison
  console.log('Test 4: Clone vs Transfer (10 images × 5MB)');
  const comparison = compareCloneVsTransfer(5, 10);
  console.log(`  Structured Clone: ${comparison.structuredClone.timeMs.toFixed(2)}ms`);
  console.log(`  Transfer Prep: ${comparison.transfer.timeMs.toFixed(2)}ms`);
  console.log(`  Speedup: ${comparison.speedupFactor.toFixed(2)}x faster\n`);

  console.log('=== Performance Benefits ===');
  console.log('Using transferable objects provides:');
  console.log('1. Zero-copy transfer of ArrayBuffers (ownership transfer)');
  console.log('2. Reduced memory usage (no duplication)');
  console.log('3. Faster message passing for large data');
  console.log('4. Lower GC pressure\n');
}

// Export for use in demos/testing
if (typeof window !== 'undefined') {
  (window as any).runTransferablesBenchmark = runPerformanceBenchmarks;
}
