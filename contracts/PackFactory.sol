// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "./HeroContract.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract HeroFactory is HeroContract, Ownable {
    //Interface usage

    // Randomness helper
    uint256 public randNonce = 1;

    /// @dev rarity score
    uint256[4] public rarityScores = [20, 30, 50];

    // Price un Fantom and rewardson STRN
    uint256 public price;
    uint256 public rewardPerNFT;
    uint256 public rewardPerStage;

    // Staking Contract and Treasury of this Factory
    address public stakingContractAddr;
    address public treasuryAddr;

    // Minting Limits (Global, Per Tx and Per Wallet)
    uint256 public mintLimit;
    uint256 constant MAX_NFT_MINT = 10;
    uint256 constant MAX_NFT_COUNT = 100;

    //Events Emited
    event StakingContract(address stakingContract);
    event NewLimit(uint256 newLimit);
    event HeroCreated(address owner, uint256 heroId, uint256 date);
    event HeroUpdated(address owner, uint256 heroId, uint256 date);

    constructor(
        address _treasuryAddr, // Funds will be transfered to
        uint256 _mintLimit // Maximum amount of NFTs to be minted
    ) HeroContract() {
        price = (0.01 * (10**18)); // Price of te NFT
        treasuryAddr = _treasuryAddr; // Set the treasury Address
        mintLimit = _mintLimit; // Set the minting limit
    }

    function incF(uint8 x) internal pure returns (uint8) {
        unchecked {
            return x + 1;
        }
    }

    function herosOf(address _ownerInput)
        public
        view
        returns (uint256[] memory)
    {
        require(_ownerInput != address(0), "Invalid Address");
        // get the number of heros owned by _ownerInput
        uint256 ownerCount = ownerHeroCount[_ownerInput];
        if (ownerCount == 0) {
            return new uint256[](0);
        }

        uint256[] memory ids = new uint256[](ownerCount);
        uint256 i = 1;
        uint256 count = 0;
        while (count < ownerCount || i < heros.length) {
            if (heroToOwner[i] == _ownerInput) {
                ids[count] = i;
                count += 1;
            }
            i += 1;
        }

        return ids;
    }

    function randMod(uint8 _time) internal view returns (uint8) {
        uint256 rand = uint256(
            keccak256(
                abi.encodePacked(
                    block.number,
                    block.difficulty,
                    msg.sender,
                    randNonce,
                    _time,
                    heros.length
                )
            )
        ) % 100;
        uint256 random = rand / 10;
        uint256 converted = (random == 0) ? 10 : random;
        return uint8(converted);
    }

    function createHeros(uint256 _times) public payable {
        require(heros.length + _times - 1 <= mintLimit, "No more seeds");
        require(_times <= MAX_NFT_MINT, "You can only mint 10 per transaction");
        require(msg.value == (price * _times), "Not the accurate value");
        require(
            ownerHeroCount[msg.sender] + _times <= MAX_NFT_COUNT,
            "Select less NFTs, You've reached your limit"
        );
        uint256 amount = msg.value;
        payable(treasuryAddr).transfer(amount);
        _createHero(_times);
    }

    function createHerosPack() public payable {
        uint _times = 5;
        require(heros.length + _times - 1 <= mintLimit, "No more seeds");
        require(_times <= MAX_NFT_MINT, "You can only mint 10 per transaction");
        require(msg.value == (price * _times), "Not the accurate value");
        require(
            ownerHeroCount[msg.sender] + _times <= MAX_NFT_COUNT,
            "Select less NFTs, You've reached your limit"
        );
        uint256 amount = msg.value;
        payable(treasuryAddr).transfer(amount);
        _createHero(_times);
    }

    function _createHero(uint256 _times) internal {
        uint64 newDate = uint64(block.timestamp);
        address newAddress = msg.sender;
        for (uint8 i = 0; i < _times; i = incF(i)) {
            uint256 _genes = 0;

            for (uint8 ii = 0; ii < 16; ii = incF(ii)) {
                randNonce++;
                _genes += randMod(ii) * 100**(ii);
            }

            uint128 rarityScore = calculateRarityScore(uint128(_genes));
            Hero memory hero = Hero({
                dna: uint128(_genes),
                createdTime: uint64(newDate),
                rarityScore: uint16(rarityScore)
            });

            heros.push(hero);
            uint256 newHeroId = heros.length - 1;
            emit HeroCreated(newAddress, newHeroId, newDate);
            _transfer(address(0), newAddress, newHeroId);
            randNonce++;
        }
    }

    function genesToNumber(uint128 _dna) internal pure returns (uint16) {
        uint16 result = 0;
        uint128 numb = 1;
        uint128[15] memory counter;
        for (uint8 ii = 0; ii < counter.length; ii = incF(ii)) {
            counter[ii] = numb;
            numb = numb * 100;
        }

        for (uint8 i = 0; i < counter.length; i = incF(i)) {
            uint256 gen = (_dna / counter[i]) % 100;
            require(gen != 0, "Gens incorrect");
            result += uint16(gen);
        }
        return result;
    }

    function getHeroCount(address _addr) public view returns (uint256 count) {
        require(_addr != address(0), "Invalid Address");
        count = ownerHeroCount[_addr];
    }

    function updateHeroLimit(uint256 _newLimit) public onlyOwner {
        mintLimit = _newLimit;
        emit NewLimit(_newLimit);
    }

    function calculateRarityScore(uint128 _dna) public pure returns (uint128) {
        uint128 number = genesToNumber(_dna);
        return number;
    }

    function getRarity(uint256 _heroId) public view returns (uint256) {
        Hero storage hero = heros[_heroId];
        return hero.rarityScore;
    }

    function setHeroBaseURI(string memory _tokenURI) public onlyOwner {
        setBaseURI(_tokenURI);
    }
}