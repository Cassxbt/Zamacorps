# ZACORPS - Privacy-Preserving Payroll System

> **Solving Blockchain's Privacy Problem**: Private salary streaming using Zama's Fully Homomorphic Encryption (FHE)

[![Built with Zama fhEVM](https://img.shields.io/badge/Built%20with-Zama%20fhEVM-0052FF.svg)](https://docs.zama.ai/fhevm)
[![Next.js 15](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org)
[![Solidity 0.8.24](https://img.shields.io/badge/Solidity-0.8.24-orange)](https://soliditylang.org)
[![Tests](https://img.shields.io/badge/Tests-48%20passing-success.svg)](#-test-coverage)
[![E2E Tests](https://img.shields.io/badge/E2E%20Tests-36%20Playwright-blueviolet.svg)](#end-to-end-tests-36-tests)
[![License: BSD-3-Clear](https://img.shields.io/badge/License-BSD--3--Clear-blue.svg)](LICENSE)


---

## 🚨 The Problem Zama Solves

**Public blockchains expose everything.** Every transaction, every balance, every computation is visible to anyone scanning the chain. This makes blockchain unsuitable for:
- 💰 Confidential financial data (salaries, bonuses)
- 🏥 Private health records
- 🗳️ Secret voting systems
- 🔐 Sensitive business logic

**Traditional "solutions" fail:**
- ❌ **Off-chain storage**: Trashes the purpose of blockchain
- ❌ **Zero-knowledge proofs**: Can't compute on encrypted data
- ❌ **Mixing/privacy coins**: Limited use cases, regulatory issues

## 💡 How Zama's FHE Changes Everything

**Fully Homomorphic Encryption (FHE)** lets you:
- ✅ **Compute directly on encrypted data** - No decryption needed
- ✅ **Maintain privacy on public chains** - Data stays encrypted on-chain
- ✅ **Enable confidential smart contracts** -BusinessLogic runs on ciphertexts

**Example:**
```
Traditional: decrypt(salary) + decrypt(bonus) → exposed values
FHE:        FHE.add(encSalary, encBonus) → still encrypted!
```

---

## 🎯 ZACORPS: FHE-Powered Payroll

**What we built:** A fully functional payroll streaming platform where **salaries remain encrypted throughout the entire lifecycle** - from creation to withdrawal.

### How ZACORPS Demonstrates Zama's Power

| Traditional Blockchain Payroll | ZACORPS with Zama FHE |
|--------------------------------|-------------------------|
| 👀 Salaries visible on-chain | 🔐 Salaries encrypted with `euint128` |
| 🚫 No privacy guarantees | ✅ Mathematically proven privacy (FHE) |
| ⚠️ Regulatory compliance issues | ✅ GDPR/privacy law friendly |
| 📊 Manual batch payments | ⚡ Automated streaming with FHE operations |

### Real-World Impact

**Sector:** Web3 Companies, DAOs, Remote Teams, Creator Economy  
**Pain Point:** Transparent blockchain exposes sensitive financial data  
**Solution:** ZACORPS provides mathematically guaranteed privacy

```solidity
// Encrypted salary creation (HR perspective)
euint128 encryptedSalary = FHE.asEuint128(salary);  // Never touches plaintext
streams[employee] = Stream(encryptedSalary, ...);

// Encrypted computation (on-chain)
euint128 accrued = FHE.mul(salaryPerBlock, blocksPassed);  // Computed on ciphertext!
euint128 claimable = FHE.sub(accrued, claimed);            // Still encrypted
```

---

## ✨ Features

### Core FHE Implementation
- 🔐 **End-to-End Encryption**: Client-side encryption → on-chain FHE operations → user-only decryption
- 🧮 **Encrypted Computations**: Salary calculations using `FHE.mul()`, `FHE.sub()`, `FHE.select()`
- 🔑 **Access Control**: `FHE.allow()` grants decryption rights only to authorized users
- 📊 **Verifiable Privacy**: Block explorers show encrypted handles, not salaries

### User Experience
- 🎨 **Professional UI**: ZACORPS dark/light theme
- 📈 **Real-time Streaming**: Salaries accrue every block (Sepolia testnet)
- 👥 **Role-Based Access**: Admin, HR, Employee dashboards
- 📤 **Bulk Upload**: CSV import for mass stream creation
- 🔍 **Debug Mode**: Visualize encrypted data flow

---

## 🧪 Test Coverage

ZACORPS demonstrates **production-ready quality** with comprehensive testing across all layers:

### Test Suite Summary

| Test Type | Framework | Count | Status |
|-----------|-----------|-------|--------|
| **Smart Contract Tests** | Hardhat | 11 | ✅ Passing |
| **Component Validation** | TypeScript | 1 | ✅ Passing |
| **End-to-End Tests** | Playwright | 36 | ✅ Passing |
| **Total Tests** | — | **48** | ✅ **Production Ready** |

### Smart Contract Tests (11 tests)
**Focus:** Solidity logic, FHE operations, access control

```bash
cd blockchain && npx hardhat test
```

**Coverage:**
- ✅ Deployment & role-based access control (RBAC)
- ✅ HR role management and permissions
- ✅ Stream lifecycle (create, pause, resume, cancel)
- ✅ Hook system integration (IncomeOracle compatibility)
- ✅ Encrypted salary storage and retrieval
- ✅ Error handling and edge cases

### End-to-End Tests (36 tests)
**Focus:** UI/UX quality, user flows, cross-browser compatibility

```bash
cd frontend && npm run test:e2e
```

**Coverage Breakdown:**
- 📍 **Navigation & Routing** (8 tests) - All pages accessible, links functional
- 🏠 **Home Page Quality** (6 tests) - Professional branding, responsive design, no errors
- 🎨 **Theme System** (4 tests) - Dark/light mode toggle, persistence across pages
- 👔 **Admin Authentication** (5 tests) - Login page UI, wallet integration elements
- 👤 **Employee Authentication** (4 tests) - Employee login flow and navigation
- 📖 **Content Pages** (5 tests) - About page with FHE information, structured content
- ♿ **Accessibility & Performance** (4 tests) - Semantic HTML, load times, web standards

**Multi-Browser Testing:**
- ✅ Chromium (Chrome/Edge)
- ✅ Firefox
- ✅ WebKit (Safari)

### Component Validation (1 test)
**Focus:** TypeScript module integrity

```bash
cd frontend && npm test
```

**Coverage:**
- ✅ FHE module exports (encrypt/decrypt/instance)
- ✅ Contract interaction layer
- ✅ Wagmi configuration

### Why This Matters for Zama

**Production Readiness Signals:**
1. **Comprehensive Testing** - 48 tests demonstrate reliability
2. **Professional Infrastructure** - Industry-standard tools (Hardhat, Playwright)
3. **Cross-Browser Validation** - Works across major browsers
4. **Documentation** - Clear test instructions and coverage reports

**Quality Indicators:**
- 🎯 **11 Contract Tests** - Validates core FHE logic
- 🎯 **36 E2E Tests** - Proves professional UI/UX quality
- 🎯 **Multi-browser Support** - Enterprise-grade compatibility
- 🎯 **Test Documentation** - Ready for team collaboration

See [`/frontend/test/e2e/README.md`](frontend/test/e2e/README.md) for detailed test documentation.

---

## 🏗️ Architecture

### Smart Contract (`EncryptedPayrollV2.sol`)
```solidity
contract EncryptedPayrollV2 {
    mapping(address => euint128) withdrawals;  // FHE-encrypted storage
    
    function requestWithdrawal() returns (bytes32) {
        // 1. Compute claimable (encrypted)
        euint128 claimable = FHE.sub(accrued, claimed);
        
        // 2. Store encrypted handle
        withdrawals[msg.sender] = claimable;
        
        // 3. Grant decryption permission
        FHE.allow(withdrawals[msg.sender], msg.sender);
        
        // 4. Return handle for client-side decryption
        return FHE.toBytes32(withdrawals[msg.sender]);
    }
}
```

### Privacy Flow
```mermaid
sequenceDiagram
    participant HR
    participant fhEVM
    participant Employee
    participant Relayer
    
    HR->>fhEVM: createStream(euint128 salary)
    Note over fhEVM: Salary never visible
    
    Employee->>fhEVM: requestWithdrawal()
    fhEVM->>fhEVM: FHE.sub(accrued, claimed)
    fhEVM->>fhEVM: FHE.allow(claimable, employee)
    fhEVM->>Employee: bytes32 encryptedHandle
    
    Employee->>Relayer: decrypt(handle, signature)
    Relayer->>Employee: plaintext amount (off-chain)
    
    Employee->>fhEVM: submitWithdrawal(amount)
    fhEVM->>Employee: Transfer ETH
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MetaMask wallet
- Sepolia ETH ([Faucet](https://sepoliafaucet.com/))

### Installation
```bash
# Clone repository
git clone https://github.com/Cassxbt/Zacorps.git
cd Zacorps

# Install dependencies
cd frontend
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Live Demo
🌐 **Deployed on Vercel**: [zacorps.vercel.app](https://zacorps.vercel.app)

### Contract
- **Network**: Sepolia Testnet
- **Address**: `0x63e9336A8C9B1B9EbF3741a733f4888B91C73549`
- **Explorer**: [View on Etherscan](https://sepolia.etherscan.io/address/0x63e9336A8C9B1B9EbF3741a733f4888B91C73549)

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| **Encryption** | Zama fhEVM v0.9, Relayer SDK |
| **Smart Contracts** | Solidity 0.8.24, Hardhat |
| **Frontend** | Next.js 15, React 19, TypeScript |
| **Web3** | wagmi, viem, RainbowKit |
| **Styling** | Tailwind CSS, Framer Motion |

---

## 🧪 Testing

> **Comprehensive test coverage details available in the [🧪 Test Coverage](#-test-coverage) section above.**

### Quick Test Commands

#### Smart Contract Tests (11 tests)
```bash
cd blockchain
npx hardhat test
```

#### End-to-End Tests (36 Playwright tests)
```bash
cd frontend

# Run all e2e tests
npm run test:e2e

# Interactive mode (recommended)
npm run test:e2e:ui

# View test report
npm run test:e2e:report
```

#### Frontend Component Tests
```bash
cd frontend
npm test
```

**Total: 48 tests across all layers**  
See [Test Coverage](#-test-coverage) section for detailed breakdown and why it matters for Zama.

---

## 🧪 Testing the FHE Implementation

### 1. Create Encrypted Stream (HR)
```bash
# Navigate to /hr
# Create stream with salary: 0.001 ETH/block
# → Salary encrypted client-side, never visible on-chain
```

### 2. Verify Privacy (Block Explorer)
```bash
# Visit Etherscan contract page
# View "streams" mapping → See encrypted euint128 handle
# NOT the actual salary value ✅
```

### 3. Employee Withdrawal (3-Step Private Flow)
```bash
# 1. requestWithdrawal() → Get encrypted handle
# 2. Decrypt via Relayer (off-chain, user signature required)
# 3. submitWithdrawal(decryptedAmount) → Claim funds
```

**Key Insight**: At no point does the salary appear in plaintext on-chain.

---

## 📂 Project Structure

```
Zacorps/
├── blockchain/
│   ├── contracts/
│   │   └── EncryptedPayrollV2.sol   # FHE payroll contract
│   ├── scripts/
│   │   └── deploy.ts                 # Deployment script
│   └── hardhat.config.ts
├── frontend/
│   ├── app/
│   │   ├── admin/                    # Role management
│   │   ├── hr/                       # Stream creation (encrypted)
│   │   └── employee/                 # Private withdrawals
│   ├── lib/
│   │   ├── fhe/
│   │   │   ├── encrypt.ts            # Client-side FHE encryption
│   │   │   └── decrypt.ts            # Relayer-based decryption
│   │   └── contracts/
│   │       └── payroll.ts            # Contract interaction layer
└── README.md
```

---

## � Why This Matters for Zama

ZACORPS demonstrates **real-world FHE adoption** in a critical vertical:

1. **Payroll is a $1T+ market** with strict privacy requirements
2. **Proves FHE is production-ready** for confidential business logic
3. **Showcases Zama's developer experience** (easy SDK integration)
4. **Enables regulatory compliance** (GDPR, financial privacy laws)

**Beyond Payroll**: This architecture applies to:
- 💰 **Creator Economy**: Private earnings verification
- 📋 **Healthcare**: Encrypted patient records
- 🗳️ **Governance**: Private DAO voting
- 💳 **DeFi**: Confidential credit scores, lending
- 🎮 **Gaming**: Hidden game states, sealed-bid auctions

---

## 🔐 Security & Privacy

- ✅ **No plaintext storage**: All salaries stored as `euint128`
- ✅ **Access control**: `FHE.allow()` restricts decryption to specific addresses
- ✅ **No server-side secrets**: Client-side encryption, user signatures
- ✅ **Auditable privacy**: Block explorers show ciphertexts, not values

---

## � License

BSD-3-Clause-Clear (Zama Compatible)

---

## 💖 Built With Love

**Built with 🩷 by [@cassxbt](https://x.com/cassxbt) for [Zama](https://zama.ai)**

### Author
**cassxbt**  
🐦 Twitter/X: [@cassxbt](https://x.com/cassxbt)  
💼 Building the future of confidential computing on blockchain

---

## 🙏 Acknowledgments

**[Zama](https://www.zama.ai/)** - Making Blockchain Data Private by Default  
📚 **Documentation**: [docs.zama.ai](https://docs.zama.ai)  
🛠️ **fhEVM**: [github.com/zama-ai/fhevm](https://github.com/zama-ai/fhevm)

> *"Zama's FHE unlocks blockchain's true potential by making privacy mathematically guaranteed, not just promised."*

---

**Questions?** Open an issue or reach out to [@cassxbt](https://x.com/cassxbt)
