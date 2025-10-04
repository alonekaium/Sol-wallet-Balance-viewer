export default async function handler(req, res) {
      const wallet = "HEW8TmjdtJmAeMWZYG2pZd97FwZybtvJMkFjJmqMz64E"; // wallet address
      const response = await fetch(`https://api.mainnet-beta.solana.com`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getBalance",
          params: [wallet]
        })
      });
      const data = await response.json();
      const balance = data.result.value / 1000000000; // Convert lamports → SOL
    
      res.status(200).json({ balance });
    }