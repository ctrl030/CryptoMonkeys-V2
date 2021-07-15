// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

// preparing for some functions to be restricted 
import "@openzeppelin/contracts/access/Ownable.sol";
// preparing safemath to rule out over- and underflow  
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
// importing ERC721 token standard interface
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
// importing openzeppelin script to guard against re-entrancy
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
// importing openzeppelin script to make contract pausable
import "@openzeppelin/contracts/security/Pausable.sol";

contract MonkeyContract is ERC721, Ownable, ReentrancyGuard, Pausable {

    // using safemath for all uint256 numbers, 
    // use uint256 and (.add) and (.sub)
    using SafeMath for uint256;

    // STATE VARIABLES
    // MonkeyContract address
    address _monkeyContractAddress;   
    // Only 12 monkeys can be created from scratch (generation 0)
    uint256 public GEN0_Limit = 12;
    uint256 public gen0amountTotal;
    // amount of NFTs total in existence - can be queried by showTotalSupply function    
    uint256 public totalSupply;
    
    // STRUCT
    // this struct is the blueprint for new NFTs, they will be created from it
    struct CryptoMonkey {        
        uint256 parent1Id;
        uint256 parent2Id;
        uint256 generation;
        uint256 genes;
        uint256 birthtime;
    }    

    // ARRAYS
    // This is an array that holds all CryptoMonkeys. 
    // Their position in that array IS their tokenId.
    // they never get deleted here, array only grows and keeps track of them all.
    CryptoMonkey[] public allMonkeysArray;

    // EVENTS

    // Creation event, emitted after successful NFT creation with these parameters
    event MonkeyCreated(
        address owner,
        uint256 tokenId,
        uint256 parent1Id,
        uint256 parent2Id,
        uint256 genes
    );

    event BreedingSuccessful (
        uint256 tokenId, 
        uint256 genes, 
        uint256 birthtime, 
        uint256 parent1Id, 
        uint256 parent2Id, 
        uint256 generation, 
        address owner
    );


    // Constructor function
    // is setting _name, and _symbol, as well as creating a placeholder NFT,
    // and for that setting _parent1Id, _parent2Id and _generation to 0, 
    // the _genes to the Over 9000 Monkey, and then it is being burnt/locked away  
    constructor() ERC721("Crypto Monkeys", "MONKEY") {
        _monkeyContractAddress = address(this);      
        
        // minting a placeholder Zero Monkey, that occupies the index 0 position
        //_createMonkey(0, 0, 0, 1214131177989271, _monkeyContractAddress);  
        //createGen0Monkey(1214131177989271);

        // burning Zero Monkey NFT, index 0 can now be treated as "none"      
        //burnNFT(0); 
    }

    // Functions 
    
    function getMonkeyContractAddress() public view returns (address) {  
        return _monkeyContractAddress;
    }    

    function breed(uint256 _parent1Id, uint256 _parent2Id) public whenNotPaused returns (uint256)  {

        // _msgSender() needs to be owner of both crypto monkeys
        require(ownerOf(_parent1Id) == _msgSender() && ownerOf(_parent2Id) == _msgSender(), "must be owner of both parent tokens");

        // first 8 digits in DNA will be selected by dividing, solidity will round down everything to full integers
        uint256 _parent1genes = allMonkeysArray[_parent1Id].genes; 

        // second 8 digits in DNA will be selected by using modulo, it's whats left over and undividable by 100000000
        uint256 _parent2genes = allMonkeysArray[_parent2Id].genes; 

        // calculating new DNA string with mentioned formulas
        uint256 _newDna = _mixDna(_parent1genes, _parent2genes);

        // calculate generation here
        uint256 _newGeneration = _calcGeneration(_parent1Id, _parent2Id);

        // creating new monkey
        uint256 newMonkeyId = _createMonkey(_parent1Id, _parent2Id, _newGeneration, _newDna, _msgSender());                       

        emit BreedingSuccessful(
            newMonkeyId,
            allMonkeysArray[newMonkeyId].genes,
            allMonkeysArray[newMonkeyId].birthtime,
            allMonkeysArray[newMonkeyId].parent1Id,
            allMonkeysArray[newMonkeyId].parent2Id,
            allMonkeysArray[newMonkeyId].generation,
            _msgSender()
        );       

        return newMonkeyId;
    }

    function _calcGeneration (uint256 _parent1Id, uint256 _parent2Id) internal view returns(uint256) {

        uint256 _generationOfParent1 = allMonkeysArray[_parent1Id].generation; 
        uint256 _generationOfParent2 = allMonkeysArray[_parent2Id].generation; 

        // new generation is average of parents generations plus 1
        // for ex. 1 + 5 = 6, 6/2 = 3, 3+1=4, newGeneration would be 4

        // rounding numbers if odd, for ex. 1+2=3, 3*10 = 30, 30/2 = 15
        // 15 % 10 = 5, 5>0, 15+5=20
        // 20 / 10 = 2, 2+1 = 3
        // newGeneration = 3
        uint256 _roundingNumbers = (((_generationOfParent1 + _generationOfParent2) * 10) / 2); 
        if (_roundingNumbers % 10 > 0) {
            _roundingNumbers + 5;      
        }
        uint256 newGeneration = (_roundingNumbers / 10 ) + 1;

        return newGeneration;
    }

    /**
    * @dev Returns a binary between 00000000-11111111
    */
    function _getRandom() internal view returns (uint8) {
        return uint8(block.timestamp % 255);
    }
    
    // will generate a pseudo random number and from that decide whether to take mom or dad genes, repeated for 8 pairs of 2 digits each
    function _mixDna (uint256 _parent1genes, uint256 _parent2genes) internal view returns (uint256) {
        uint256[8] memory _geneArray;
        uint8 _random = _getRandom();
        uint8 index = 7;

        // Bitshift: move to next binary bit
        for (uint256 i = 1; i <= 128; i = i * 2) {
        // Then add 2 last digits from the dna to the new dna
        if (_random & i != 0) {
            _geneArray[index] = uint8(_parent1genes % 100);
        } else {
            _geneArray[index] = uint8(_parent2genes % 100);
        }
        //each loop, take off the last 2 digits from the genes number string
        _parent1genes = _parent1genes / 100;
        _parent2genes = _parent2genes / 100;
        index = index--;
        }

        uint256 pseudoRandomAdv = uint256(keccak256(abi.encodePacked(uint256(_random), totalSupply, allMonkeysArray[allMonkeysArray.length-1].genes)));         

        // makes this number a 2 digit number between 10-98
        pseudoRandomAdv = (pseudoRandomAdv % 89) + 10;

        // setting first 2 digits in DNA string to random numbers
        _geneArray[0] = pseudoRandomAdv;

        uint256 newGeneSequence; 
        
        // puts in last positioned array entry (2 digits) as first numbers, then adds 00, then adds again,
        // therefore reversing the backwards information in the array again to correct order 
        for (uint256 j = 0; j < 8; j++) {
            newGeneSequence = newGeneSequence + _geneArray[j];

            // will stop adding zeros after last repetition
            if (j != 7)  {
                newGeneSequence = newGeneSequence * 100;
            }                
        } 

        return newGeneSequence;      
    }

    // gives back an array with the NFT tokenIds that the provided sender address owns
    // deleted NFTs are kept as entries with value 0 (token ID 0 is used by Zero Monkey)
    function findMonkeyIdsOfAddress(address owner) public view returns (uint256[] memory) {

        uint256 amountOwned = balanceOf(owner);

        uint256 entryCounter = 0;

        uint256[] memory ownedTokenIDs = new uint256[](amountOwned);

        for (uint256 tokenIDtoCheck = 0; tokenIDtoCheck < totalSupply; tokenIDtoCheck++ ) {
            
            if (ownerOf(tokenIDtoCheck) == owner) {
                ownedTokenIDs[entryCounter] = tokenIDtoCheck; 
                entryCounter++;
            }       
        }

        return ownedTokenIDs;        
    }

    // used for creating gen0 monkeys 
    function createGen0Monkey(uint256 _genes) public onlyOwner {
        // making sure that no more than 12 monkeys will exist in gen0
        require(gen0amountTotal < GEN0_Limit, "Maximum amount of gen 0 monkeys reached");

        // increasing counter of gen0 monkeys 
        gen0amountTotal++;

        // creating
        _createMonkey(0, 0, 0, _genes, _msgSender());
        
    }

    // used for creating monkeys (returns tokenId, could be used)
    function _createMonkey(
        uint256 _parent1Id,
        uint256 _parent2Id,
        uint256 _generation,
        uint256 _genes,
        address _owner
    ) private whenNotPaused returns (uint256) {
        // uses the CryptoMonkey struct as template and creates a newMonkey from it
            CryptoMonkey memory newMonkey = CryptoMonkey({                
            parent1Id: uint256(_parent1Id),
            parent2Id: uint256(_parent2Id),
            generation: uint256(_generation),
            genes: _genes,
            birthtime: uint256(block.timestamp)
        });

        // updating total supply
        totalSupply++;
        
        // the push function also returns the length of the array, using that directly and saving it as the ID, starting with 0
        allMonkeysArray.push(newMonkey);
        uint256 newMonkeyId = allMonkeysArray.length.sub(1);

        // after creation, transferring to new owner, 
        // transferring address is user, sender is 0 address
        _safeMint(_owner, newMonkeyId);    

        emit MonkeyCreated(_owner, newMonkeyId, _parent1Id, _parent2Id, _genes);

        // tokenId is returned
        return newMonkeyId;
    }    
    
    function createMonkey(
        uint256 _parent1Id,
        uint256 _parent2Id,
        uint256 _generation,
        uint256 _genes,
        address _owner
    ) public returns (uint256){
        uint256 newMonkey = _createMonkey(_parent1Id, _parent2Id, _generation, _genes, _owner);
        return newMonkey;
    }

    // gives back all the main details on a NFT
    function getMonkeyDetails(uint256 tokenId)
        public
        view
        returns (
            uint256 genes,
            uint256 birthtime,
            uint256 parent1Id,
            uint256 parent2Id,
            uint256 generation,
            address owner,
            address approvedAddress
        )
    {
        return (
            allMonkeysArray[tokenId].genes,
            allMonkeysArray[tokenId].birthtime,
            allMonkeysArray[tokenId].parent1Id,
            allMonkeysArray[tokenId].parent2Id,
            allMonkeysArray[tokenId].generation,
            ownerOf(tokenId),
            getApproved(tokenId)
        );
    }

    // Returns the _totalSupply
    function showTotalSupply() public view returns (uint256) {
        return totalSupply;
    }

    /// * @dev Assign ownership of a specific Monekey to an address.
    /// * @dev This poses no restriction on _msgSender()
    /// * @param _from The address from who to transfer from, can be 0 for creation of a monkey
    /// * @param _to The address to who to transfer to, cannot be 0 address
    /// * @param _tokenId The id of the transfering monkey
     
    function transfer(
        address _from,
        address _to,
        uint256 _tokenId
    ) public nonReentrant whenNotPaused{
        require(_to != address(0), "transfer to the zero address");
        require(_to != address(this), "Can't transfer to");
        require (_isApprovedOrOwner(_msgSender(), _tokenId) == true);   

        safeTransferFrom(_from, _to, _tokenId);
    }

    function burnNFT (        
        uint256 _tokenId
    ) private nonReentrant whenNotPaused{       
        
        require (_isApprovedOrOwner(_msgSender(), _tokenId) == true);         

        // burning via openzeppelin
        _burn(_tokenId);       
    }

    
}