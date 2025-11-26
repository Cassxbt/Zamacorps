import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    const EncryptedPayroll = await ethers.getContractFactory("EncryptedPayroll");
    const payroll = await EncryptedPayroll.deploy();

    await payroll.waitForDeployment();

    console.log("EncryptedPayroll deployed to:", await payroll.getAddress());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
