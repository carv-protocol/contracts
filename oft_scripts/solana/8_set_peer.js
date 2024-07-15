const {
    Keypair,
    PublicKey,
    Transaction,
    sendAndConfirmTransaction,
} = require('@solana/web3.js');

const {OftTools, OFT_SEED, OftProgram} = require('@layerzerolabs/lz-solana-sdk-v2');
const {addressToBytes32, } = require('@layerzerolabs/lz-v2-utilities');

const {SecretKey, TestNetConn, TokenPubKey} = require("./common")

async function main() {
    let account = Keypair.fromSecretKey(SecretKey);
    console.log(`🔑Owner public key is: ${account.publicKey.toBase58()}`,);

    const peers = [
        {dstEid: 40231, peerAddress: addressToBytes32('0xEe124EFd323ec2e5148583b39a799ec7Cf6CD897')},
        // {dstEid: 40202, peerAddress: addressToBytes32('0x531DD61c620bD76aC6fA4f7217bc4654EdB3C353')},
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

        const sig = await sendAndConfirmTransaction(TestNetConn, peerTransaction, [account]);
        console.log(
            `✅ You set ${await OftTools.getPeerAddress(TestNetConn, oftConfig, peer.dstEid)} for dstEid ${
                peer.dstEid
            }! View the transaction here: ${sig}`,
        );
    }
}

main().then(r => {})


