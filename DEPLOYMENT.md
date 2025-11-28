# Deploy to Vercel

## Quick Start

1. **Visit** [vercel.com/new](https://vercel.com/new)
2. **Import** `Cassxbt/Zamacorps` repository
3. **Set Root Directory:** `frontend`
4. **Add Environment Variables:**
   ```
   NEXT_PUBLIC_PAYROLL_ADDRESS=0x63e9336A8C9B1B9EbF3741a733f4888B91C73549
   NEXT_PUBLIC_INCOME_ORACLE_ADDRESS=0x094F7C9c590E00165976a10E268CAa5ce7e66A07
   ```
5. **Deploy** 🚀

## Detailed Steps

### 1. Connect GitHub
- Sign in to Vercel with your GitHub account
- Grant access to `Cassxbt/Zamacorps`

### 2. Configure Project
- **Framework:** Next.js (auto-detected)
- **Root Directory:** `frontend` ⚠️ **IMPORTANT**
- **Build Command:** Auto (uses npm run build)
- **Output Directory:** Auto (.next)

### 3. Environment Variables
Add these in Vercel dashboard (all environments):

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_PAYROLL_ADDRESS` | `0x63e9336A8C9B1B9EbF3741a733f4888B91C73549` |
| `NEXT_PUBLIC_INCOME_ORACLE_ADDRESS` | `0x094F7C9c590E00165976a10E268CAa5ce7e66A07` |

### 4. Deploy
Click "Deploy" and wait ~2 minutes

---

## After Deployment

- **URL:** `https://zacorps.vercel.app`
- **Auto-deploys:** Every push to `main` triggers a new deployment
- **Update env vars:** Vercel Dashboard → Settings → Environment Variables

## Requirements for Users
- MetaMask browser extension
- Sepolia testnet selected
- Test ETH for transactions

---

Need help? Check the main README or open an issue.
