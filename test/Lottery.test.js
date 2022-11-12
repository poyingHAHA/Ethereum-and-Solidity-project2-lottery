const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());

const {abi, evm} = require("../compile");
let lottery;
let accounts;

beforeEach(async () => {
    accounts = await web3.eth.getAccounts();
    lottery = await new web3.eth.Contract(abi)
        .deploy({data: evm.bytecode.object})
        .send({from: accounts[0], gas: '1000000' })
});

describe('Lottery Contract', () => {
    it('deploys a contract', () => {
        assert.ok(lottery.options.address);
    });

    it('allows one account to enter', async () => {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('0.02', 'ether') // we have coded that we need to send along at least 0.01Ether
        })

        const players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        });

        assert.equal(accounts[0], players[0]);
        assert.equal(1, players.length);
    });

    it('allows multiple accounts to enter', async () => {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('0.02', 'ether') // we have coded that we need to send along at least 0.01Ether
        })

        await lottery.methods.enter().send({
            from: accounts[1],
            value: web3.utils.toWei('0.02', 'ether')
        })

        await lottery.methods.enter().send({
            from: accounts[2],
            value: web3.utils.toWei('0.02', 'ether')
        })

        const players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        });

        assert.equal(accounts[0], players[0]);
        assert.equal(accounts[1], players[1]);
        assert.equal(accounts[2], players[2]);
        assert.equal(3, players.length);
    });

    it('requires a minimun amount of ether to enter', async() => {
        try{
            await lottery.methods.enter().send({
                from: accounts[0],
                value: 0
            });
            assert(false); // this is always going to fail our test
        }catch(err){
            // When we use assert, we're going to check for truthiness, unlike ok which checks for existence.
            assert(err); // Because the value is too less, it's going to throw error
        }
    });

    it('only manager can call pickWinner', async() => {
        try{
            await lottery.methods.pickWinner().send({
               from: accounts[1] 
            });
            assert(false);
        }catch(err){
            assert(err);
        }
    });

    it('sends money to the winner and resets the players array', async() => {
        await lottery.methods.enter().send({
            from: accounts[0], 
            value: web3.utils.toWei('2', 'ether')
        });

        // essentially you throw any address you want into this function and it will return the amount of ether that is assigned to that address.
        // In this case, we want to get the amount of ether that is controlled by accounts at zero.
        const initialBalance = await web3.eth.getBalance(accounts[0]);
        await lottery.methods.pickWinner().send({ from: accounts[0] })
        const finalBalance = await web3.eth.getBalance(accounts[0]);
        // you might be thinking that the difference between these two balances right here is going to be exactly two ether.
        // recall that any time we send a transaction into the network, we have to pay some amount of money in gas to get that transaction to be processed by the network.
        // so in reality it's going to be slightly less than two ether. 
        // Now it's going to be really challenging for us to compute the amount of ether that we just spent on gas.
        const difference = finalBalance - initialBalance;
        // Well, basically, the 1.8 is just allowing for some amount of gas cost.
        // It's saying we acknowledge that the difference between these two things will be around two ether, but
        // it'll be slightly less because we just spent some amount of money on gas.
        assert(difference > web3.utils.toWei('1.8', 'ether'));
    });
});