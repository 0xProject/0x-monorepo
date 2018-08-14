set -e

# Create log directory for Geth
mkdir -p /var/log

# Start Geth and direct output to stdout
/geth \
    --verbosity 5 \
    --datadir node0/ \
    --syncmode 'full' \
    --nat none \
    --nodiscover \
    --port 30310 \
    --txpool.journal '' \
    --rpc \
    --rpcaddr '0.0.0.0' \
    --rpcport 8501 \
    --rpcapi 'personal,db,eth,net,web3,txpool,miner,debug' \
    --networkid 50 \
    --gasprice '2000000000' \
    --targetgaslimit '0x4c4b400000' \
    --mine \
    --etherbase '0xe8816898d851d5b61b7f950627d04d794c07ca37' \
    --unlock '0xe8816898d851d5b61b7f950627d04d794c07ca37,0x5409ed021d9299bf6814279a6a1411a7e866a631,0x6ecbe1db9ef729cbe972c83fb886247691fb6beb,0xe36ea790bc9d7ab70c55260c66d52b1eca985f84,0xe834ec434daba538cd1b9fe1582052b880bd7e63,0x78dc5d2d739606d31509c31d654056a45185ecb6,0xa8dda8d7f5310e4a9e24f8eba77e091ac264f872,0x06cef8e666768cc40cc78cf93d9611019ddcb628,0x4404ac8bd8f9618d27ad2f1485aa1b2cfd82482d,0x7457d5e02197480db681d3fdf256c7aca21bdc12,0x91c987bf62d25945db517bdaa840a6c661374402' \
    --password=node0/password.txt
