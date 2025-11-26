// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {euint128} from "@fhevm/solidity/lib/FHE.sol";

/**
 * @title IPayrollHook
 * @notice Interface for contracts that hook into payroll events
 * @dev All hooks receive encrypted data only - no plaintext exposure
 */
interface IPayrollHook {
    /**
     * @notice Called when a new salary stream is created
     * @param employee Address of the employee
     * @param encryptedSalary Encrypted salary per block (euint128)
     */
    function onStreamCreated(
        address employee,
        euint128 encryptedSalary
    ) external;
    
    /**
     * @notice Called when an employee withdraws salary
     * @param employee Address of the employee
     * @param encryptedAmount Encrypted withdrawal amount (euint128)
     */
    function onSalaryWithdrawn(
        address employee,
        euint128 encryptedAmount
    ) external;
    
    /**
     * @notice Called when a stream is canceled
     * @param employee Address of the employee
     * @param encryptedFinalBalance Encrypted final claimed amount (euint128)
     */
    function onStreamCanceled(
        address employee,
        euint128 encryptedFinalBalance
    ) external;
}
