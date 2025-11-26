import { ethers } from "hardhat";

async function main() {
    const PAYROLL_ADDRESS = "0x1cD2d67ab3Cb3e35F14c7907b9f5CF8dB1AC38Da";

    console.log("=".repeat(60));
    console.log("Finding Admin Account for EncryptedPayrollV2");
    console.log("=".repeat(60));

    // Connect to contract
    const payroll = await ethers.getContractAt("EncryptedPayrollV2", PAYROLL_ADDRESS);

    // Get DEFAULT_ADMIN_ROLE hash
    const DEFAULT_ADMIN_ROLE = await payroll.DEFAULT_ADMIN_ROLE();
    console.log("\n📋 DEFAULT_ADMIN_ROLE:", DEFAULT_ADMIN_ROLE);

    // Get HR_ROLE hash
    const HR_ROLE = await payroll.HR_ROLE();
    console.log("📋 HR_ROLE:", HR_ROLE);

    // Check deployer account
    const deployerAddress = "0xA9dF08F928A6518CF296B59309F4CD668CC8C321";
    const hasAdmin = await payroll.hasRole(DEFAULT_ADMIN_ROLE, deployerAddress);
    const hasHR = await payroll.hasRole(HR_ROLE, deployerAddress);

    console.log("\n🔍 Checking Deployer Account:", deployerAddress);
    console.log("   Has DEFAULT_ADMIN_ROLE:", hasAdmin);
    console.log("   Has HR_ROLE:", hasHR);

    if (hasAdmin) {
        console.log("\n✅ Admin Account Found:", deployerAddress);
        console.log("\n⚠️  Use this account in MetaMask to approve the hook!");
    } else {
        console.log("\n❌ Deployer is NOT admin. Checking on Etherscan...");
        console.log("\n🔗 Check contract on Etherscan:");
        console.log(`   https://sepolia.etherscan.io/address/${PAYROLL_ADDRESS}#readContract`);
        console.log("\n   Look for 'getRoleMember' with:");
        console.log(`   role: ${DEFAULT_ADMIN_ROLE}`);
        console.log("   index: 0");
    }

    console.log("=".repeat(60));
}

main().catch((error) => {
    console.error("❌ Error:", error);
    process.exitCode = 1;
});
