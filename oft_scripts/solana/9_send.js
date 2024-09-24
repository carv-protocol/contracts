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

    const peer = {dstEid: 30110, peerAddress: addressToBytes32('0xc08Cd26474722cE93F4D0c34D16201461c10AA8C')};

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

    const receiver = addressToBytes32('0xB61D971Bc04Eff621eB4D69f8D2b9672FE644277');
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
        Options.newOptions().toBytes(), //.addExecutorLzReceiveOption(0, 0).toBytes(),
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
            Options.newOptions().toBytes(),//.addExecutorLzReceiveOption(0, 0).toBytes(),
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


