export default async function handler(req, res) {
  const walletAddress = "HEW8TmjdtJmAeMWZYG2pZd97FwZybtvJMkFjJmqMz64E";
  const tokenMint = "354jgbb56NmBnyd647sPmj8S1md9cBeiCPPhT6pQbonk";

  try {
    // 1. Wallet এর token balance fetch
    const tokenResponse = await fetch("https://api.mainnet-beta.solana.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getTokenAccountsByOwner",
        params: [
          walletAddress,
          { mint: tokenMint },
          { encoding: "jsonParsed" }
        ]
      })
    });

    const tokenData = await tokenResponse.json();
    let balance = 0;

    if(tokenData.result.value.length > 0) {
      balance = tokenData.result.value[0].account.data.parsed.info.tokenAmount.uiAmount;
    }

    // 2. USD Price fetch (Coingecko)
    const priceResponse = await fetch(`https://api.coingecko.com/api/v3/simple/token_price/solana?contract_addresses=${tokenMint}&vs_currencies=usd`);
    const priceData = await priceResponse.json();
    const usdPrice = priceData[tokenMint.toLowerCase()]?.usd || 0;

    res.status(200).json({
      balance,
      usdValue: (balance * usdPrice).toFixed(2)
    });

  } catch (err) {
    res.status(500).json({ error: "Failed to fetch balance", details: err.message });
  }
}
