/**
 * Encrypted Payroll Contract ABI and Constants
 */

import payrollAbi from './EncryptedPayroll.json';
// TODO: Add IncomeOracle.json when available

/**
 * Export the ABIs
 */
export const EncryptedPayrollABI = payrollAbi.abi;
// export const IncomeOracleABI = oracleAbi.abi;

export const ABIs = {
    payroll: EncryptedPayrollABI,
    // incomeOracle: IncomeOracleABI
};

/**
 * Type-safe contract function names
 */
export const CONTRACT_FUNCTIONS = {
    CREATE_STREAM: 'createStream',
    REQUEST_WITHDRAWAL: 'requestWithdrawal',
    SUBMIT_WITHDRAWAL: 'submitWithdrawal',
    GET_STREAM: 'getStream',
    GRANT_ROLE: 'grantRole',
    REVOKE_ROLE: 'revokeRole',
    HAS_ROLE: 'hasRole',
} as const;

/**
 * Type-safe event names
 */
export const CONTRACT_EVENTS = {
    STREAM_CREATED: 'StreamCreated',
    WITHDRAWAL_READY: 'WithdrawalReady',
    SALARY_WITHDRAWN: 'SalaryWithdrawn',
    ROLE_GRANTED: 'RoleGranted',
    ROLE_REVOKED: 'RoleRevoked',
} as const;

/**
 * Role constants (keccak256 hashes)
 */
export const ROLES = {
    DEFAULT_ADMIN: '0x0000000000000000000000000000000000000000000000000000000000000000',
    HR_ROLE: '0x' + Buffer.from('HR_ROLE').toString('hex').padStart(64, '0'),
} as const;
