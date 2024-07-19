const {
    PublicKey,
} = require('@solana/web3.js');

const {OftTools ,OftProgram, OFT_SEED, DVN_CONFIG_SEED} = require('@layerzerolabs/lz-solana-sdk-v2');
const {MainNetConn, TokenPubKey} = require('./common')
const {addressToBytes32, } = require('@layerzerolabs/lz-v2-utilities');

async function main() {
    const [oftConfig] = PublicKey.findProgramAddressSync(
        [Buffer.from(OFT_SEED), TokenPubKey.toBuffer()],
        OftProgram.OFT_DEFAULT_PROGRAM_ID,
    );
    console.log(`🔑oftConfig public key is: ${oftConfig.toBase58()}`,);
    console.log(`🔑default OFT program: ${OftProgram.OFT_DEFAULT_PROGRAM_ID}`)

    const lzDVNProgramId = new PublicKey('HtEYV4xB4wvsj5fgTkcfuChYpvGYzgzwvNhgDZQNh7wW');
    const lzDVNConfigAccount = PublicKey.findProgramAddressSync([Buffer.from(DVN_CONFIG_SEED, 'utf8')], lzDVNProgramId)[0];
    console.log(`LayerZero DVN config account is: ${lzDVNConfigAccount}`);

    const peers = [
        {dstEid: 30101, peerAddress: addressToBytes32('0xc08Cd26474722cE93F4D0c34D16201461c10AA8C')},
        {dstEid: 30110, peerAddress: addressToBytes32('0xc08Cd26474722cE93F4D0c34D16201461c10AA8C')},
    ];

    for (const peer of peers) {
        const log = await OftTools.getEndpointConfig(
            MainNetConn,
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