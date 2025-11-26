import { ethers } from "hardhat";

async function main() {
    const address = "0xA1B1EBDdc77af1Ec4f18982866332455E0423536";
    const balance = await ethers.provider.getBalance(address);
    console.log(`Balance of ${address}: ${ethers.formatEther(balance)} ETH`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
