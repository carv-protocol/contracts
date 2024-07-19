require("dotenv/config")
const {Connection, clusterApiUrl, PublicKey} = require("@solana/web3.js");

exports.SecretKey = Uint8Array.from( []);

// mainnet token contract
exports.TokenPubKey = new PublicKey("AFJtnuqGMaj5jAo6Pwxo28r1f7XAXXTSA8q3rG3q8b4A")

exports.DevNetConn = new Connection(clusterApiUrl("devnet"), "confirmed");
exports.TestNetConn = new Connection(clusterApiUrl("testnet"), "confirmed");
exports.MainNetConn = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");