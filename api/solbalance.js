// api/sombrero.js (Vercel Serverless Function)
export default async function handler(req, res) {
try {
// Query param থাকলে সেখান থেকে নেবে, না হলে ডিফল্ট
const wallet = (req.query.wallet || "HEW8TmjdtJmAeMWZYG2pZd97FwZybtvJMkFjJmqMz64E").trim();
const mint = (req.query.mint || "354jgbb56NmBnyd647sPmj8S1md9cBeiCPPhT6pQbonk").trim();

const rpc = "https://api.mainnet-beta.solana.com";

const resp = await fetch(rpc, {
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

const data = await resp.json();

// ডিফল্ট ভ্যালু
let totalAmountRaw = 0n;
let decimals = 0;

if (data?.result?.value?.length) {
for (const acc of data.result.value) {
const ta = acc.account.data.parsed.info.tokenAmount;
// amount string → BigInt
totalAmountRaw += BigInt(ta.amount);
decimals = ta.decimals; // একই mint, তাই একই decimals
}
}

// BigInt → string uiAmountString (ডেসিমালে ফরম্যাট)
const uiAmountString = formatAmount(totalAmountRaw, decimals);

// CORS (প্রয়োজনে)
res.setHeader("Access-Control-Allow-Origin", "*");
res.status(200).json({
wallet,
mint,
amount: totalAmountRaw.toString(), // raw amount
decimals,
balance: uiAmountString // human-readable
});

} catch (e) {
res.status(500).json({ error: e?.message || "Something went wrong" });
}
}

// Helper: BigInt + decimals → string
function formatAmount(bigintAmount, decimals) {
const s = bigintAmount.toString();
if (decimals === 0) return s;

if (s.length <= decimals) {
const frac = s.padStart(decimals, "0").replace(/0+
/
,
"
"
)
;
r
e
t
u
r
n
f
r
a
c
?
‘
0.
/,"");returnfrac?‘0.{frac}: "0"; } const intPart = s.slice(0, s.length - decimals); const fracRaw = s.slice(s.length - decimals); const frac = fracRaw.replace(/0+$/, ""); return frac ?
i
n
t
P
a
r
t
.
intPart.{frac}` : intPart;
}
