// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract HeroContract is IERC721 {
    //HeroData to be registered from each token
    struct Hero {
        uint128 dna;
        uint16 rarityScore;
        uint64 createdTime;
    }

    // Heros Array
    Hero[] internal heros;

    // Hero NFT token data
    string constant _tokenName = "Hero NFT Token";
    string constant _tokenSymbol = "SNT";

    //Interface setup
    bytes4 internal constant MAGIC_ERC721_RECEIVED =
        bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"));

    // Structural Mappings
    mapping(uint256 => address) internal heroToOwner;
    mapping(address => uint256) internal ownerHeroCount;
    mapping(uint256 => address) public heroToApproved;
    mapping(bytes4 => bool) private _supportedInterfaces;
    mapping(address => mapping(address => bool)) private _operatorApprovals;
    mapping(uint256 => string) private _tokenURIs;

    string baseURI = "";

    constructor() {
        heros.push(
            Hero({
                createdTime: 0,
                rarityScore: 0,
                dna: 0
            })
        );
    }

    modifier notZeroAddress(address _address) {
        require(_address != address(0), "zero address");
        _;
    }

    modifier validHeroId(uint256 _heroId) {
        require(_heroId < heros.length, "invalid heroId");
        _;
    }

    modifier onlyHeroOwner(uint256 _heroId) {
        require(isHeroOwner(_heroId), "sender not hero owner");
        _;
    }

    modifier onlyApproved(uint256 _heroId) {
        require(
            isHeroOwner(_heroId) ||
                isApproved(_heroId) ||
                isApprovedOperatorOf(_heroId),
            "sender not hero owner OR approved"
        );
        _;
    }


    function inc(uint8 x) private pure returns (uint8) {
        unchecked {
            return x + 1;
        }
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override
        returns (bool)
    {
        return
            interfaceId == type(IERC165).interfaceId ||
            interfaceId == type(IERC721).interfaceId ||
            interfaceId == 0x5b5e139f;
    }

    function dnaToArray(uint128 _dna) internal pure returns (uint8[15] memory) {
        uint8[15] memory Genes = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        uint128[15] memory counter;
        uint128 numb = 1;
        string memory _dnaString = Strings.toString(uint256(_dna));
        require(bytes(_dnaString).length >= 31, "This dna is invalid");
        for (uint8 i = 0; i < counter.length; i++) {
            counter[i] = numb;
            numb = numb * 100;
        }
        for (uint8 i = 0; i < counter.length; i++) {
            uint8 gen = uint8((_dna / counter[i]) % 100);
            Genes[i] = gen;
        }
        return Genes;
    }

    function getHero(uint256 _heroId)
        public
        view
        returns (
            uint256 heroId,
            uint16 rarityScore,
            uint128 dna,
            uint8[15] memory Genes,
            uint64 createdTime,
            address owner
        )
    {
        require(_heroId < heros.length, "Invalid HeroId");
        uint8[15] memory filteredData;
        Hero storage hero = heros[_heroId];
        uint8[15] memory data = dnaToArray(hero.dna);
        uint i = 0;
        for (i;i<=14;i++) {
        filteredData[i] = data[i];
        }
        Genes = filteredData;
        dna = hero.dna;
        heroId = _heroId;
        createdTime = hero.createdTime;
        rarityScore = hero.rarityScore;
        owner = heroToOwner[_heroId];
    }

    function balanceOf(address owner)
        external
        view
        override
        returns (uint256 balance)
    {
        require(owner != address(0), "Invalid Address");
        return ownerHeroCount[owner];
    }

    function totalSupply() external view returns (uint256 total) {
        // is the Unhero considered part of the supply?
        return heros.length - 1;
    }

    function name() external pure returns (string memory tokenName) {
        return _tokenName;
    }

    function symbol() external pure returns (string memory tokenSymbol) {
        return _tokenSymbol;
    }

    function ownerOf(uint256 _tokenId)
        external
        view
        override
        validHeroId(_tokenId)
        returns (address owner)
    {
        return _ownerOf(_tokenId);
    }

    function _ownerOf(uint256 _tokenId) internal view returns (address owner) {
        return heroToOwner[_tokenId];
    }

    function isHeroOwner(uint256 _heroId) internal view returns (bool) {
        return msg.sender == _ownerOf(_heroId);
    }

    function transfer(address _to, uint256 _tokenId)
        external
        onlyApproved(_tokenId)
        notZeroAddress(_to)
    {
        require(_to != address(this), "to contract address");
        _transfer(msg.sender, _to, _tokenId);
    }

    function _transfer(
        address _from,
        address _to,
        uint256 _tokenId
    ) internal {
        // assign new owner
        heroToOwner[_tokenId] = _to;

        //update token counts
        ownerHeroCount[_to] = ownerHeroCount[_to] + 1;

        if (_from != address(0)) {
            ownerHeroCount[_from] = ownerHeroCount[_from] - 1;
        }

        // emit Transfer event
        emit Transfer(_from, _to, _tokenId);
    }

    function approve(address _approved, uint256 _tokenId)
        external
        override
        onlyApproved(_tokenId)
    {
        require(_approved != address(0), "Invalid Address");
        heroToApproved[_tokenId] = _approved;
        emit Approval(msg.sender, _approved, _tokenId);
    }

    function isApproved(uint256 _heroId) public view returns (bool) {
        return msg.sender == heroToApproved[_heroId];
    }

    function setApprovalForAll(address _operator, bool _approved)
        external
        override
    {
        _operatorApprovals[msg.sender][_operator] = _approved;
        emit ApprovalForAll(msg.sender, _operator, _approved);
    }

    function getApproved(uint256 _tokenId)
        external
        view
        override
        validHeroId(_tokenId)
        returns (address)
    {
        return heroToApproved[_tokenId];
    }

    function isApprovedForAll(address _owner, address _operator)
        external
        view
        override
        returns (bool)
    {
        return _isApprovedForAll(_owner, _operator);
    }

    function _isApprovedForAll(address _owner, address _operator)
        internal
        view
        returns (bool)
    {
        return _operatorApprovals[_owner][_operator];
    }

    function isApprovedOperatorOf(uint256 _heroId)
        public
        view
        returns (bool)
    {
        return _isApprovedForAll(heroToOwner[_heroId], msg.sender);
    }

    function _safeTransfer(
        address _from,
        address _to,
        uint256 _tokenId,
        bytes memory _data
    ) internal {
        require(_to != address(0), "Invalid Address");
        require(_from != address(0), "Invalid Address");
        require(_checkERC721Support(_from, _to, _tokenId, _data));
        _transfer(_from, _to, _tokenId);
    }

    function _checkERC721Support(
        address _from,
        address _to,
        uint256 _tokenId,
        bytes memory _data
    ) internal returns (bool) {
        if (!_isContract(_to)) {
            return true;
        }

        //call onERC721Recieved in the _to contract
        bytes4 result = IERC721Receiver(_to).onERC721Received(
            msg.sender,
            _from,
            _tokenId,
            _data
        );

        //check return value
        return result == MAGIC_ERC721_RECEIVED;
    }

    function _isContract(address _to) internal view returns (bool) {
        require(_to != address(0), "Invalid Address");
        // wallets will not have any code but contract must have some code
        uint32 size;
        assembly {
            size := extcodesize(_to)
        }
        return size > 0;
    }

    function safeTransferFrom(
        address _from,
        address _to,
        uint256 _tokenId,
        bytes calldata _data
    ) external override onlyApproved(_tokenId) notZeroAddress(_to) {
        require(_from != address(0), "Invalid Address");
        require(_from == _ownerOf(_tokenId), "from address not hero owner");
        _safeTransfer(_from, _to, _tokenId, _data);
    }

    function safeTransferFrom(
        address _from,
        address _to,
        uint256 _tokenId
    ) external override onlyApproved(_tokenId) notZeroAddress(_to) {
        require(_from != address(0), "Invalid Address");
        require(_from == _ownerOf(_tokenId), "from address not hero owner");
        _safeTransfer(_from, _to, _tokenId, bytes(""));
    }

    function transferFrom(
        address _from,
        address _to,
        uint256 _tokenId
    ) external override onlyApproved(_tokenId) notZeroAddress(_to) {
        require(
            _from == heroToOwner[_tokenId],
            "from address not hero owner"
        );
        _transfer(_from, _to, _tokenId);
    }

    function _exists(uint256 tokenId) internal view returns (bool) {
        return heroToOwner[tokenId] != address(0);
    }

    function tokenURI(uint256 tokenId) public view returns (string memory) {
        require(
            _exists(tokenId),
            "ERC721Metadata: URI query for nonexistent token"
        );

        string memory _tokenURI = _tokenURIs[tokenId];
        string memory base = _baseURI();

        // If there is no base URI, return the token URI.
        if (bytes(base).length == 0) {
            return _tokenURI;
        }
        // If both are set, concatenate the baseURI and tokenURI (via abi.encodePacked).
        if (bytes(_tokenURI).length > 0) {
            return string(abi.encodePacked(base, _tokenURI));
        }

        return "";
    }

    function _baseURI() internal view returns (string memory) {
        return baseURI;
    }

    function setBaseURI(string memory _uri) internal {
        require(bytes(_uri).length > 0, "Invalid Input");
        baseURI = _uri;
    }

    function setTokenURI(uint256 tokenId, string memory _tokenURI) internal {
        require(_exists(tokenId), "URI set of nonexistent token");
        _tokenURIs[tokenId] = _tokenURI;
    }
}
