// pages/api/sombrero.js

export default async function handler(req, res) {
  const wallet = "HEW8TmjdtJmAeMWZYG2pZd97FwZybtvJMkFjJmqMz64E";
  const sombreroMint = "354jgbb56NmBnyd647sPmj8S1md9cBeiCPPhT6pQbonk";

  // ১. ওয়ালেটের টোকেন ব্যালান্স বের করা (Solscan public API)
  const tokenRes = await fetch(`https://public-api.solscan.io/account/tokens?account=${wallet}`);
  const tokens = await tokenRes.json();

  // ২. SOMBRERO টোকেন খুঁজে বের করা
  const sombrero = tokens.find(
    (t) => t.tokenAddress === sombreroMint
  );

  // ৩. SOMBRERO টোকেনের মার্কেট প্রাইস (Birdeye API)
  // (Birdeye public API, rate limit কম, চাইলে Coingecko বা অন্যটা ব্যবহার করতে পারেন)
  const priceRes = await fetch(`https://public-api.birdeye.so/public/price?address=${sombreroMint}`);
  const priceData = await priceRes.json();
  const price = priceData.data?.value || 0;

  // ৪. ব্যালান্স ও ডলার ভ্যালু
  const amount = sombrero ? Number(sombrero.tokenAmount.uiAmountString) : 0;
  const usdValue = amount * price;

  res.status(200).json({
    amount,
    usdValue,
    price,
  });
}
