// ===== Configuration =====
const DEFAULT_WALLET = "HEW8TmjdtJmAeMWZYG2pZd97FwZybtvJMkFjJmqMz64E"; // replace if you want a different default wallet
const SOMBRERO_MINT = "354jgbb56NmBnyd647sPmj8S1md9cBeiCPPhT6pQbonk";  // Sombrero Memes mint
const RPC = process.env.RPC_URL || "https://api.mainnet-beta.solana.com";

// ----- Helpers -----
async function getTokenBalance(wallet, mint) {
  const body = {
    jsonrpc: "2.0",
    id: 1,
    method: "getTokenAccountsByOwner",
    params: [wallet, { mint }, { encoding: "jsonParsed" }]
  };

  const r = await fetch(RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await r.json();

  let total = 0;
  let decimals = 0;

  const list = data?.result?.value || [];
  for (const item of list) {
    const info = item.account.data.parsed.info.tokenAmount;
    decimals = info.decimals;
    const uiAmount =
      typeof info.uiAmount === "number" && info.uiAmount !== null
        ? info.uiAmount
        : Number(info.amount) / 10 ** info.decimals;
    total += uiAmount;
  }

  return { amount: total, decimals };
}

async function getPriceUSDFromJupiter(mint) {
  try {
    const r = await fetch(`https://price.jup.ag/v6/price?ids=${mint}`);
    const j = await r.json();
    const p = j?.data?.[mint]?.price;
    return p ? Number(p) : null;
  } catch {
    return null;
  }
}

async function getPriceUSDFromDexScreener(mint) {
  try {
    const r = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mint}`);
    const j = await r.json();
    const p = j?.pairs?.[0]?.priceUsd;
    return p ? Number(p) : null;
  } catch {
    return null;
  }
}

async function getPriceUSD(mint) {
  const jup = await getPriceUSDFromJupiter(mint);
  if (jup) return jup;
  const dex = await getPriceUSDFromDexScreener(mint);
  return dex || 0;
}

// ----- API Handler -----
export default async function handler(req, res) {
  try {
    // CORS
    if (req.method === "OPTIONS") {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
      return res.status(200).end();
    }
    res.setHeader("Access-Control-Allow-Origin", "*");

    // Allow overriding wallet via query (optional)
    const wallet = (req.query.wallet || DEFAULT_WALLET).trim();
    const mint = SOMBRERO_MINT; // fixed to Sombrero Memes

    if (!wallet || !mint) {
      return res.status(400).json({ error: true, message: "Wallet or mint missing." });
    }

    const { amount, decimals } = await getTokenBalance(wallet, mint);
    const priceUsd = await getPriceUSD(mint);
    const valueUsd = amount * (priceUsd || 0);

    return res.status(200).json({
      wallet,
      mint,
      amount,      // total Sombrero amount
      decimals,    // token decimals (info)
      priceUsd,    // price per token in USD
      valueUsd,    // total USD value
      ts: Date.now()
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: true, message: err.message });
  }
}
