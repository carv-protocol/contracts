const {
    Keypair,
    Transaction,
    ComputeBudgetProgram,
    sendAndConfirmTransaction
} = require('@solana/web3.js');

const {getOrCreateAssociatedTokenAccount, TOKEN_PROGRAM_ID} = require("@solana/spl-token");
const {OftTools} = require('@layerzerolabs/lz-solana-sdk-v2');
const {addressToBytes32, Options } = require('@layerzerolabs/lz-v2-utilities');

const {SecretKey, MainNetConn, TokenPubKey} = require("./common.js")

async function main() {
    let account = Keypair.fromSecretKey(SecretKey);
    console.log(`🔑Owner public key is: ${account.publicKey.toBase58()}`,);
    console.log(`🔑Token public key is: ${TokenPubKey.toBase58()}`,);

    const peer = {dstEid: 30101, peerAddress: addressToBytes32('0xd6B3e6A2DedC97dDE9F3Fc50141525a3B7672C47')};

    let ataAccount = await getOrCreateAssociatedTokenAccount(
        MainNetConn,
        account,
        TokenPubKey,
        account.publicKey,
        false,
        'confirmed',
        {},
        TOKEN_PROGRAM_ID,
    )

    const receiver = addressToBytes32('0xCfce99eE8630fe51974c9a94f1d9153e9F656E81');
    // 10 CARV
    const amountToSend = 10_000_000n;

    const fee = await OftTools.quoteWithUln(
        MainNetConn,
        account.publicKey,
        TokenPubKey,
        peer.dstEid,
        amountToSend,
        amountToSend,
        // Set to zero cuz it will be added to the previous createSetEnforcedOptionsIx value
        Options.newOptions().addExecutorLzReceiveOption(0, 0).toBytes(),
        Array.from(receiver),
    );

    const sendTransaction = new Transaction().add(
        await OftTools.sendWithUln(
            MainNetConn,
            account.publicKey,
            TokenPubKey,
            ataAccount.address,
            peer.dstEid,
            amountToSend,
            amountToSend,
            // ditto
            Options.newOptions().addExecutorLzReceiveOption(0, 0).toBytes(),
            Array.from(receiver),
            fee.nativeFee
        ),
    ).add(ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }));

    const sig = await sendAndConfirmTransaction(MainNetConn, sendTransaction, [account]);
    console.log(
        `✅ You sent ${amountToSend} to dstEid ${peer.dstEid}! View the transaction here: ${sig}`,
    );
}

main().then(r => {})


