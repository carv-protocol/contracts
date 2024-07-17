const {
    Keypair,
    PublicKey,
    Transaction,
    sendAndConfirmTransaction,
} = require('@solana/web3.js');

const {
    AuthorityType,
    TOKEN_PROGRAM_ID,
    createSetAuthorityInstruction,
} = require('@solana/spl-token');

const {OftTools ,OftProgram, OFT_SEED} = require('@layerzerolabs/lz-solana-sdk-v2');
const {MainNetConn, SecretKey, TokenPubKey} = require('./common')

async function main() {
    let account = Keypair.fromSecretKey(SecretKey);
    console.log(`🔑Owner public key is: ${account.publicKey.toBase58()}`,);

    const [oftConfig] = PublicKey.findProgramAddressSync(
        [Buffer.from(OFT_SEED), TokenPubKey.toBuffer()],
        OftProgram.OFT_DEFAULT_PROGRAM_ID,
    );
    console.log(`🔑oftConfig public key is: ${oftConfig.toBase58()}`,);

    // Create a new transaction to transfer your SPL Tokens Mint Authority
    // and Initialize the OFT config
    let transaction = new Transaction().add(
        createSetAuthorityInstruction(
            TokenPubKey,
            account.publicKey,
            AuthorityType.MintTokens,
            oftConfig,
            [],
            TOKEN_PROGRAM_ID,
        ),

        await OftTools.createInitNativeOftIx(
            account.publicKey,
            account.publicKey,
            TokenPubKey,
            account.publicKey,
            6,
            TOKEN_PROGRAM_ID,
            OftProgram.OFT_DEFAULT_PROGRAM_ID,
        ),
    );

    let sig = await sendAndConfirmTransaction(MainNetConn, transaction, [account]);
    console.log(`✅ OFT Initialization Complete! View the transaction here: ${sig}`);
}

main().then(r => {})