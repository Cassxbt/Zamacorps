// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {FHE, euint128, euint64, ebool, externalEuint128} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import {IPayrollHook} from "./interfaces/IPayrollHook.sol";

/**
 * @title EncryptedPayrollV2 
 * @notice Encrypted payroll streaming with enumeration (v2.0 - Zama Compliant)
 * @dev Follows Zama fhEVM best practices for ACL, input validation, and stream management
 */
contract EncryptedPayrollV2 is AccessControl, ZamaEthereumConfig {
    bytes32 public constant HR_ROLE = keccak256("HR_ROLE");

    struct EncryptedStream {
        euint128 salaryPerBlock;
        uint64 startBlock;      // Plaintext for transparency & UI countdowns
        uint64 cliffBlock;      // Plaintext for transparency & UI countdowns
        euint128 claimedAmount;
        bool isPaused;
        bool exists;  // Track existence for enumeration
    }

    // Stream storage
    mapping(address => EncryptedStream) public streams;
    
    // Employee tracking for enumeration
    address[] private employeeList;
    mapping(address => uint256) private employeeIndex; // 1-based index (0 = not in list)
    
    // Hook system storage
    mapping(address => address) public employeeHooks; // employee => hook contract
    mapping(address => bool) public approvedHooks; // admin-approved hooks whitelist
    
    // Withdrawal storage (Required for Relayer access)
    mapping(address => euint128) public withdrawals;

    // Events
    event StreamCreated(address indexed employee, uint64 startBlock);
    event WithdrawalReady(address indexed employee, bytes32 claimableHandle);
    event SalaryWithdrawn(address indexed employee, uint256 amount);


    event StreamPaused(address indexed employee);
    event StreamResumed(address indexed employee);
    event StreamCanceled(address indexed employee);
    
    // Hook events
    event HookApproved(address indexed hook);
    event HookRevoked(address indexed hook);
    event HookRegistered(address indexed employee, address indexed hook);
    event HookRemoved(address indexed employee);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(HR_ROLE, msg.sender);
    }

    /**
     * @notice Create an encrypted salary stream for an employee
     * @param employee Employee address
     * @param encryptedSalary Encrypted salary per block (client-side encrypted)
     * @param salaryProof Zero-knowledge proof of plaintext knowledge
     * @param startBlock Block number when vesting starts
     * @param cliffBlock Block number when cliff ends
     */
    function createStream(
        address employee,
        externalEuint128 encryptedSalary,
        bytes calldata salaryProof,
        uint64 startBlock,
        uint64 cliffBlock
    ) external onlyRole(HR_ROLE) {
        require(employee != address(0), "Invalid employee address");
        require(!streams[employee].exists, "Stream already exists");

        // Convert external encrypted input with ZKPoK verification
        euint128 salary = FHE.fromExternal(encryptedSalary, salaryProof);
        euint128 claimed = FHE.asEuint128(0);

        // Store encrypted stream with plaintext blocks
        streams[employee] = EncryptedStream({
            salaryPerBlock: salary,
            startBlock: startBlock,
            cliffBlock: cliffBlock,
            claimedAmount: claimed,
            isPaused: false,
            exists: true
        });

        // ACL: Grant permissions following Zama best practices
        FHE.allowThis(salary);      // Contract can read
        FHE.allow(salary, employee);  // Employee can decrypt their own salary
        FHE.allowThis(claimed);

        // Add to employee tracking list
        if (employeeIndex[employee] == 0) {
            employeeList.push(employee);
            employeeIndex[employee] = employeeList.length; // 1-based
        }
        
        // Call registered hook (non-blocking)
        address hook = employeeHooks[employee];
        if (hook != address(0)) {
            try IPayrollHook(hook).onStreamCreated(employee, salary) {
                // Hook executed successfully
            } catch {
                // Hook failed, continue anyway (non-blocking)
            }
        }

        emit StreamCreated(employee, startBlock);
    }

    /**
     * @notice Calculate and make claimable amount decryptable
     * @dev Client must call this, decrypt off-chain, then call submitWithdrawal
     * @return claimableHandle The encrypted handle for client-side decryption
     */
    function requestWithdrawal() external returns (bytes32 claimableHandle) {
        EncryptedStream storage stream = streams[msg.sender];
        require(stream.exists, "No stream found");
        require(!stream.isPaused, "Stream is paused");
        
        uint64 currentBlock = uint64(block.number);
        
        // Check cliff: if current < cliff, accrued is 0
        bool isPastCliff = currentBlock >= stream.cliffBlock;
        
        // Blocks passed = current - start
        uint64 blocksPassed = 0;
        if (currentBlock > stream.startBlock) {
            blocksPassed = currentBlock - stream.startBlock;
        }
        
        // Accrued = salary * blocksPassed (if past cliff)
        euint128 accrued = FHE.mul(stream.salaryPerBlock, FHE.asEuint128(blocksPassed));
        
        // If not past cliff, accrued is 0
        if (!isPastCliff) {
            accrued = FHE.asEuint128(0);
        }
        
        // Claimable = accrued - claimed
        euint128 claimable = FHE.sub(accrued, stream.claimedAmount);
        
        // 1. Store in state FIRST (Persistent Handle)
        withdrawals[msg.sender] = claimable;
        
        // 2. Read back from storage to get the persistent reference
        euint128 storedClaimable = withdrawals[msg.sender];
        
        // 3. Grant permissions on the PERSISTENT reference
        FHE.allowThis(storedClaimable);
        FHE.allow(storedClaimable, msg.sender);
        
        // 4. Return the handle of the PERSISTENT reference
        claimableHandle = FHE.toBytes32(storedClaimable);
        
        emit WithdrawalReady(msg.sender, claimableHandle);
    }

    /**
     * @notice Submit withdrawal after client-side decryption
     * @dev Called after user decrypts amount using fhevmjs
     * @param amount The decrypted amount to withdraw
     */
    function submitWithdrawal(uint128 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        
        EncryptedStream storage stream = streams[msg.sender];
        require(stream.exists, "No stream found");
        
        // Update claimed amount (encrypted)
        stream.claimedAmount = FHE.add(stream.claimedAmount, FHE.asEuint128(amount));
        FHE.allowThis(stream.claimedAmount);
        
        // Call registered hook (non-blocking)
        address hook = employeeHooks[msg.sender];
        if (hook != address(0)) {
            euint128 encAmount = FHE.asEuint128(amount);
            FHE.allow(encAmount, hook); // Grant hook permission to read
            
            try IPayrollHook(hook).onSalaryWithdrawn(msg.sender, encAmount) {
                // Hook executed successfully
            } catch {
                // Hook failed, continue anyway (non-blocking)
            }
        }
        
        // Transfer funds
        payable(msg.sender).transfer(amount);
        
        emit SalaryWithdrawn(msg.sender, amount);
    }

    /**
     * @notice Pause a stream (HR only)
     * @param employee Employee address
     */
    function pauseStream(address employee) external onlyRole(HR_ROLE) {
        require(streams[employee].exists, "Stream does not exist");
        require(!streams[employee].isPaused, "Already paused");
        
        streams[employee].isPaused = true;
        emit StreamPaused(employee);
    }

    /**
     * @notice Resume a paused stream (HR only)
     * @param employee Employee address
     */
    function resumeStream(address employee) external onlyRole(HR_ROLE) {
        require(streams[employee].exists, "Stream does not exist");
        require(streams[employee].isPaused, "Not paused");
        
        streams[employee].isPaused = false;
        emit StreamResumed(employee);
    }

    /**
     * @notice Cancel and delete a stream (HR only)
     * @param employee Employee address
     */
    function cancelStream(address employee) external onlyRole(HR_ROLE) {
        require(streams[employee].exists, "Stream does not exist");
        
        // Call registered hook before deletion (non-blocking)
        address hook = employeeHooks[employee];
        if (hook != address(0)) {
            try IPayrollHook(hook).onStreamCanceled(
                employee,
                streams[employee].claimedAmount
            ) {
                // Hook executed successfully
            } catch {
                // Hook failed, continue anyway (non-blocking)
            }
        }
        
        // Delete stream
        delete streams[employee];
        
        // Remove from employee list
        uint256 index = employeeIndex[employee];
        if (index > 0) {
            uint256 lastIndex = employeeList.length - 1;
            address lastEmployee = employeeList[lastIndex];
            
            // Swap with last element
            employeeList[index - 1] = lastEmployee;
            employeeIndex[lastEmployee] = index;
            
            // Remove last element
            employeeList.pop();
            delete employeeIndex[employee];
        }
        
        emit StreamCanceled(employee);
    }

    /**
     * @notice Get total number of active streams
     * @return count Number of streams
     */
    function getStreamCount() external view returns (uint256 count) {
        return employeeList.length;
    }

    /**
     * @notice Get employee address by index
     * @param index Index in employee list (0-based)
     * @return employee Employee address
     */
    function getEmployeeByIndex(uint256 index) external view returns (address employee) {
        require(index < employeeList.length, "Index out of bounds");
        return employeeList[index];
    }

    /**
     * @notice Get paginated list of employees
     * @param offset Starting index
     * @param limit Number of results
     * @return employees Array of employee addresses
     */
    function getEmployees(uint256 offset, uint256 limit) 
        external 
        view 
        returns (address[] memory employees) 
    {
        require(offset < employeeList.length, "Offset out of bounds");
        
        uint256 end = offset + limit;
        if (end > employeeList.length) {
            end = employeeList.length;
        }
        
        employees = new address[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            employees[i - offset] = employeeList[i];
        }
        
        return employees;
    }

    /**
     * @notice Get stream data for an employee
     * @param employee Employee address
     * @return salaryPerBlock Encrypted salary per block
     * @return startBlock Plaintext start block
     * @return cliffBlock Plaintext cliff block
     * @return claimedAmount Encrypted claimed amount
     */
    function getStream(address employee) external view returns (
        euint128 salaryPerBlock,
        uint64 startBlock,
        uint64 cliffBlock,
        euint128 claimedAmount
    ) {
        EncryptedStream memory stream = streams[employee];
        require(stream.exists, "Stream does not exist");
        return (stream.salaryPerBlock, stream.startBlock, stream.cliffBlock, stream.claimedAmount);
    }

    /**
     * @notice Check if employee has an active stream
     * @param employee Employee address
     * @return exists True if stream exists
     */
    function hasStream(address employee) external view returns (bool exists) {
        return streams[employee].exists;
    }
    
    /**
     * @notice Approve a hook contract (admin only)
     * @param hook Address of the hook contract to approve
     */
    function approveHook(address hook) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(hook != address(0), "Invalid hook address");
        approvedHooks[hook] = true;
        emit HookApproved(hook);
    }
    
    /**
     * @notice Revoke a hook contract (admin only)
     * @param hook Address of the hook contract to revoke
     */
    function revokeHook(address hook) external onlyRole(DEFAULT_ADMIN_ROLE) {
        approvedHooks[hook] = false;
        emit HookRevoked(hook);
    }
    
    /**
     * @notice Register a hook for an employee (HR only)
     * @param employee Employee address
     * @param hook Hook contract address (must be approved)
     */
    function registerHook(address employee, address hook) 
        external 
        onlyRole(HR_ROLE) 
    {
        require(streams[employee].exists, "Stream does not exist");
        require(approvedHooks[hook], "Hook not approved");
        employeeHooks[employee] = hook;
        emit HookRegistered(employee, hook);
    }
    
    /**
     * @notice Remove hook for an employee (HR only)
     * @param employee Employee address
     */
    function removeHook(address employee) external onlyRole(HR_ROLE) {
        delete employeeHooks[employee];
        emit HookRemoved(employee);
    }

    // Allow contract to receive ETH for payroll payments
    receive() external payable {}
}
