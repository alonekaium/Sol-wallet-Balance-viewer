// pages/api/sombrero-balance.js (Next.js API route)
export default async function handler(req, res) {
  const wallet = "HEW8TmjdtJmAeMWZYG2pZd97FwZybtvJMkFjJmqMz64E";
  const mint = "354jgbb56NmBnyd647sPmj8S1md9cBeiCPPhT6pQbonk";

  // Solana mainnet endpoint
  const endpoint = "https://api.mainnet-beta.solana.com";

  // getTokenAccountsByOwner call
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getTokenAccountsByOwner",
      params: [
        wallet,
        { mint: mint },
        { encoding: "jsonParsed" }
      ]
    })
  });

  const data = await response.json();

  let amount = 0;
  if (
    data.result &&
    data.result.value &&
    data.result.value.length > 0
  ) {
    // SPL token amount is in string, may need to divide by decimals
    amount = data.result.value[0].account.data.parsed.info.tokenAmount.uiAmountString;
  }

  res.status(200).json({ balance: amount });
}
