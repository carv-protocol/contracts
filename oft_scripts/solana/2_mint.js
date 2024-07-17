const {
    Keypair,
    Transaction,
    sendAndConfirmTransaction,
} = require('@solana/web3.js');

const {
    createMintToInstruction,
    getOrCreateAssociatedTokenAccount,
    TOKEN_PROGRAM_ID
} = require('@solana/spl-token');

const {
    SecretKey,
    MainNetConn,
    TokenPubKey
} = require("./common")

async function main() {
    let account = Keypair.fromSecretKey(SecretKey);
    console.log(`🔑Owner public key is: ${account.publicKey.toBase58()}`);

    let ataAccount = await getOrCreateAssociatedTokenAccount(
        MainNetConn,
        account,
        TokenPubKey,
        account.publicKey,
        false,
        'processed',
        {},
         TOKEN_PROGRAM_ID,
    )
    console.log(`🔑Owner ata key is: ${ataAccount.address.toBase58()}`);

    let transaction = new Transaction().add(
        createMintToInstruction(
            TokenPubKey,
            ataAccount.address,
            account.publicKey,
            10000_000_000n,
            [],
            TOKEN_PROGRAM_ID
        )
    );
    const signature = await sendAndConfirmTransaction(MainNetConn, transaction, [account]);
    console.log(`✅ Mint Complete! View the transaction here: ${signature}`);
}

main().then(r => {})