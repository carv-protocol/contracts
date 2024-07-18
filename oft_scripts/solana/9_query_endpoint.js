const {
    PublicKey,
} = require('@solana/web3.js');

const {OftTools ,OftProgram, OFT_SEED, DVN_CONFIG_SEED} = require('@layerzerolabs/lz-solana-sdk-v2');
const {TestNetConn, TokenPubKey} = require('./common')
const {addressToBytes32, } = require('@layerzerolabs/lz-v2-utilities');

async function main() {
    const [oftConfig] = PublicKey.findProgramAddressSync(
        [Buffer.from(OFT_SEED), TokenPubKey.toBuffer()],
        OftProgram.OFT_DEFAULT_PROGRAM_ID,
    );
    console.log(`🔑oftConfig public key is: ${oftConfig.toBase58()}`,);
    console.log(`default OFT program: ${OftProgram.OFT_DEFAULT_PROGRAM_ID}`)

    const lzDVNProgramId = new PublicKey('HtEYV4xB4wvsj5fgTkcfuChYpvGYzgzwvNhgDZQNh7wW');
    const lzDVNConfigAccount = PublicKey.findProgramAddressSync([Buffer.from(DVN_CONFIG_SEED, 'utf8')], lzDVNProgramId)[0];
    console.log(`LayerZero DVN config account is: ${lzDVNConfigAccount}`,);

    const peers = [
        {dstEid: 40231, peerAddress: addressToBytes32('0xEe124EFd323ec2e5148583b39a799ec7Cf6CD897')},
        // {dstEid: 40202, peerAddress: addressToBytes32('0x531DD61c620bD76aC6fA4f7217bc4654EdB3C353')},
    ];

    for (const peer of peers) {
        const log = await OftTools.getEndpointConfig(
            TestNetConn,
            oftConfig, // your OFT Config PDA
            peer.dstEid,
        );
        console.log(
            log.receiveLibraryConfig,
        );
        console.log(
            log.sendLibraryConfig.ulnSendConfig.executor,
            log.sendLibraryConfig.ulnSendConfig.uln,
            log.receiveLibraryConfig.ulnReceiveConfig.uln,
        );
    }
}

main().then(r => {})