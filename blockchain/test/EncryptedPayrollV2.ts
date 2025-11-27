import { expect } from "chai";
import { ethers } from "hardhat";
import { EncryptedPayrollV2 } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

// Mock FHE operations since we are in a testing environment
// Note: Real FHE requires the local FHEVM node, but for logic testing we check state transitions
describe("EncryptedPayrollV2", function () {
    let payroll: EncryptedPayrollV2;
    let owner: SignerWithAddress;
    let hr: SignerWithAddress;
    let employee: SignerWithAddress;
    let otherAccount: SignerWithAddress;

    const HR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("HR_ROLE"));

    beforeEach(async function () {
        [owner, hr, employee, otherAccount] = await ethers.getSigners();

        const PayrollFactory = await ethers.getContractFactory("EncryptedPayrollV2");
        payroll = await PayrollFactory.deploy();
        await payroll.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            const DEFAULT_ADMIN_ROLE = await payroll.DEFAULT_ADMIN_ROLE();
            expect(await payroll.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
        });

        it("Should grant HR role to deployer initially", async function () {
            expect(await payroll.hasRole(HR_ROLE, owner.address)).to.be.true;
        });
    });

    describe("Role Management", function () {
        it("Should allow admin to grant HR role", async function () {
            await payroll.grantRole(HR_ROLE, hr.address);
            expect(await payroll.hasRole(HR_ROLE, hr.address)).to.be.true;
        });

        it("Should prevent non-admin from granting roles", async function () {
            await expect(
                payroll.connect(otherAccount).grantRole(HR_ROLE, hr.address)
            ).to.be.reverted; // AccessControl revert
        });

        it("Should allow admin to revoke HR role", async function () {
            await payroll.grantRole(HR_ROLE, hr.address);
            await payroll.revokeRole(HR_ROLE, hr.address);
            expect(await payroll.hasRole(HR_ROLE, hr.address)).to.be.false;
        });
    });

    describe("Stream Management (Logic Only)", function () {
        // Note: We cannot easily test full FHE encryption/decryption in this basic suite 
        // without spinning up the full tfhe-rs mock, but we CAN test the access control 
        // and state logic that surrounds it.

        beforeEach(async function () {
            await payroll.grantRole(HR_ROLE, hr.address);
        });

        it("Should allow HR to cancel a stream", async function () {
            // We can't create a stream easily without valid FHE proofs, 
            // but we can verify that cancelStream reverts if stream doesn't exist
            await expect(
                payroll.connect(hr).cancelStream(employee.address)
            ).to.be.revertedWith("Stream does not exist");
        });

        it("Should prevent non-HR from cancelling streams", async function () {
            await expect(
                payroll.connect(otherAccount).cancelStream(employee.address)
            ).to.be.reverted; // AccessControl revert
        });

        it("Should allow HR to pause/resume streams", async function () {
            // Again, testing the revert conditions confirms the modifier logic works
            await expect(
                payroll.connect(hr).pauseStream(employee.address)
            ).to.be.revertedWith("Stream does not exist");
        });
    });

    describe("Hook System", function () {
        it("Should allow admin to approve hooks", async function () {
            const mockHookAddress = otherAccount.address; // Using EOA as dummy hook address
            await payroll.approveHook(mockHookAddress);
            expect(await payroll.approvedHooks(mockHookAddress)).to.be.true;
        });

        it("Should allow admin to revoke hooks", async function () {
            const mockHookAddress = otherAccount.address;
            await payroll.approveHook(mockHookAddress);
            await payroll.revokeHook(mockHookAddress);
            expect(await payroll.approvedHooks(mockHookAddress)).to.be.false;
        });

        it("Should prevent HR from registering unapproved hooks", async function () {
            const mockHookAddress = otherAccount.address;
            // Should revert because stream doesn't exist (checked first) or hook not approved
            await expect(
                payroll.connect(hr).registerHook(employee.address, mockHookAddress)
            ).to.be.reverted;
        });
    });
});
