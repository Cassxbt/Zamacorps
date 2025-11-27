/**
 * Frontend Component Validation Suite
 * 
 * This file validates the integrity of core frontend components
 * by checking for required exports and structure.
 */

import { strict as assert } from 'assert';

async function validateComponents() {
    console.log('🧪 Running Frontend Component Validation...\n');

    let passed = 0;
    let failed = 0;

    // Test 1: Validate FHE Instance Module
    try {
        const { getFhevmInstance } = await import('../lib/fhe/instance');
        assert(typeof getFhevmInstance === 'function', 'getFhevmInstance should be a function');
        console.log('✅ FHE Instance module exports correctly');
        passed++;
    } catch (error) {
        console.error('❌ FHE Instance validation failed:', error);
        failed++;
    }

    // Test 2: Validate FHE Encryption Module
    try {
        const { encryptSalary } = await import('../lib/fhe/encrypt');
        assert(typeof encryptSalary === 'function', 'encryptSalary should be a function');
        console.log('✅ FHE Encryption module exports correctly');
        passed++;
    } catch (error) {
        console.error('❌ FHE Encryption validation failed:', error);
        failed++;
    }

    // Test 3: Validate FHE Decryption Module
    try {
        const { decryptValue } = await import('../lib/fhe/decrypt');
        assert(typeof decryptValue === 'function', 'decryptValue should be a function');
        console.log('✅ FHE Decryption module exports correctly');
        passed++;
    } catch (error) {
        console.error('❌ FHE Decryption validation failed:', error);
        failed++;
    }

    // Test 4: Validate Contract Interaction Module
    try {
        const { createPayrollStream, requestWithdrawal, submitWithdrawal } = await import('../lib/contracts/payroll');
        assert(typeof createPayrollStream === 'function', 'createPayrollStream should be a function');
        assert(typeof requestWithdrawal === 'function', 'requestWithdrawal should be a function');
        assert(typeof submitWithdrawal === 'function', 'submitWithdrawal should be a function');
        console.log('✅ Contract interaction module exports correctly');
        passed++;
    } catch (error) {
        console.error('❌ Contract interaction validation failed:', error);
        failed++;
    }

    // Summary
    console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

    if (failed > 0) {
        process.exit(1);
    }
}

validateComponents().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
