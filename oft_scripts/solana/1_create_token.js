const {
    Keypair,
    Transaction,
    sendAndConfirmTransaction,
    SystemProgram,
} = require('@solana/web3.js');

const {
    TOKEN_PROGRAM_ID,
    createInitializeMintInstruction,
    getMintLen,
} = require('@solana/spl-token');

const {TestNetConn, SecretKey} = require('./common')

async function main() {
    let account = Keypair.fromSecretKey(SecretKey);
    console.log(`🔑Owner public key is: ${account.publicKey.toBase58()}`,);

    const mintKp = Keypair.generate();
    console.log(`🔑Token public key is: ${mintKp.publicKey.toBase58()}`,);

    const OFT_DECIMALS = 6;

    const minimumBalanceForMint = await TestNetConn.getMinimumBalanceForRentExemption(getMintLen([]));
    let transaction = new Transaction().add(
        SystemProgram.createAccount({
            fromPubkey: account.publicKey,
            newAccountPubkey: mintKp.publicKey,
            space: getMintLen([]),
            lamports: minimumBalanceForMint,
            programId: TOKEN_PROGRAM_ID,
        }),
        await createInitializeMintInstruction(
            mintKp.publicKey,
            OFT_DECIMALS,
            account.publicKey,
            null,
            TOKEN_PROGRAM_ID,
        ),
    );
    let sig = await sendAndConfirmTransaction(TestNetConn, transaction, [account, mintKp]);
    console.log("create token account & initialize mint OK: ", sig)
}

main().then(r => {})