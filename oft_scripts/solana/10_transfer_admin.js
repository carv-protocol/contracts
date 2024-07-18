const {
    Keypair,
    PublicKey,
    Transaction,
    sendAndConfirmTransaction,
} = require('@solana/web3.js');

const {OftTools, OFT_SEED, OftProgram} = require('@layerzerolabs/lz-solana-sdk-v2');
const {addressToBytes32, } = require('@layerzerolabs/lz-v2-utilities');

const {SecretKey, SecretKey2, MainNetConn, TokenPubKey} = require("./common")

async function main() {
    let account = Keypair.fromSecretKey(SecretKey2);
    console.log(`🔑Owner public key is: ${account.publicKey.toBase58()}`,);

    let newAdmin = new PublicKey("E6coiW3LSocttFiVsg4FWLaZxcNRPg7wSzLM7tjMHh32")
    console.log(`🔑New admin public key is: ${account.publicKey.toBase58()}`,);

    const [oftConfig] = PublicKey.findProgramAddressSync(
        [Buffer.from(OFT_SEED), TokenPubKey.toBuffer()],
        OftProgram.OFT_DEFAULT_PROGRAM_ID,
    );

    const peerTransaction = new Transaction().add(
        await OftTools.createTransferAdminIx(account.publicKey, oftConfig, newAdmin)
    );

    const sig = await sendAndConfirmTransaction(MainNetConn, peerTransaction, [account]);
    console.log(`✅`);
}

main().then(r => {})


