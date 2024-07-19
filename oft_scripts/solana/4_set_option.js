const {
    Keypair,
    PublicKey,
    Transaction,
    sendAndConfirmTransaction,
} = require('@solana/web3.js');

const {OftTools, OFT_SEED, OftProgram} = require('@layerzerolabs/lz-solana-sdk-v2');
const {addressToBytes32, Options } = require('@layerzerolabs/lz-v2-utilities');

const {SecretKey, MainNetConn, TokenPubKey} = require("./common")

async function main() {
    let account = Keypair.fromSecretKey(SecretKey);
    console.log(`🔑Owner public key is: ${account.publicKey.toBase58()}`);
    console.log(`🔑Token public key is: ${TokenPubKey.toBase58()}`);

    const peers = [
        {dstEid: 30101, peerAddress: addressToBytes32('0xc08Cd26474722cE93F4D0c34D16201461c10AA8C')},
        {dstEid: 30110, peerAddress: addressToBytes32('0xc08Cd26474722cE93F4D0c34D16201461c10AA8C')},
    ];

    const [oftConfig] = PublicKey.findProgramAddressSync(
        [Buffer.from(OFT_SEED), TokenPubKey.toBuffer()],
        OftProgram.OFT_DEFAULT_PROGRAM_ID,
    );

    for (const peer of peers) {
        const optionTransaction = new Transaction().add(
            await OftTools.createSetEnforcedOptionsIx(
                account.publicKey,
                oftConfig,
                peer.dstEid,
                Options.newOptions().addExecutorLzReceiveOption(500000, 0).toBytes(),
                Options.newOptions()
                    .addExecutorLzReceiveOption(500000, 0)
                    .addExecutorComposeOption(0, 500000, 0)
                    .toBytes(),
            ),
            await OftTools.createInitNonceIx(
                account.publicKey,
                peer.dstEid,
                oftConfig,
                peer.peerAddress
            ),
            await OftTools.createInitConfigIx(
                account.publicKey,
                oftConfig,
                peer.dstEid
            )
        );

        const sig = await sendAndConfirmTransaction(MainNetConn, optionTransaction, [account]);
        console.log(`✅ You set options for dstEid ${peer.dstEid}! View the transaction here: ${sig}`);
    }
}

main().then(r => {})


