const {
    Keypair,
    Transaction,
    ComputeBudgetProgram,
    sendAndConfirmTransaction
} = require('@solana/web3.js');

const {getOrCreateAssociatedTokenAccount, TOKEN_PROGRAM_ID} = require("@solana/spl-token");
const {OftTools} = require('@layerzerolabs/lz-solana-sdk-v2');
const {addressToBytes32, Options } = require('@layerzerolabs/lz-v2-utilities');

const {SecretKey, TestNetConn, TokenPubKey} = require("./common.js")

async function main() {
    let account = Keypair.fromSecretKey(SecretKey);
    console.log(`🔑Owner public key is: ${account.publicKey.toBase58()}`,);
    console.log(`🔑Token public key is: ${TokenPubKey.toBase58()}`,);

    const peer = {
        dstEid: 40231,
        peerAddress: addressToBytes32('0xEe124EFd323ec2e5148583b39a799ec7Cf6CD897'),
    };

    let ataAccount = await getOrCreateAssociatedTokenAccount(
        TestNetConn,
        account,
        TokenPubKey,
        account.publicKey,
        false,
        'confirmed',
        {},
        TOKEN_PROGRAM_ID,
    )

    const receiver = addressToBytes32('0xAdB2b5B7bA93ABEE50cB4A7a063d826233137B65');
    // 10 CARV
    const amountToSend = 10_000_000n;

    const fee = await OftTools.quoteWithUln(
        TestNetConn,
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
            TestNetConn,
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

    const sig = await sendAndConfirmTransaction(TestNetConn, sendTransaction, [account]);
    console.log(
        `✅ You sent ${amountToSend} to dstEid ${peer.dstEid}! View the transaction here: ${sig}`,
    );
}

main().then(r => {})


