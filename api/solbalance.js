export default async function handler(req, res) {
  const walletAddress = "HEW8TmjdtJmAeMWZYG2pZd97FwZybtvJMkFjJmqMz64E";

  try {
    const response = await fetch("https://api.mainnet-beta.solana.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getTokenAccountsByOwner",
        params: [
          walletAddress,
          { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
          { encoding: "jsonParsed" }
        ]
      })
    });

    const data = await response.json();

    const tokens = data.result.value.map((t) => {
      const info = t.account.data.parsed.info;
      return {
        mint: info.mint,
        amount: info.tokenAmount.uiAmount
      };
    });

    res.status(200).json({ tokens });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tokens", details: err.message });
  }
}
