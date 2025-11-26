const hre = require("hardhat");

async function main() {
    console.log("🚀 Deploying EncryptedPayrollV2 to Sepolia...\n");

    // Get deployer account
    const [deployer] = await hre.ethers.getSigners();
    console.log("📝 Deployer address:", deployer.address);

    // Check balance
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("💰 Deployer balance:", hre.ethers.formatEther(balance), "ETH\n");

    // Deploy contract
    console.log("⏳ Deploying EncryptedPayrollV2...");
    const EncryptedPayrollV2 = await hre.ethers.getContractFactory("EncryptedPayrollV2");
    const payroll = await EncryptedPayrollV2.deploy();

    await payroll.waitForDeployment();
    const address = await payroll.getAddress();

    console.log("✅ EncryptedPayrollV2 deployed to:", address);
    console.log("📍 Etherscan:", `https://sepolia.etherscan.io/address/${address}\n`);

    // Wait for confirmations before verification
    console.log("⏳ Waiting for 5 confirmations...");
    const deployTx = payroll.deploymentTransaction();
    if (deployTx) {
        await deployTx.wait(5);
    }

    // Verify on Etherscan
    console.log("\n🔍 Verifying contract on Etherscan...");
    try {
        await hre.run("verify:verify", {
            address: address,
            constructorArguments: [],
        });
        console.log("✅ Contract verified on Etherscan");
    } catch (error) {
        console.log("⚠️  Verification failed:", error.message);
        console.log("You can verify manually later with:");
        console.log(`npx hardhat verify --network sepolia ${address}`);
    }

    // Output deployment info
    console.log("\n📋 Deployment Summary:");
    console.log("========================");
    console.log("Contract Address:", address);
    console.log("Deployer:", deployer.address);
    console.log("Network: Sepolia Testnet");
    console.log("Block:", deployTx ? deployTx.blockNumber : "N/A");
    console.log("\n🎉 Deployment complete!");

    console.log("\n📝 Next Steps:");
    console.log("1. Update frontend config with new address:");
    console.log(`   export const PAYROLL_ADDRESS = '${address}' as const;`);
    console.log("\n2. Export ABI from:");
    console.log("   artifacts/contracts/EncryptedPayrollV2.sol/EncryptedPayrollV2.json");
    console.log("\n3. Test the contract:");
    console.log("   - Create a stream");
    console.log("   - Check getStreamCount()");
    console.log("   - Verify events on Etherscan");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
