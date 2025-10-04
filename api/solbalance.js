export default async function handler(req, res) {
  try {
    const SOMBRERO_MINT = "354jgbb56NmBnyd647sPmj8S1md9cBeiCPPhT6pQbonk";
    const DEFAULT_WALLET = "HEW8TmjdtJmAeMWZYG2pZd97FwZybtvJMkFjJmqMz64E";

    const wallet = (req.query.wallet || DEFAULT_WALLET).trim();
    const rpcUrl = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

    // Helper: JSON-RPC call
    async function rpc(method, params) {
      const r = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params })
      });
      const j = await r.json();
      if (j.error) throw new Error(j.error.message || "RPC error");
      return j.result;
    }

    // 1) টোকেন অ্যাকাউন্টগুলো আনা (mint filter + jsonParsed)
    const tokRes = await rpc("getTokenAccountsByOwner", [
      wallet,
      { mint: SOMBRERO_MINT },
      { encoding: "jsonParsed", commitment: "confirmed" }
    ]);

    let totalRaw = 0n;
    let decimals = 0;

    for (const it of tokRes.value || []) {
      const tokenAmount = it.account.data.parsed.info.tokenAmount;
      decimals = tokenAmount.decimals;
      totalRaw += BigInt(tokenAmount.amount);
    }

    // যদি ওয়ালেটে টোকেন না থাকে, তবুও decimals জানতে হবে
    if ((tokRes.value || []).length === 0) {
      const supply = await rpc("getTokenSupply", [SOMBRERO_MINT]);
      decimals = supply.value?.decimals ?? 0;
    }

    const divisor = 10 ** decimals;
    const balance = Number(totalRaw) / divisor; // Sombrero amount (UI units)

    // 2) USD price (Jupiter → fallback DexScreener)
    async function jupPrice(mint) {
      try {
        const r = await fetch(`https://price.jup.ag/v6/price?ids=${mint}`, { cache: "no-store" });
        const j = await r.json();
        return j?.data?.[mint]?.price ?? null;
      } catch { return null; }
    }
    async function dexPrice(mint) {
      try {
        const r = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mint}`, { cache: "no-store" });
        const j = await r.json();
        const p = j?.pairs?.[0]?.priceUsd;
        return p ? Number(p) : null;
      } catch { return null; }
    }

    let priceUSD = await jupPrice(SOMBRERO_MINT);
    let priceSource = "jupiter";
    if (!priceUSD) {
      priceUSD = await dexPrice(SOMBRERO_MINT);
      priceSource = priceUSD ? "dexscreener" : "unknown";
    }

    const usdValue = priceUSD ? balance * Number(priceUSD) : null;

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({
      ok: true,
      token: { mint: SOMBRERO_MINT, symbol: "SOMBRERO", decimals },
      wallet,
      balance,           // amount in token units
      priceUSD,          // price per token in USD
      usdValue,          // total USD value
      priceSource
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: e.message || "Server error" });
  }
}
