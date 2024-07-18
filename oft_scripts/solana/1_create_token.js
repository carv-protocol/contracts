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

const { createCreateMetadataAccountV3Instruction, PROGRAM_ID } = require('@metaplex-foundation/mpl-token-metadata');

const {TestNetConn, SecretKey} = require('./common')

async function main() {
    let account = Keypair.fromSecretKey(SecretKey);
    console.log(`🔑Owner public key is: ${account.publicKey.toBase58()}`,);

    const mintKp = Keypair.generate();
    console.log(`🔑Token public key is: ${mintKp.publicKey.toBase58()}`,);

    const OFT_DECIMALS = 6;

    const minimumBalanceForMint = await TestNetConn.getMinimumBalanceForRentExemption(getMintLen([]));
    let createTokenTransaction = new Transaction().add(
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
    let sig = await sendAndConfirmTransaction(TestNetConn, createTokenTransaction, [account, mintKp]);
    console.log("create token account & initialize mint OK: ", sig)

    let createMetadataTransaction = new Transaction().add(
        createCreateMetadataAccountV3Instruction(
            {
              metadata: PublicKey.findProgramAddressSync(
                [
                  Buffer.from("metadata"),
                  PROGRAM_ID.toBuffer(),
                  mintKp.publicKey.toBuffer(),
                ],
                PROGRAM_ID,
              )[0],
              mint: mintKp.publicKey,
              mintAuthority: account.publicKey,
              payer: account.publicKey,
              updateAuthority: account.publicKey,
            },
            {
                createMetadataAccountArgsV3: {
                data: {
                  name: 'CARV',
                  symbol: 'CARV',
                  uri: 'https://raw.githubusercontent.com/carv-protocol/carv-contracts-alphanet/main/oft_scripts/solana/metadata/metadata.json',
                  creators: null,
                  sellerFeeBasisPoints: 0,
                  uses: null,
                  collection: null,
                },
                isMutable: false,
                collectionDetails: null,
            },
        },
        )
    );
    const signature = await sendAndConfirmTransaction(TestNetConn, createMetadataTransaction, [account]);
    console.log(`✅ Create metadata Complete! View the transaction here: ${signature}`);
}

main().then(r => {})