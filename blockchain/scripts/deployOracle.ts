import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("=".repeat(60));
    console.log("Deploying IncomeOracle with account:", deployer.address);
    console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
    console.log("=".repeat(60));

    // Get the deployed EncryptedPayrollV2 address
    // IMPORTANT: Replace this with your actual deployed payroll address
    const PAYROLL_ADDRESS = process.env.PAYROLL_V2_ADDRESS || "";

    if (!PAYROLL_ADDRESS) {
        throw new Error("PAYROLL_V2_ADDRESS not set in environment variables!");
    }

    console.log("\n📋 Configuration:");
    console.log("   Payroll Contract:", PAYROLL_ADDRESS);

    // Deploy IncomeOracle
    console.log("\n🚀 Deploying IncomeOracle...");
    const IncomeOracle = await ethers.getContractFactory("IncomeOracle");
    const oracle = await IncomeOracle.deploy(PAYROLL_ADDRESS);

    await oracle.waitForDeployment();
    const oracleAddress = await oracle.getAddress();

    console.log("\n✅ IncomeOracle deployed to:", oracleAddress);

    // Verify deployment
    console.log("\n🔍 Verifying deployment...");
    const payrollRef = await oracle.payrollContract();
    console.log("   Payroll reference:", payrollRef);
    console.log("   Match:", payrollRef === PAYROLL_ADDRESS ? "✅" : "❌");

    // Output summary
    console.log("\n" + "=".repeat(60));
    console.log("📝 DEPLOYMENT SUMMARY");
    console.log("=".repeat(60));
    console.log("IncomeOracle Address:", oracleAddress);
    console.log("Payroll Address:     ", PAYROLL_ADDRESS);
    console.log("\n⚠️  NEXT STEPS:");
    console.log("1. Update frontend .env:");
    console.log(`   NEXT_PUBLIC_INCOME_ORACLE_ADDRESS=${oracleAddress}`);
    console.log("\n2. Approve oracle as hook in EncryptedPayrollV2:");
    console.log(`   npx hardhat run scripts/approveOracleHook.ts --network sepolia`);
    console.log("\n3. Verify contract on Etherscan:");
    console.log(`   npx hardhat verify --network sepolia ${oracleAddress} ${PAYROLL_ADDRESS}`);
    console.log("=".repeat(60));
}

main().catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exitCode = 1;
});
