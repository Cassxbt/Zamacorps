// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {FHE, euint128, euint8, ebool, externalEuint128} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {IPayrollHook} from "./interfaces/IPayrollHook.sol";

/**
 * @title IncomeOracle
 * @notice Privacy-preserving income attestation oracle using homomorphic comparisons
 * @dev Allows employees to prove income exceeds threshold WITHOUT revealing exact amount
 * 
 * Key Features:
 * - Accumulates encrypted withdrawal amounts via payroll hook
 * - Generates attestations with tier system (A/B/C)
 * - Zero-knowledge: verifier learns ONLY if threshold met + tier
 * - Never exposes plaintext salary or income
 */
contract IncomeOracle is IPayrollHook, ZamaEthereumConfig {
    struct AttestationRequest {
        address verifier;       // Who requested the proof
        address employee;       // Who is being verified
        euint128 threshold;     // Encrypted minimum income required
        uint64 requestedAt;     // When request was made
        bool fulfilled;         // Has result been generated
    }
    
    struct AttestationResult {
        ebool meetsThreshold;   // Encrypted: does income >= threshold?
        euint8 tier;           // Encrypted tier: 0=None, 1=C, 2=B, 3=A
        uint64 generatedAt;    // When result was generated
    }
    
    // Accumulated withdrawn amounts (encrypted) - tracks employee income
    mapping(address => euint128) public accumulatedIncome;
    
    // Attestation storage
    mapping(bytes32 => AttestationRequest) public requests;
    mapping(bytes32 => AttestationResult) public results;
    
    // Reference to payroll contract (for access control)
    address public immutable payrollContract;
    
    // Events
    event AttestationRequested(
        bytes32 indexed requestId,
        address indexed verifier,
        address indexed employee,
        uint64 timestamp
    );
    event AttestationGenerated(
        bytes32 indexed requestId,
        address indexed verifier,
        address indexed employee,
        uint64 timestamp
    );
    event IncomeAccumulated(address indexed employee, uint64 timestamp);
    
    /**
     * @notice Initialize oracle with payroll contract address
     * @param _payroll Address of EncryptedPayrollV2 contract
     */
    constructor(address _payroll) {
        require(_payroll != address(0), "Invalid payroll address");
        payrollContract = _payroll;
    }
    
    /**
     * @notice Hook: Accumulate withdrawn salary (encrypted)
     * @dev Called by payroll contract when employee withdraws
     * @param employee Employee who withdrew
     * @param encryptedAmount Encrypted withdrawal amount
     */
    function onSalaryWithdrawn(
        address employee,
        euint128 encryptedAmount
    ) external override {
        require(msg.sender == payrollContract, "Only payroll contract");
        
        // Homomorphic addition: accumulate encrypted amounts
        if (FHE.isInitialized(accumulatedIncome[employee])) {
            accumulatedIncome[employee] = FHE.add(
                accumulatedIncome[employee],
                encryptedAmount
            );
        } else {
            // First withdrawal - initialize
            accumulatedIncome[employee] = encryptedAmount;
        }
        
        // ACL: Grant permissions
        FHE.allowThis(accumulatedIncome[employee]);
        FHE.allow(accumulatedIncome[employee], employee); // Employee can decrypt
        
        emit IncomeAccumulated(employee, uint64(block.timestamp));
    }
    
    /**
     * @notice Hook: Initialize income tracking on stream creation
     * @dev Called by payroll contract when stream is created
     * @param employee Employee address
     */
    function onStreamCreated(
        address employee,
        euint128 // encryptedSalary - not used
    ) external override {
        require(msg.sender == payrollContract, "Only payroll contract");
        
        // Initialize accumulated income to zero
        if (!FHE.isInitialized(accumulatedIncome[employee])) {
            accumulatedIncome[employee] = FHE.asEuint128(0);
            FHE.allowThis(accumulatedIncome[employee]);
            FHE.allow(accumulatedIncome[employee], employee);
        }
    }
    
    /**
     * @notice Hook: Called on stream cancel (no action needed)
     * @param employee Employee address
     */
    function onStreamCanceled(
        address employee,
        euint128 // encryptedFinalBalance - not used
    ) external override {
        require(msg.sender == payrollContract, "Only payroll contract");
        // No action needed - accumulated income persists for attestations
    }
    
    /**
     * @notice Request income attestation for employee
     * @param employee Employee to verify
     * @param encryptedThreshold Encrypted minimum income (client-side encrypted)
     * @param thresholdProof Zero-knowledge proof for threshold
     * @return requestId Unique identifier for this attestation request
     */
    function requestAttestation(
        address employee,
        externalEuint128 encryptedThreshold,
        bytes calldata thresholdProof
    ) external returns (bytes32 requestId) {
        // Convert external encrypted threshold with ZKPoK verification
        euint128 threshold = FHE.fromExternal(
            encryptedThreshold,
            thresholdProof
        );
        
        // Generate unique request ID
        requestId = keccak256(abi.encodePacked(
            msg.sender,      // verifier
            employee,
            block.timestamp,
            block.number
        ));
        
        // Store request
        requests[requestId] = AttestationRequest({
            verifier: msg.sender,
            employee: employee,
            threshold: threshold,
            requestedAt: uint64(block.timestamp),
            fulfilled: false
        });
        
        // ACL: Contract needs to read threshold
        FHE.allowThis(threshold);
        
        emit AttestationRequested(
            requestId,
            msg.sender,
            employee,
            uint64(block.timestamp)
        );
        
        return requestId;
    }
    
    /**
     * @notice Generate attestation result (anyone can trigger)
     * @dev Performs homomorphic comparison to determine if income meets threshold
     * @param requestId ID of the attestation request
     */
    function generateAttestation(bytes32 requestId) external {
        AttestationRequest storage req = requests[requestId];
        require(!req.fulfilled, "Already fulfilled");
        require(
            FHE.isInitialized(accumulatedIncome[req.employee]),
            "No income data for employee"
        );
        
        // HOMOMORPHIC COMPARISON (⭐ Key FHE operation)
        // Compare encrypted income vs encrypted threshold WITHOUT decryption
        ebool meetsThreshold = FHE.ge(
            accumulatedIncome[req.employee],
            req.threshold
        );
        
        // Calculate tier levels (A/B/C based on multiples of threshold)
        // Tier C: meets threshold (1.0x)
        // Tier B: income >= 2.0x threshold
        // Tier A: income >= 3.0x threshold
        
        // Calculate 2.0x threshold
        euint128 tierB_threshold = FHE.mul(
            req.threshold,
            FHE.asEuint128(2)
        );
        
        // Calculate 3.0x threshold
        euint128 tierA_threshold = FHE.mul(
            req.threshold,
            FHE.asEuint128(3)
        );
        
        // Homomorphic comparisons for tiers
        ebool isTierA = FHE.ge(accumulatedIncome[req.employee], tierA_threshold);
        ebool isTierB = FHE.ge(accumulatedIncome[req.employee], tierB_threshold);
        
        // Encode tier using homomorphic select
        // Start with 0 (None), upgrade based on comparisons
        euint8 tier = FHE.asEuint8(0); // None
        tier = FHE.select(meetsThreshold, FHE.asEuint8(1), tier); // C if meets base
        tier = FHE.select(isTierB, FHE.asEuint8(2), tier); // B if >= 2.0x
        tier = FHE.select(isTierA, FHE.asEuint8(3), tier); // A if >= 3.0x

        
        // Store encrypted result
        results[requestId] = AttestationResult({
            meetsThreshold: meetsThreshold,
            tier: tier,
            generatedAt: uint64(block.timestamp)
        });
        
        // ACL: Grant decryption permission to verifier ONLY
        FHE.allow(meetsThreshold, req.verifier);
        FHE.allow(tier, req.verifier);
        
        // Mark as fulfilled
        req.fulfilled = true;
        
        emit AttestationGenerated(
            requestId,
            req.verifier,
            req.employee,
            uint64(block.timestamp)
        );
    }
    
    /**
     * @notice Get encrypted handles for attestation result
     * @dev Verifier uses these handles to decrypt the result client-side
     * @param requestId ID of the attestation request
     * @return meetsThresholdHandle Encrypted boolean handle
     * @return tierHandle Encrypted tier handle
     */
    function getAttestationHandles(bytes32 requestId)
        external
        view
        returns (bytes32 meetsThresholdHandle, bytes32 tierHandle)
    {
        AttestationResult memory result = results[requestId];
        require(result.generatedAt > 0, "Attestation not generated yet");
        
        return (
            FHE.toBytes32(result.meetsThreshold),
            FHE.toBytes32(result.tier)
        );
    }
    
    /**
     * @notice Check if request has been fulfilled
     * @param requestId ID of the attestation request
     * @return fulfilled True if attestation has been generated
     */
    function isRequestFulfilled(bytes32 requestId) external view returns (bool fulfilled) {
        return requests[requestId].fulfilled;
    }
    
    /**
     * @notice Get accumulated income handle for employee (employee only)
     * @dev Employee can use this to decrypt their own accumulated income
     * @param employee Employee address
     * @return incomeHandle Encrypted income handle
     */
    function getAccumulatedIncomeHandle(address employee)
        external
        view
        returns (bytes32 incomeHandle)
    {
        require(
            msg.sender == employee || msg.sender == payrollContract,
            "Only employee or payroll"
        );
        require(FHE.isInitialized(accumulatedIncome[employee]), "No income data");
        
        return FHE.toBytes32(accumulatedIncome[employee]);
    }
}
