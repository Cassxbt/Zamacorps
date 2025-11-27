import { ethers } from "hardhat";

async function main() {
    const PAYROLL_ADDRESS = "0x63e9336A8C9B1B9EbF3741a733f4888B91C73549";
    const ORACLE_ADDRESS = "0x094F7C9c590E00165976a10E268CAa5ce7e66A07";

    const [signer] = await ethers.getSigners();

    console.log("=".repeat(60));
    console.log("Approving Hook - Attempt with Manual Gas");
    console.log("=".repeat(60));
    console.log("Account:", signer.address);
    console.log("Payroll:", PAYROLL_ADDRESS);
    console.log("Oracle:", ORACLE_ADDRESS);

    // Connect to contract
    const payroll = await ethers.getContractAt("EncryptedPayrollV2", PAYROLL_ADDRESS);

    // Verify we have admin role
    const DEFAULT_ADMIN_ROLE = await payroll.DEFAULT_ADMIN_ROLE();
    const hasAdmin = await payroll.hasRole(DEFAULT_ADMIN_ROLE, signer.address);

    if (!hasAdmin) {
        throw new Error("Account does not have DEFAULT_ADMIN_ROLE!");
    }

    console.log("\n✅ Confirmed admin rights");

    // Try to estimate gas first to see the specific error
    console.log("\n🔍 Estimating gas...");
    try {
        const gasEstimate = await payroll.approveHook.estimateGas(ORACLE_ADDRESS);
        console.log("   Gas estimate:", gasEstimate.toString());

        // Execute with extra gas
        console.log("\n🚀 Approving hook...");
        const tx = await payroll.approveHook(ORACLE_ADDRESS, {
            gasLimit: gasEstimate * BigInt(2) // 2x safety margin
        });

        console.log("   TX hash:", tx.hash);
        const receipt = await tx.wait();
        console.log("\n✅ SUCCESS!");
        console.log("   Block:", receipt?.blockNumber);

    } catch (error: any) {
        console.error("\n❌ Transaction failed!");
        console.error("Error:", error.message);

        if (error.message.includes("revert")) {
            console.log("\n🔍 Possible reasons:");
            console.log("1. Hook address is zero");
            console.log("2. Function doesn't exist on deployed contract");
            console.log("3. Contract was deployed without hook functionality");

            console.log("\n💡 Solution:");
            console.log("The deployed EncryptedPayrollV2 contract might not have");
            console.log("the hook functionality. You may need to:");
            console.log("1. Deploy a NEW EncryptedPayrollV2 with hook features");
            console.log("2. Migrate from old contract to new");
        }

        throw error;
    }
}

main().catch((error) => {
    console.error("\nFull error:", error);
    process.exitCode = 1;
});
