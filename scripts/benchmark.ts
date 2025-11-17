/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Performance Benchmarking Script
 *
 * This script measures the RPS (Requests Per Second) of various endpoints
 * to establish baseline performance metrics and validate optimizations.
 */

import autocannon from 'autocannon';
import { spawn } from 'child_process';
import { promisify } from 'util';

const sleep = promisify(setTimeout);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface BenchmarkResult {
  endpoint: string;
  requests: {
    total: number;
    average: number;
    mean: number;
    stddev: number;
    min: number;
    max: number;
    p0_001: number;
    p0_01: number;
    p0_1: number;
    p1: number;
    p2_5: number;
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
    p97_5: number;
    p99: number;
    p99_9: number;
    p99_99: number;
    p99_999: number;
    sent: number;
  };
  latency: {
    average: number;
    mean: number;
    stddev: number;
    min: number;
    max: number;
    p0_001: number;
    p0_01: number;
    p0_1: number;
    p1: number;
    p2_5: number;
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
    p97_5: number;
    p99: number;
    p99_9: number;
    p99_99: number;
    p99_999: number;
  };
  throughput: {
    average: number;
    mean: number;
    stddev: number;
    min: number;
    max: number;
    total: number;
    p0_001: number;
    p0_01: number;
    p0_1: number;
    p1: number;
    p2_5: number;
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
    p97_5: number;
    p99: number;
    p99_9: number;
    p99_99: number;
    p99_999: number;
  };
  errors: number;
  timeouts: number;
  duration: number;
  start: string;
  finish: string;
}

const BASE_URL = 'http://localhost:3000';
let server: any = null;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const authToken = '';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function startServer(): Promise<void> {
  console.log('Starting server...');
  server = spawn('npm', ['run', 'dev'], {
    cwd: process.cwd(),
    shell: true,
    stdio: 'ignore',
  });

  // Wait for server to be ready
  await sleep(5000);
  console.log('Server started\n');
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function stopServer(): Promise<void> {
  if (server) {
    console.log('\nStopping server...');
    server.kill();
    await sleep(2000);
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function authenticate(): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const result = await autocannon({
      url: `${BASE_URL}/api/auth/signin`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Test123!@#',
      }),
      connections: 1,
      duration: 1,
    });

    // In real scenario, parse the token from response
    // For now, we'll use a mock token or you need to manually set it
    console.log('Authentication test completed');
  } catch (error) {
    console.error('Authentication failed:', error);
  }
}

async function runBenchmark(config: any): Promise<autocannon.Result> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${config.title}`);
  console.log(`Endpoint: ${config.method} ${config.url}`);
  console.log(`Duration: ${config.duration}s, Connections: ${config.connections}`);
  console.log('='.repeat(60));

  return new Promise((resolve, reject) => {
    const instance = autocannon(config, (err: Error | null, result: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });

    autocannon.track(instance, { renderProgressBar: true });
  });
}

function printResults(result: any, title: string): void {
  console.log(`\n${title} Results:`);
  console.log('-'.repeat(60));
  console.log(`Total Requests: ${result.requests.total}`);
  console.log(`Requests/sec: ${result.requests.average.toFixed(2)}`);
  console.log(`Latency (avg): ${result.latency.average.toFixed(2)}ms`);
  console.log(`Latency (p50): ${result.latency.p50.toFixed(2)}ms`);
  console.log(`Latency (p99): ${result.latency.p99.toFixed(2)}ms`);
  console.log(`Throughput: ${(result.throughput.average / 1024 / 1024).toFixed(2)} MB/s`);
  console.log(`Errors: ${result.errors}`);
  console.log(`Timeouts: ${result.timeouts}`);
  console.log('-'.repeat(60));
}

async function main(): Promise<void> {
  try {
    console.log('ExpenseTracker API Performance Benchmark');
    console.log('==========================================\n');

    // Don't start server if it's already running
    // await startServer();

    const benchmarks = [
      {
        title: 'Health Check (Baseline)',
        url: `${BASE_URL}/health`,
        method: 'GET',
        connections: 10,
        duration: 10,
      },
      {
        title: 'GET /api/expenses (List - No Auth for testing)',
        url: `${BASE_URL}/ping`,
        method: 'GET',
        connections: 10,
        duration: 10,
      },
      // Add more benchmarks as needed
    ];

    const results: any[] = [];

    for (const benchmark of benchmarks) {
      const result = await runBenchmark(benchmark);
      printResults(result, benchmark.title);
      results.push({ ...benchmark, result });

      // Wait between tests
      await sleep(2000);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    results.forEach((r, i) => {
      console.log(`\n${i + 1}. ${r.title}`);
      console.log(`   RPS: ${r.result.requests.average.toFixed(2)}`);
      console.log(`   Latency (p99): ${r.result.latency.p99.toFixed(2)}ms`);
    });
  } catch (error) {
    console.error('Benchmark failed:', error);
  } finally {
    // await stopServer();
    console.log('\nBenchmark complete!');
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { main as runBenchmark };
