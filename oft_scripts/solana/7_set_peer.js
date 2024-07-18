const {
    Keypair,
    PublicKey,
    Transaction,
    sendAndConfirmTransaction,
} = require('@solana/web3.js');

const {OftTools, OFT_SEED, OftProgram} = require('@layerzerolabs/lz-solana-sdk-v2');
const {addressToBytes32, } = require('@layerzerolabs/lz-v2-utilities');

const {SecretKey, MainNetConn, TokenPubKey} = require("./common")

async function main() {
    let account = Keypair.fromSecretKey(SecretKey);
    console.log(`🔑Owner public key is: ${account.publicKey.toBase58()}`,);

    const peers = [
        {dstEid: 30101, peerAddress: addressToBytes32('0xd6B3e6A2DedC97dDE9F3Fc50141525a3B7672C47')},
        {dstEid: 30110, peerAddress: addressToBytes32('0xd6B3e6A2DedC97dDE9F3Fc50141525a3B7672C47')},
    ];

    const [oftConfig] = PublicKey.findProgramAddressSync(
        [Buffer.from(OFT_SEED), TokenPubKey.toBuffer()],
        OftProgram.OFT_DEFAULT_PROGRAM_ID,
    );

    for (const peer of peers) {
        const peerTransaction = new Transaction().add(
            await OftTools.createSetPeerIx(
                account.publicKey,
                oftConfig,
                peer.dstEid,
                peer.peerAddress,
            ),
        );

        const sig = await sendAndConfirmTransaction(MainNetConn, peerTransaction, [account]);
        console.log(
            `✅ You set ${await OftTools.getPeerAddress(MainNetConn, oftConfig, peer.dstEid)} for dstEid ${
                peer.dstEid
            }! View the transaction here: ${sig}`,
        );
    }
}

main().then(r => {})


