const {
    Keypair,
    PublicKey,
    Transaction,
    sendAndConfirmTransaction,
} = require('@solana/web3.js');

const {OftTools ,OftProgram, OFT_SEED} = require('@layerzerolabs/lz-solana-sdk-v2');
const {TestNetConn, SecretKey, TokenPubKey} = require('./common')

async function main() {
    let account = Keypair.fromSecretKey(SecretKey);
    console.log(`🔑Owner public key is: ${account.publicKey.toBase58()}`,);

    const [oftConfig] = PublicKey.findProgramAddressSync(
        [Buffer.from(OFT_SEED), TokenPubKey.toBuffer()],
        OftProgram.OFT_DEFAULT_PROGRAM_ID,
    );

    let transaction = new Transaction().add(
        await OftTools.createSetMintAuthorityIx(
            account.publicKey,
            oftConfig,
            null,
        ),
    );

    let sig = await sendAndConfirmTransaction(TestNetConn, transaction, [account]);
    console.log(`✅ OFT set mint to null Complete! View the transaction here: ${sig}`);
}

main().then(r => {})