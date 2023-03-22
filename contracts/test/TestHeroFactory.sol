// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;
import "../PackFactory.sol";

contract TestHeroFactory is HeroFactory {
    constructor(
        address _treasuryAddr,
        uint _mintLimit
    ) HeroFactory( _treasuryAddr, _mintLimit) {}

    function setHeroToOwner(uint256 _heroId, address _address) public {
        heroToOwner[_heroId] = _address;
    }

    function testGenesToNumber(uint128 _dna) public pure returns (uint16) {
        return genesToNumber(_dna);
    }

    function testRandomizer() public view returns (uint8) {
        return randMod(1);
    }

    function setOwnerHeroCount(address _address, uint256 _count) public {
        ownerHeroCount[_address] = _count;
    }

    function createHero2(uint256 _times) public payable {
        require(heros.length + _times - 1 <= mintLimit, "No more seeds");
        require(_times <= MAX_NFT_MINT, "You can only mint 10 per transaction");
        require(
            ownerHeroCount[msg.sender] + _times <= 100,
            "Select less NFTs, You've reached your limit"
        );
        return _createHero(_times);
    }

    function getNow() public view returns (uint256) {
        return block.timestamp;
    }

    function getBaseUri() public view returns (string memory) {
        return _baseURI();
    }
}
