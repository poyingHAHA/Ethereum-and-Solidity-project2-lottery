pragma solidity ^0.8.9;

contract Lottery{
    address public manager;
    address[] public players;

    constructor(){
        // this right here should ensure that whenever we create a contract, we get the sender's address assigned to it
        manager = msg.sender;
    }

    function enter() public payable { // when someone call this function they might send ether along
        // Require is used for validation. We can pass in some type of boolean expression to this require function.
        require(msg.value > .01 ether); // the unit of the value is wei
        players.push(msg.sender);
    }

    function random() private view returns (uint){
        // Difficulty will be a number that indicates how challenging it is going to be to seal or solve the current block.
        return uint(keccak256(abi.encode(block.difficulty, block.timestamp, players))); // this will take this hash that we generate right here and turn it into an unsigned integer,
    }

    function pickWinner() public  restricted{
        uint index = random() % players.length;
        // The transfer function will attempt to take some amount of money from the current contract and send it to this given address right here.
        // So this is going to take all of our money from the current contract, all the money that has been entered and then send it to this particular address 
        payable(players[index]).transfer(address(this).balance); // 0x23123......

        // reset our contract
        // This right here creates a brand new dynamic array of type address and we want it to have an initial size of zero.
        players = new address[](0);
    }

    function getPlayers() public view returns (address[] memory){
        return players;
    }

    modifier restricted(){
        require(msg.sender == manager); // only manager can call this function
        _;
    }
}