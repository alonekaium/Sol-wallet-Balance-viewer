// api/sombrero.js
export default async function handler(req, res) {
  try {
    const wallet = (req.query.wallet || "HEW8TmjdtJmAeMWZYG2pZd97FwZybtvJMkFjJmqMz64E").trim();
    const mint   = (req.query.mint   || "354jgbb56NmBnyd647sPmj8S1md9cBeiCPPhT6pQbonk").trim();
    const RPC = "https://api.mainnet-beta.solana.com";

    // দুটি টোকেন প্রোগ্রামই ট্রাই করি (SPL 2018 + Token-2022)
    const TOKEN_2018 = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
    const TOKEN_2022 = "TokenzQdBNb1Aej2QXkJZ6rsJk8q7fK6QpR5X6C8v8G" // NOTE: যদি ভুল হয়, আপনার নোড/ডক থেকে ঠিক আইডি বসান

    // একটি প্রোগ্রামে থেকে owner-এর সব টোকেন অ্যাকাউন্ট আনে (parsed)
    async function fetchByProgram(programId) {
      const r = await fetch(RPC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getParsedTokenAccountsByOwner",
          params: [
            wallet,
            { programId },
            { encoding: "jsonParsed" }
          ]
        })
      });
      const j = await r.json();
      return j?.result?.value || [];
    }

    // দুটি প্রোগ্রাম থেকেই ফেচ করে মার্জ করি
    const [v2018, v2022] = await Promise.all([
      fetchByProgram(TOKEN_2018).catch(() => []),
      fetchByProgram(TOKEN_2022).catch(() => [])
    ]);
    const all = [...v2018, ...v2022];

    // মিন্ট দিয়ে ফিল্টার + সব অ্যাকাউন্টের amount যোগ
    let totalRaw = 0n;
    let decimals = 0;
    for (const acc of all) {
      const info = acc?.account?.data?.parsed?.info;
      if (info?.mint === mint) {
        const ta = info.tokenAmount;
        totalRaw += BigInt(ta.amount);
        decimals = ta.decimals;
      }
    }

    // fallback: mint ফিল্টারসহ সরাসরি RPC (কিছু নোডে এটা যথেষ্ট)
    if (totalRaw === 0n) {
      const r = await fetch(RPC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getTokenAccountsByOwner",
          params: [wallet, { mint }, { encoding: "jsonParsed" }]
        })
      });
      const j = await r.json();
      const vals = j?.result?.value || [];
      for (const v of vals) {
        const ta = v.account.data.parsed.info.tokenAmount;
        totalRaw += BigInt(ta.amount);
        decimals = ta.decimals;
      }
    }

    const balance = formatUiAmount(totalRaw, decimals);

    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(200).json({
      wallet, mint,
      amount: totalRaw.toString(), // raw (integer)
      decimals,
      balance                         // human-readable
    });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Unexpected error" });
  }
}

function formatUiAmount(raw, decimals) {
  if (!decimals) return raw.toString();
  const s = raw.toString();
  if (s.length <= decimals) {
    const frac = s.padStart(decimals, "0").replace(/0+$/, "");
    return frac ? `0.${frac}` : "0";
  }
  const i = s.slice(0, s.length - decimals);
  const f = s.slice(s.length - decimals).replace(/0+$/, "");
  return f ? `${i}.${f}` : i;
}
