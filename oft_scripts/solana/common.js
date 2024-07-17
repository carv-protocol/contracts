require("dotenv/config")
const {Connection, clusterApiUrl, PublicKey} = require("@solana/web3.js");

exports.SecretKey = Uint8Array.from( []);

// devnet token contract
// exports.TokenPubKey = new PublicKey("D5V2mtWiujVkaMB3WjhBA6SAnfbZpKtfNoFXtBatDww4")

// testnet token contract
// exports.TokenPubKey = new PublicKey("8tjXfjTu6k5Gze8EczH4rXCnw1JiJfrjeVy8dhpUGpqd")

// mainnet token contract
exports.TokenPubKey = new PublicKey("FHPMjL3noqQ4PLfczqC7n1Vo62QGh7PGSyar9ETyTkbw")

exports.DevNetConn = new Connection(clusterApiUrl("devnet"), "confirmed");
exports.TestNetConn = new Connection(clusterApiUrl("testnet"), "confirmed");
exports.MainNetConn = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");