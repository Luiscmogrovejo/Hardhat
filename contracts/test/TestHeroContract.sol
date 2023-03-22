// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;
import "../HeroContract.sol";

contract TestHeroContract is HeroContract {


    function setHeroToOwner(uint256 _heroId, address _address) public {
        heroToOwner[_heroId] = _address;
    }

    function setOwnerHeroCount(address _address, uint16 _count) public {
        ownerHeroCount[_address] = _count;
    }

    function testDnaToArray(uint128 _genes) public pure returns(uint8[15] memory){
        return dnaToArray(_genes);
    }

    function addHero(
        uint128 _genes
    ) public {
        Hero memory newHero = Hero({
            dna: _genes,
            createdTime: uint64(block.timestamp),
            rarityScore: 0
        });
        heros.push(newHero);
        uint256 id = heros.length - 1;
        heroToOwner[id] = msg.sender;
        ownerHeroCount[msg.sender] += 1;
    }
}
