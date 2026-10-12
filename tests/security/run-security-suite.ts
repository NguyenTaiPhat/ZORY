import { execSync } from 'child_process';
import { existsSync, writeFileSync } from 'fs';
import path from 'path';

interface SuiteResult {
  suite: string;
  passed: number;
  failed: number;
  total: number;
  details: string;
}

export function runSecuritySuite() {
  console.log('====================================================');
  console.log('       ZORY PLATFORM — SECURITY AUDIT SUITE         ');
  console.log('====================================================\n');

  const testFiles = [
    'tests/security/01_auth_rbac.test.ts',
    'tests/security/02_injection_input.test.ts',
    'tests/security/03_business_logic.test.ts',
    'tests/security/04_config_headers.test.ts',
    'tests/security/05_advanced_defense.test.ts',
    'tests/security/06_deep_rbac_audit.test.ts',
    'tests/security/07_residual_vulnerabilities.test.ts',
    'tests/security/08_request_random_token_nonce.test.ts',
  ];

  const results: SuiteResult[] = [];
  let totalPass = 0;
  let totalFail = 0;

  for (const file of testFiles) {
    console.log(`[TEST RUNNING] ${file}...`);
    let output = '';
    let isSuccess = false;
    try {
      output = execSync(`npx tsx --test ${file}`, {
        cwd: process.cwd(),
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      isSuccess = true;
    } catch (err: any) {
      output = (err.stdout || '') + '\n' + (err.stderr || '');
      isSuccess = false;
    }

    const passMatch = output.match(/ℹ pass (\d+)/);
    const failMatch = output.match(/ℹ fail (\d+)/);
    const passCount = passMatch ? parseInt(passMatch[1], 10) : 0;
    const failCount = failMatch ? parseInt(failMatch[1], 10) : (isSuccess ? 0 : 1);
    const totalCount = passCount + failCount;

    totalPass += passCount;
    totalFail += failCount;

    results.push({
      suite: path.basename(file),
      passed: passCount,
      failed: failCount,
      total: totalCount,
      details: output,
    });

    console.log(`  -> Passed: ${passCount}, Failed: ${failCount}\n`);
  }

  console.log('----------------------------------------------------');
  console.log(`TỔNG KẾT: PASSED: ${totalPass} | FAILED: ${totalFail} | TỔNG CỘNG: ${totalPass + totalFail}`);
  console.log('----------------------------------------------------\n');

  return {
    totalPass,
    totalFail,
    total: totalPass + totalFail,
    results,
  };
}

if (require.main === module) {
  runSecuritySuite();
}
