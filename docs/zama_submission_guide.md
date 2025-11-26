# ZAMACORPS Testing Guide 🧪

This guide walks through the end-to-end testing of the ZAMACORPS Encrypted Payroll dApp, verifying all FHE privacy features.

## 1. Prerequisites

- **Network**: Sepolia Testnet
- **Wallet**: MetaMask (with Sepolia ETH)
- **Contract Address**: `0xA1B1EBDdc77af1Ec4f18982866332455E0423536`

## 2. Setup

1.  Clone the repo and install dependencies:
    ```bash
    cd frontend
    npm install
    ```
2.  Start the development server:
    ```bash
    npm run dev
    ```
3.  Open [http://localhost:3000](http://localhost:3000)

## 3. End-to-End Test Flow

### Step 1: HR - Create Stream 🆕
1.  Navigate to `/hr` (HR Dashboard).
2.  Connect wallet (must have `HR_ROLE` - the deployer has this).
3.  Fill in the "Create Stream" form:
    - **Employee Address**: Use a secondary wallet address.
    - **Salary**: e.g., 100.
    - **Start Block**: Current block + 1.
    - **Cliff Block**: Current block + 10 (for quick testing).
4.  Click **Create Stream**.
    - *Observation*: MetaMask prompts for signature (Encryption) and transaction.
    - *Verification*: Stream appears in the list with "Encrypted" salary.

### Step 2: Employee - Verify Privacy 🕵️‍♂️
1.  Switch MetaMask to the **Employee Address**.
2.  Navigate to `/employee` (Employee Dashboard).
3.  **Check 1**: Salary should be hidden (masked) by default.
4.  **Check 2**: Toggle "Debug Mode" (if available) to see the FHE handle.

### Step 3: Employee - Withdrawal 💸
1.  Wait for the Cliff Block to pass (approx 2-3 minutes).
2.  Click **Withdraw**.
3.  **The 3-Step FHE Flow**:
    - **1. Request**: Transaction to calculate claimable amount on-chain.
    - **2. Decrypt**: Signature request (EIP-712) to decrypt the amount via Relayer.
    - **3. Submit**: Transaction to transfer the decrypted ETH amount to your wallet.
4.  *Verification*:
    - Toast notifications confirm each step.
    - ETH balance increases.
    - "Claimed" amount in dashboard updates.

## 4. Troubleshooting

- **"Not Authorized" Error**: Ensure you are connected with the correct Employee wallet.
- **"Stream not found"**: Ensure you created the stream for the exact address you are using.
- **Decryption Failed**: Check console logs. Ensure the contract is funded with ETH.

## 5. Architecture Verification

- **Privacy**: Salary is stored as `euint128`.
- **Access Control**: Only the employee can decrypt their salary (`FHE.allow`).
- **Transparency**: Start/Cliff blocks are plaintext `uint64` for UI visibility.
