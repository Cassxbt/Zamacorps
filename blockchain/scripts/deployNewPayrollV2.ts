import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("=".repeat(60));
    console.log("Deploying NEW EncryptedPayrollV2 (with Hooks)");
    console.log("=".repeat(60));
    console.log("Deployer:", deployer.address);
    console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

    // Deploy new EncryptedPayrollV2
    console.log("\n🚀 Deploying EncryptedPayrollV2...");
    const EncryptedPayrollV2 = await ethers.getContractFactory("EncryptedPayrollV2");
    const payroll = await EncryptedPayrollV2.deploy();

    await payroll.waitForDeployment();
    const payrollAddress = await payroll.getAddress();

    console.log("\n✅ EncryptedPayrollV2 deployed to:", payrollAddress);

    // Verify roles
    console.log("\n🔍 Verifying roles...");
    const DEFAULT_ADMIN_ROLE = await payroll.DEFAULT_ADMIN_ROLE();
    const HR_ROLE = await payroll.HR_ROLE();

    const hasAdmin = await payroll.hasRole(DEFAULT_ADMIN_ROLE, deployer.address);
    const hasHR = await payroll.hasRole(HR_ROLE, deployer.address);

    console.log("   Admin role:", hasAdmin ? "✅" : "❌");
    console.log("   HR role:", hasHR ? "✅" : "❌");

    // Fund the contract
    console.log("\n💰 Funding contract with 0.1 ETH...");
    const fundTx = await deployer.sendTransaction({
        to: payrollAddress,
        value: ethers.parseEther("0.1")
    });
    await fundTx.wait();
    console.log("   Funded!");

    console.log("\n" + "=".repeat(60));
    console.log("📝 DEPLOYMENT SUMMARY");
    console.log("=".repeat(60));
    console.log("EncryptedPayrollV2:", payrollAddress);
    console.log("\n⚠️  NEXT STEPS:");
    console.log("1. Update blockchain/.env:");
    console.log(`   PAYROLL_V2_ADDRESS=${payrollAddress}`);
    console.log("\n2. Deploy IncomeOracle with new payroll address");
    console.log("\n3. Approve oracle as hook");
    console.log("\n4. Update frontend .env:");
    console.log(`   NEXT_PUBLIC_PAYROLL_ADDRESS=${payrollAddress}`);
    console.log("=".repeat(60));
}

main().catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exitCode = 1;
});
