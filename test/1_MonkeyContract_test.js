const { expect } = require('chai');
const { BigNumber } = require("ethers");

// Main function that is executed during the test
describe("Monkey Contract, testing", () => {
  // Global variable declarations
  let _contractInstance, monkeyContract, accounts, assertionCounter;

  // 11 genes0
  const genes0 = [
    1111111111111111,
    2222222222222222,
    3333333333333333,
    4444444444444444,
    5555555555555555,
    6666666666666666,
    7777777777777777,
    1214131177989271,
    4778887573779531,
    2578926622376651,
    5867697316113337,
    4688246721977031    
  ] 

  //set contracts instances
  before(async function() {
    // Deploy MonkeyContract to testnet
    _contractInstance = await ethers.getContractFactory('MonkeyContract');
    monkeyContract = await _contractInstance.deploy(); 
    //get all accounts from hardhat
    accounts = await ethers.getSigners();
  })  
  
  it('Test 1: State variables are as expected: owner, contract address, NFT name, NFT symbol, gen 0 limit, gen 0 total, total supply', async() => { 

    // accounts[0] should be deployer of main contract
    const monkeyContractDeployer = await monkeyContract.owner();
    expect(monkeyContractDeployer).to.equal(accounts[0].address);

    // Main contract address should be saved correctly
    const _contractAddress = await monkeyContract.getMonkeyContractAddress(); 
    expect(_contractAddress).to.equal(monkeyContract.address); 

    // NFT name should be "Crypto Monkeys"
    const _name = await monkeyContract.name();
    expect(_name).to.equal('Crypto Monkeys'); 
    
    //  NFT symbol should be "MONKEY"'
    const _symbol = await monkeyContract.symbol()
    expect(_symbol).to.equal('MONKEY');    

    // NFT gen 0 limit should be 12
    const _GEN0_Limit = await monkeyContract.GEN0_Limit();
    expect(_GEN0_Limit).to.equal(12); 

    // NFT gen 0 total should be 0 in the beginning
    const _gen0amountTotal = await monkeyContract.gen0amountTotal();
    expect(_gen0amountTotal).to.equal(0);
    
    // NFT total supply should be 0 in the beginning
    const _totalSupply = await monkeyContract.totalSupply();
    expect(_totalSupply).to.equal(0);  

  });


  it("Test 2: Gen 0 monkeys: Create 12 gen 0 NFTs, then expect revert above 12 (after GEN0_Limit = 12)", async () => {
    
    // REVERT: create a gen 0 monkey from account[1]
    await expect(monkeyContract.connect(accounts[1]).createGen0Monkey(genes0[0])).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );

    // creating 12 gen 0 monkeys
    for(_i in genes0){
     await monkeyContract.createGen0Monkey(genes0[_i]);
    }

    // NFT totalSupply should be 12
    const _totalSupply = await monkeyContract.showTotalSupply();
    expect(_totalSupply).to.equal(12); 

    // testing getting data from mapping
    for (let i = 0; i < _totalSupply; i++) {
      let _monkeyMapping = await monkeyContract.allMonkeysArray(i);
      // skip monkey created by constructor
      if(i > 0){

      // verify monkey genes are the same from our genes0 array 
      // _monkeyMapping[3] shows genes attribute inside the returning CryptoMonkey object     
      expect(_monkeyMapping[3]).to.equal(genes0[i]);
      }
    } 

    // GEN0_Limit reached, next creation should fail
    await expect(monkeyContract.createGen0Monkey(genes0[0])).to.be.revertedWith(
      "Maximum amount of gen 0 monkeys reached"
    );    

  });

  it("2. BREED Monkey", async () => {
    // breeding 3 NFT monkeys
    const breed1answer = await monkeyContract.breed(1, 2); // tokenId 12
    const breed2answer = await monkeyContract.breed(3, 4); // tokenId 13
    const breed3answer = await monkeyContract.breed(5, 6); // tokenId 14
    //console.log('breed1answer:', breed1answer);
    //console.log('breed2answer:', breed2answer);
    //console.log('breed3answer:', breed3answer);

    const NFTwTokenID12 = await monkeyContract.getMonkeyDetails(12);
    let result12 = /*ethers.utils.formatUnits(*/NFTwTokenID12.genes;//, 0);
    console.log('NFTwTokenID12 genes:', result12);

    /*
    const NFTwTokenID13 = monkeyContract.getMonkeyDetails(13);
    console.log('NFTwTokenID13 genes:', NFTwTokenID13.genes);

    const NFTwTokenID14 = monkeyContract.getMonkeyDetails(14);
    console.log('NFTwTokenID14 genes:', NFTwTokenID14.genes);

    const NFTwTokenID15 = monkeyContract.getMonkeyDetails(15);
    console.log('NFTwTokenID14 genes:', NFTwTokenID15.genes);*/

    // balanceOf accounts[0] should be 15
    expect(await monkeyContract.balanceOf(accounts[0].address)).to.equal(15);
    // NFT totalSupply should be 15
    expect(await monkeyContract.totalSupply()).to.equal(15);
  });

  it("3. Checking tokenId ", async () =>{
    let _monkeyId = await monkeyContract.findMonkeyIdsOfAddress(accounts[0].address);
    for(i in _monkeyId){
      let _result = ethers.utils.formatUnits(_monkeyId[i], 0);
      console.log("tokenArray", _result);
    }
    //let _monkeyPosition = await monkeyContract.findNFTposition(accounts[0].address, _monkeyId[1]);
    //console.log("monkey Position", ethers.utils.formatUnits(_monkeyPosition, 0))
  });

  it("4. TRANSFER 2 gen0 monkeys from account[0] to account[1]", async () => {    

    const _totalSupply = await monkeyContract.totalSupply();
    console.log(`total#[${_totalSupply}]`)

    await monkeyContract.transferFrom(accounts[0].address, accounts[1].address, 2);
    expect(await monkeyContract.balanceOf(accounts[1].address)).to.equal(1);

    await monkeyContract.transferFrom(accounts[0].address, accounts[1].address, 3);
    expect(await monkeyContract.balanceOf(accounts[1].address)).to.equal(2);

    // REVERT: transfer a non-owned monkey
    await expect(monkeyContract.transferFrom(accounts[1].address, accounts[2].address, 1)).to.be.revertedWith(
      "ERC721: transfer of token that is not own"
    );
    
    // accounts[0] should own 13 monkeys
    expect(await monkeyContract.balanceOf(accounts[0].address)).to.equal(13);
  });

  /*

   

describe('Testing main contract: NFT creation and transfers', () => {      

  
  it('Test 8: accounts[0] should create 9 gen0 monkeys with DNA matching their index/tokenId', async() => {  
       
    // this loop will create 9 gen0 NFTs, each with a DNA string consisting of repeated, concatted NFT tokenId
    // i.e. 1111111111111111 for the NFT with tokenId 1
    // it will also check the emitted MonkeyCreated event each time and check if the emitted DNA string is correct as well
    for (let i = 1; i < 10; i++) {
      
      const concattedIndexes = `${i}${i}${i}${i}${i}${i}${i}${i}${i}${i}${i}${i}${i}${i}${i}${i}` 
      
      
      const receipt = await monkeyContractHHInstance.createGen0Monkey(concattedIndexes, {from: accounts[0]});        
      expectEvent(receipt, 'MonkeyCreated', { genes: `${concattedIndexes}` });        
      
      const genesTestedDetails = await monkeyContractHHInstance.getMonkeyDetails(i);
      const genesTested = parseInt(genesTestedDetails.genes);
      const compareConcats = parseInt(concattedIndexes); 
      assert.equal(genesTested, compareConcats);
      assertionCounter++;       
      
      // checking how many NFTs are owned by accounts[0] after each loop
      const prepAmountNFTsForAccounts0 = await monkeyContractHHInstance.balanceOf(accounts[0]);
      const amountNFTsForAccounts0 = parseInt(prepAmountNFTsForAccounts0) ;        
      assert.equal(amountNFTsForAccounts0, i);
      assertionCounter++;
    }

    // checking total supply of NFTs, should be 10, one Zero Monkey plus 9 gen0
    const totalSupplyAfterCreating10 = await monkeyContractHHInstance.totalSupply();      
    assert.equal(totalSupplyAfterCreating10, 10);
    assertionCounter++;      
    
    const account0ArrayToAssert = [1, 2, 3, 4, 5, 6, 7, 8, 9 ];
    await assertAllFourTrackersCorrect (accounts[0], 9,  account0ArrayToAssert);

  });

  
  it('Test 9: accounts[0] should create 2 additional gen0 monkeys, bringing totalSupply to 12, of which 11 gen0', async() => { 

    // this loop will create 2 gen0 NFTs, each with a DNA string of 1111111111111111
    // it will also check the emitted MonkeyCreated event each time and check if the emitted DNA string is correct as well
    for (let i = 0; i < 2; i++) {              
      const receipt2 =  await monkeyContractHHInstance.createGen0Monkey(1111111111111111, {from: accounts[0]});  
      
      // checking if genes string is as expected in NFTs with Token ID 10 and 11
      const correctTokenID = i + 10
      const genesTestedDetails = await monkeyContractHHInstance.getMonkeyDetails(correctTokenID);
      const genesTested = parseInt(genesTestedDetails.genes); 
      const correctGenes = parseInt(1111111111111111)
      assert.equal(genesTested, correctGenes);
      assertionCounter++;        

      // checking if MonkeyCreated event was correctly triggered
      expectEvent(receipt2, 'MonkeyCreated', { genes: `${correctGenes}` }); 
      
      // checking how many NFTs are owned by accounts[0] after each loop
      const prepAmountNFTsForAccounts0 = await monkeyContractHHInstance.balanceOf(accounts[0]);
      const amountNFTsForAccounts0 = parseInt(prepAmountNFTsForAccounts0) ;
      //console.log(amountNFTsForAccounts0);
      assert.equal(amountNFTsForAccounts0, correctTokenID)
      assertionCounter++;
    }
    const totalSupplyAfterCreating12 = await monkeyContractHHInstance.totalSupply();      
    assert.equal(parseInt(totalSupplyAfterCreating12), 12); 
    assertionCounter++;       
    
    const account0ArrayToAssert = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 ];
    await assertAllFourTrackersCorrect (accounts[0], 11,  account0ArrayToAssert);

  });
  
  it('Test 10: accounts[1] should try to create NFT, but is not authorized, should fail', async() => {             
      
    await expectRevert.unspecified(
      monkeyContractHHInstance.createGen0Monkey(1111111111111111, {from: accounts[1]})
    );      

    const account0ArrayToAssert = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 ];
    await assertAllFourTrackersCorrect (accounts[0], 11,  account0ArrayToAssert);
     
  });
  
  it('Test 11: accounts[0] should create NFT, filling gen0 limit (of 12), bringing totalSupply to 13 (incl. Zero Monkey)', async() => {         
    await monkeyContractHHInstance.createGen0Monkey(1111111111111111, {from: accounts[0]})      
    
    // checking how many NFTs are owned by accounts[0], should be 12
    const prepAmountNFTsForAccounts0 = await monkeyContractHHInstance.balanceOf(accounts[0]);
    const amountNFTsForAccounts0 = parseInt(prepAmountNFTsForAccounts0) ;
    
    assert.equal(amountNFTsForAccounts0, 12);
    assertionCounter++;

    const totalSupplynow2 = await monkeyContractHHInstance.showTotalSupply();    
    assert.equal(parseInt(totalSupplynow2), 13);
    assertionCounter++;

    const account0ArrayToAssert = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 ];
    await assertAllFourTrackersCorrect (accounts[0], 12,  account0ArrayToAssert);

  });
  
  it('Test 12: Limit is reached, creating another NFT should fail', async() => {             
      
    await expectRevert.unspecified(
      monkeyContractHHInstance.createGen0Monkey(1111111111111111, {from: accounts[0]})
    );      

    const account0ArrayToAssert = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 ];
    await assertAllFourTrackersCorrect (accounts[0], 12,  account0ArrayToAssert);
    
  });
  
  it('Test 13: accounts[0] should give accounts[1] operator status', async() => {  
    
    // Giving operator status 
    await monkeyContractHHInstance.setApprovalForAll(accounts[1], true, {from: accounts[0]});

    const operatorGivenApprovalTesting = await monkeyContractHHInstance.isApprovedForAll(accounts[0], accounts[1]);
     
    assert.equal(operatorGivenApprovalTesting, true);
    assertionCounter++;
   
  });

  it('Test 14: accounts[0] should take operator status away from accounts[1]', async() => {  
    await monkeyContractHHInstance.setApprovalForAll(accounts[1], false, {from: accounts[0]});
    
    const operatorTakenApprovalTesting = await monkeyContractHHInstance.isApprovedForAll(accounts[0], accounts[1]);
         
    // console.log('operator status for accounts[1] is:', operatorTakenApprovalTesting);    
    
    assert.equal(operatorTakenApprovalTesting, false);
    assertionCounter++;
  });

  it('Test 15: accounts[0] should give accounts[1] operator status again', async() => {  

    // Giving operator status 
    await monkeyContractHHInstance.setApprovalForAll(accounts[1], true, {from: accounts[0]});

    const operatorGivenApprovalTesting = await monkeyContractHHInstance.isApprovedForAll(accounts[0], accounts[1]);
      
    assert.equal(operatorGivenApprovalTesting, true);
    assertionCounter++;     
  });

  it('Test 15A: accounts[0] should use safeTransferFrom with sending data to move Token ID 1 from itself to accounts[2]', async() => {  
    
    await monkeyContractHHInstance.safeTransferFrom(accounts[0], accounts[2], 1, '0xa1234');      

    const testingMonkey = await monkeyContractHHInstance.getMonkeyDetails(1);
    
    assert.equal(testingMonkey.owner, accounts[2]);
    assertionCounter++;      

    await assertPosIntegrAllNFTs();

    const account0ArrayToAssert = [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 ];
    await assertAllFourTrackersCorrect (accounts[0], 11, account0ArrayToAssert);

    const account2ArrayToAssert = [1];
    await assertAllFourTrackersCorrect (accounts[2], 1, account2ArrayToAssert);
    
  });


  it('Test 16: as operator, accounts[1] should use transferFrom to move 4 NFTs with Token IDs 2-5 from accounts[0] to accounts[2]', async() => {  
    
    for (let index = 2; index <= 5; index++) {
      await monkeyContractHHInstance.transferFrom(accounts[0], accounts[2], `${index}`, { 
        from: accounts[1],
      });

      const testingMonkey = await monkeyContractHHInstance.getMonkeyDetails(index);
    
      assert.equal(testingMonkey.owner, accounts[2]);
      assertionCounter++;        
    }

    const account0ArrayToAssert = [0, 0, 0, 0, 0, 6, 7, 8, 9, 10, 11, 12 ];
    await assertAllFourTrackersCorrect (accounts[0], 7,  account0ArrayToAssert);

    const account1ArrayToAssert = [];
    await assertAllFourTrackersCorrect (accounts[1], 0,  account1ArrayToAssert);

    const account2ArrayToAssert = [1, 2, 3, 4, 5];
    await assertAllFourTrackersCorrect (accounts[2], 5,  account2ArrayToAssert);
    
  });

  it('Test 16A: as operator, accounts[1] should use transferFrom to take 7 NFTs with Token IDs 6-12 from accounts[0]', async() => {  
    
    for (let index = 6; index <= 12; index++) {
      await monkeyContractHHInstance.transferFrom(accounts[0], accounts[1], `${index}`, { 
        from: accounts[1],
      });

      const testingMonkey = await monkeyContractHHInstance.getMonkeyDetails(index);
    
      assert.equal(testingMonkey.owner, accounts[1]);
      assertionCounter++;        
    }

    const account0ArrayToAssert = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    await assertAllFourTrackersCorrect (accounts[0], 0,  account0ArrayToAssert);

    const account1ArrayToAssert = [6, 7, 8, 9, 10, 11, 12];
    await assertAllFourTrackersCorrect (accounts[1], 7,  account1ArrayToAssert);

    const account2ArrayToAssert = [1, 2, 3, 4, 5];
    await assertAllFourTrackersCorrect (accounts[2], 5,  account2ArrayToAssert);
    
  });

  it('Test 17: accounts[1] should give exclusive allowance for the NFT with Token ID 7 to accounts[2]', async() => {  
    const receipt = await monkeyContractHHInstance.approve(accounts[2], 7, {from: accounts[1]});
    const testingMonkeyNr7 = await monkeyContractHHInstance.getMonkeyDetails(7);

    assert.equal(testingMonkeyNr7.approvedAddress, accounts[2]);
    assertionCounter++;

  });

  it('Test 18: getApproved should confirm exclusive allowance for NFT with Token ID 7', async() => { 

    const testingAllowedAddressForMonkeyId7 = await monkeyContractHHInstance.getApproved(7);

    assert.equal(testingAllowedAddressForMonkeyId7, accounts[2]);
    assertionCounter++;

  });
  
  
  it('Test 19: accounts[2] should use transferFrom to take the allowed NFT with Token ID 7 from accounts[1]', async() => {       
    await monkeyContractHHInstance.transferFrom(accounts[1], accounts[2], 7, {from: accounts[2]});

    const testingMonkeyNr7 = await monkeyContractHHInstance.getMonkeyDetails(7);

    assert.equal(testingMonkeyNr7.owner, accounts[2]);
    assertionCounter++;

    const account0ArrayToAssert = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    await assertAllFourTrackersCorrect (accounts[0], 0,  account0ArrayToAssert);

    const account1ArrayToAssert = [6, 0, 8, 9, 10, 11, 12];
    await assertAllFourTrackersCorrect (accounts[1], 6,  account1ArrayToAssert);

    const account2ArrayToAssert = [1, 2, 3, 4, 5, 7];
    await assertAllFourTrackersCorrect (accounts[2], 6,  account2ArrayToAssert);

  });

  
  it('Test 20: accounts[1] should use transfer to send NFT with Token ID 6 to accounts[3]' , async() => {       
    await monkeyContractHHInstance.transfer(accounts[3], 6, { 
      from: accounts[1],
    });

    const testingMonkeyNr6 = await monkeyContractHHInstance.getMonkeyDetails(6);
    
    assert.equal(testingMonkeyNr6.owner, accounts[3]);
    assertionCounter++;

    const account0ArrayToAssert = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    await assertAllFourTrackersCorrect (accounts[0], 0,  account0ArrayToAssert);

    const account1ArrayToAssert = [0, 0, 8, 9, 10, 11, 12];
    await assertAllFourTrackersCorrect (accounts[1], 5,  account1ArrayToAssert);

    const account2ArrayToAssert = [1, 2, 3, 4, 5, 7];
    await assertAllFourTrackersCorrect (accounts[2], 6,  account2ArrayToAssert);

    const account3ArrayToAssert = [6];
    await assertAllFourTrackersCorrect (accounts[3], 1,  account3ArrayToAssert);

  });
  
  // 21 is skipped, 15A does a simpler version, via default call being from accounts[0], i.e. needing 1 less argument
  // might be due to hardhat, truffle, etc being so new
  // accepts 4 arguments (either without data or targeting an instance with predefined {from: accounts[PREDEFINED_ARRAY_INDEX]})
  // but when given 5 (i.e.  with data plus custom defined account in contract call) throws and says: "Error: Invalid number of parameters for "safeTransferFrom". Got 5 expected 3!"
  // complicating factor maybe: two functions exist under the name "safeTransferFrom", one accepting 4 arguments, the other only 3, setting the fourth to ''
  it.skip('Test 21: accounts[2] should use safeTransferFrom to move NFT with Token ID 5 from accounts[2] to accounts[3] and also send in data', async() => {       
    await monkeyContractHHInstance.safeTransferFrom(accounts[2], accounts[3], 5, '0xa1234', { 
      from: accounts[2],
    });

    const testingMonkey5 = await monkeyContractHHInstance.getMonkeyDetails(5);

    //console.log('accounts[3] is', accounts[3]) 
    //console.log('testingMonkey5.owner is', testingMonkey5.owner);

    assert.equal(testingMonkey5.owner, accounts[3]);
    assertionCounter++;
  });
  
  it('Test 21Placeholder: accounts[2] should use safeTransferFrom to move NFT with Token ID 5 from accounts[2] to accounts[3] (test cant send data atm, fix test 21)', async() => {       
    await monkeyContractHHInstance.safeTransferFrom(accounts[2], accounts[3], 5, { 
      from: accounts[2],
    });

    const testingMonkey5 = await monkeyContractHHInstance.getMonkeyDetails(5);

    //console.log('accounts[3] is', accounts[3]) 
    //console.log('testingMonkey5.owner is', testingMonkey5.owner);

    assert.equal(testingMonkey5.owner, accounts[3]);
    assertionCounter++;

    const account0ArrayToAssert = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    await assertAllFourTrackersCorrect (accounts[0], 0,  account0ArrayToAssert);

    const account1ArrayToAssert = [0, 0, 8, 9, 10, 11, 12];
    await assertAllFourTrackersCorrect (accounts[1], 5,  account1ArrayToAssert);

    const account2ArrayToAssert = [1, 2, 3, 4, 0, 7];
    await assertAllFourTrackersCorrect (accounts[2], 5,  account2ArrayToAssert);

    const account3ArrayToAssert = [6, 5];
    await assertAllFourTrackersCorrect (accounts[3], 2,  account3ArrayToAssert);


  });

})

describe('Testing main contract: Breeding', () => {     
 
  it('Test 22: accounts[3] should breed NFT monkeys (Token IDs:5,6) 14 times. ', async() => {  
          
    //let firstTwoDigitsNFTNow;
    //let firstTwoDigitsNFTLast = 0;      

    // checking how many NFTs are owned by accounts[3] at the start, should be 2, Token IDs 5 and 6
    const prepAmountNFTsForAccounts3 = await monkeyContractHHInstance.balanceOf(accounts[3]);
    const amountNFTsForAccounts3 = parseInt(prepAmountNFTsForAccounts3) ;
    //console.log('at start of Test 22 accounts[3] has this many NFTs: ' + amountNFTsForAccounts3);
    assert.equal(amountNFTsForAccounts3, 2);
    assertionCounter++;
    
    for (let index = 1; index <= 14; index++) {   

      await monkeyContractHHInstance.breed(5, 6, {from: accounts[3]});

      // Zero Monkey is in array on index 0, plus 12 NFT monkeys, first free array index is position 13
      const newMonkeyTokenIdTestingDetails = await monkeyContractHHInstance.getMonkeyDetails(index + 12);  
       
      
        // comparing first 2 digits of genes
        //let stringOfNFTGenesNow = newMonkeyTokenIdTestingDetails.genes.toString();
        //console.log('Breed Nr.' + index + ' genes are ' + stringOfNFTGenesNow);  
        /*firstTwoDigitsNFTNow = parseInt(stringOfNFTGenesNow.charAt(0)+stringOfNFTGenesNow.charAt(1));
        //console.log('Breed Nr.' + index + ' first 2 gene digits LAST are ' + firstTwoDigitsNFTLast); 
        //console.log('Breed Nr.' + index + ' first 2 gene digits NOW are ' + firstTwoDigitsNFTNow);  
        assert.notEqual(firstTwoDigitsNFTNow, firstTwoDigitsNFTLast);
        assertionCounter++;
        // the 'NFT to check now' becomes the 'last NFT checked' for next loop
        firstTwoDigitsNFTLast = firstTwoDigitsNFTNow;
      

      // checking if contract owner is owner of NFT
      assert.equal(newMonkeyTokenIdTestingDetails.owner, accounts[3]);
      assertionCounter++; 
      
      // checking how many NFTs are owned by accounts[3] at the start, should be increasing, starting with 3, go up to 16
      const loopPrepAmountNFTsForAccounts3 = await monkeyContractHHInstance.balanceOf(accounts[3]);
      const loopAmountNFTsForAccounts3 = parseInt(loopPrepAmountNFTsForAccounts3);        
      assert.equal(loopAmountNFTsForAccounts3, index + 2);
      assertionCounter++;
    }
    
    const account0ArrayToAssert = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    await assertAllFourTrackersCorrect (accounts[0], 0,  account0ArrayToAssert);

    const account1ArrayToAssert = [0, 0, 8, 9, 10, 11, 12];
    await assertAllFourTrackersCorrect (accounts[1], 5,  account1ArrayToAssert);

    const account2ArrayToAssert = [1, 2, 3, 4, 0, 7];
    await assertAllFourTrackersCorrect (accounts[2], 5,  account2ArrayToAssert);

    const account3ArrayToAssert = [6,5,13,14,15,16,17,18,19,20,21,22,23,24,25,26];
    await assertAllFourTrackersCorrect (accounts[3], 16,  account3ArrayToAssert);


  });

  it('Test 22A: accounts[3] should use safeTransferFrom to move 4 NFTs from itself to accounts[4]. Token IDs 5 and 6 (gen0) and Token IDs 14 and 15 (gen1)' , async() => {       
    // transferring Token ID 5
    await monkeyContractHHInstance.safeTransferFrom(accounts[3], accounts[4], 5, { 
      from: accounts[3],
    });  
    // querying Token details and comparing owenership to new account
    const testingMonkeyNr5 = await monkeyContractHHInstance.getMonkeyDetails(5);        
    assert.equal(testingMonkeyNr5.owner, accounts[4]);
    assertionCounter++;

    // repeat for Token ID 6
    await monkeyContractHHInstance.safeTransferFrom(accounts[3], accounts[4], 6, { 
      from: accounts[3],
    });        
    const testingMonkeyNr6 = await monkeyContractHHInstance.getMonkeyDetails(6);        
    assert.equal(testingMonkeyNr6.owner, accounts[4]);
    assertionCounter++;
    
    // repeat for Token ID 14
    await monkeyContractHHInstance.safeTransferFrom(accounts[3], accounts[4], 14, { 
      from: accounts[3],
    });  
    const testingMonkeyNr14 = await monkeyContractHHInstance.getMonkeyDetails(14);        
    assert.equal(testingMonkeyNr14.owner, accounts[4]);
    assertionCounter++;

    // repeat for Token ID 15
    await monkeyContractHHInstance.safeTransferFrom(accounts[3], accounts[4], 15, { 
      from: accounts[3],
    });        
    const testingMonkeyNr15 = await monkeyContractHHInstance.getMonkeyDetails(15);        
    assert.equal(testingMonkeyNr15.owner, accounts[4]);
    assertionCounter++;  


    const account0ArrayToAssert = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    await assertAllFourTrackersCorrect (accounts[0], 0,  account0ArrayToAssert);

    const account1ArrayToAssert = [0, 0, 8, 9, 10, 11, 12];
    await assertAllFourTrackersCorrect (accounts[1], 5,  account1ArrayToAssert);

    const account2ArrayToAssert = [1, 2, 3, 4, 0, 7];
    await assertAllFourTrackersCorrect (accounts[2], 5,  account2ArrayToAssert);

    // accounts[3], should have 12 (2 gen0 have been sent, also Token IDs 14 and 15, i.e. 12 left of 14 bred)
    const account3ArrayToAssert = [0,0,13,0,0,16,17,18,19,20,21,22,23,24,25,26];
    await assertAllFourTrackersCorrect (accounts[3], 12,  account3ArrayToAssert);

    // accounts[4] should have 4 NFTs at this point: 5, 6, 14, 15
    const account4ArrayToAssert = [5, 6, 14, 15];
    await assertAllFourTrackersCorrect (accounts[4], 4,  account4ArrayToAssert);



  });   

  
  it('Test 22B: accounts[4] should use breed to create 2 NFTs each of gen2, gen3, gen4, gen5, gen6 and gen7, i.e. should have 16 NFTs at the end (2x gen0 - 2x gen7) ' , async() => { 

    // breeding NFTs with Token IDs 14 and 15, creating gen2: Token IDs 27 and 28       
    for (let index22B1 = 14; index22B1 <= 15; index22B1++) {
      await monkeyContractHHInstance.breed(14, 15, {from: accounts[4]}); 
      
    }        
    
    assertOwnerAndGeneration(accounts[4], 27, 2);
    assertOwnerAndGeneration(accounts[4], 28, 2);

    // starting with gen2 for breeding NFTs with Token IDs 27 and 28 
    let test22Bgeneration = 3;
    // Token IDs are increased by 2 per loop, breeding 27 and 28, then 29 and 30, etc.
    // these are the Token IDs of the parents, not the children
    let test22BFirstParentIdCounter = 27;
    let test22BSecondParentIdCounter = test22BFirstParentIdCounter+1;
    
    // 5 loops, creating gen3-gen7
    for (let t22BigLoop = 0; t22BigLoop < 5; t22BigLoop++) {

      // creating 2 NFTs per loop
      for (let index22B = 0; index22B < 2; index22B++) {
        await monkeyContractHHInstance.breed(test22BFirstParentIdCounter, test22BSecondParentIdCounter, {from: accounts[4]});                
      }  

      /*console.log('test22BFirstParentIdCounter ' + test22BFirstParentIdCounter);
      console.log('test22BSecondParentIdCounter ' + test22BSecondParentIdCounter);
      console.log('first child ID: ' + (test22BFirstParentIdCounter+2));
      console.log('second child ID: ' + (test22BSecondParentIdCounter+2));
      console.log('test22Bgeneration of children: ' + test22Bgeneration);
      console.log('-------------------- ' );
      
      await assertOwnerAndGeneration(accounts[4], test22BFirstParentIdCounter+2, test22Bgeneration);
      await assertOwnerAndGeneration(accounts[4], test22BSecondParentIdCounter+2, test22Bgeneration) ;   
      
      test22Bgeneration++;          
      test22BFirstParentIdCounter = test22BFirstParentIdCounter +2;    
      test22BSecondParentIdCounter = test22BFirstParentIdCounter+1;    
    }      

    const account0ArrayToAssert = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    await assertAllFourTrackersCorrect (accounts[0], 0,  account0ArrayToAssert);

    const account1ArrayToAssert = [0, 0, 8, 9, 10, 11, 12];
    await assertAllFourTrackersCorrect (accounts[1], 5,  account1ArrayToAssert);

    const account2ArrayToAssert = [1, 2, 3, 4, 0, 7];
    await assertAllFourTrackersCorrect (accounts[2], 5,  account2ArrayToAssert);

    const account3ArrayToAssert = [0,0,13,0,0,16,17,18,19,20,21,22,23,24,25,26];
    await assertAllFourTrackersCorrect (accounts[3], 12,  account3ArrayToAssert);

    // expecting 16 NFTs, 4 from before (5,6,14,15) plus 2 bred gen2 (27,28) plus 10 bred gen3-gen7 (5 loops of 2)
    const account4ArrayToAssert = [5, 6, 14, 15, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38];
    await assertAllFourTrackersCorrect (accounts[4], 16,  account4ArrayToAssert);
    
  });
});

});

// Market contract Hardhat test with openzeppelin, Truffle and web3
contract("MonkeyContract + MonkeyMarketplace with HH", accounts => {

// Before running the tests, deploying a new MonkeyMarketplace 
before(async()=> {
  // deploying the marketplace smart contract: MonkeyMarketplace and getting the address of the MonkeyContract for the marketplace constructor
  monkeyMarketplaceHHInstance = await MonkeyMarketplace.new(monkeyContractHHInstance.address);    
 
});

describe('Testing correct deployment', () => {
  
  it('Test 23: Market should know main contract address', async () => {        
    const mainContractAddressSavedInMarket = await monkeyMarketplaceHHInstance.returnMonkeyContract();      
    assert.equal(mainContractAddressSavedInMarket, monkeyContractHHInstance.address);
    assertionCounter++;     
  }) 

  it('Test 24: accounts[0] should be deployer of main contract', async () => {        
    const monkeyContractHHInstanceOwner = await monkeyContractHHInstance.contractOwner()      
    assert.equal(monkeyContractHHInstanceOwner, accounts[0]);
    assertionCounter++;
  }) 
  
  it('Test 25: accounts[0] should be deployer of market contract', async () => {        
    const marketContractHHInstanceOwner = await monkeyMarketplaceHHInstance.contractOwner()     
    assert.equal(marketContractHHInstanceOwner, accounts[0]);
    assertionCounter++;
  }) 

});

describe('Testing creating and deleting offers', () => {
  
  it('Test 26: accounts[2] and accounts[4] should give market contract operator status', async () => {    

    giveMarketOperatorAndAssertAndCount(accounts[2]);
    giveMarketOperatorAndAssertAndCount(accounts[4]);
  }) 

  it('Test 27: accounts[2] should create 4 offers, all gen0 (Token IDs: 1,2,3,4), prices in ETH same as Token ID', async () => {    

    for (let test27Counter = 1; test27Counter <= 4; test27Counter++) {        

      let priceInETHTest27 = test27Counter.toString(); 

      let priceInWEIForCallingTest27 = web3.utils.toWei(priceInETHTest27); 

      await monkeyMarketplaceHHInstance.setOffer(priceInWEIForCallingTest27, test27Counter, {from: accounts[2]});        

      await assertOfferDetailsForTokenID(test27Counter, true, accounts[2], priceInETHTest27 );        
    }

    const offersArray = [1, 2, 3, 4];
    await assertAmountOfActiveOffersAndCount(4, offersArray);
   
  }) 

  it('Test 28: accounts[4] should create 4 offers, 2x gen6 (Token IDs: 35, 36) and 2x gen7 (Token IDs: 37, 38)', async () => {  
    for (let test28Counter = 35; test28Counter <= 38; test28Counter++) {        
      await createOfferAndAssert (test28Counter, test28Counter, accounts[4]);         
    }     
    const offersArray = [1, 2, 3, 4, 35, 36, 37, 38];
    await assertAmountOfActiveOffersAndCount(8, offersArray);
  }) 

  it('Test 29: accounts[2] should delete 1 active offer (Token ID: 4), now 7 active offers should exist (Token IDs: 1,2,3 and 35,36,37,38) ', async () => {  
    await monkeyMarketplaceHHInstance.removeOffer(4, {from: accounts[2]});
    await expectNoActiveOfferAndCount(4); 
    const offersArray = [1, 2, 3, 35, 36, 37, 38];
    await assertAmountOfActiveOffersAndCount(7, offersArray);
  }) 

  it('Test 30: accounts[4] should delete 1 active offer (Token ID: 35), now 6 active offers should exist (Token IDs: 1,2,3 and 36,37,38)', async () => {  
    await monkeyMarketplaceHHInstance.removeOffer(35, {from: accounts[4]});
    await expectNoActiveOfferAndCount(35);    
    const offersArray = [1, 2, 3, 36, 37, 38];
    await assertAmountOfActiveOffersAndCount(6, offersArray);
  }) 
});

describe('Testing buying and full market functionality', () => { 

  it('Test 31: accounts[5] should buy 3 NFTs (Token IDs: 1,2,3) from accounts[2], now 3 active offers should exist (Token IDs: 36,37,38)', async () => {  
      for (let buyCountT31 = 1; buyCountT31 <= 3; buyCountT31++) { 

      // balance in WEI before buy
      const balanceInWEIBefore = await web3.eth.getBalance(accounts[5]);       
      //console.log('accounts[5] has', parseInt(balanceInWEIBefore), 'WEI before buying Token ID', buyCountT31) 

      // balance in ETH before buy
      //const balanceInETHBefore = web3.utils.fromWei(await web3.eth.getBalance(accounts[5]), 'ether'); 
      //console.log('accounts[5] has', parseInt(balanceInETHBefore), 'ether before buying Token ID', buyCountT31)          

      // setting Token ID to price in ETH (1=>1), calculated into WEI
      let buyCountT31asString = buyCountT31.toString();
      let t31priceToPayInWEI = web3.utils.toWei(buyCountT31asString);  
      
      console.log('loop and tokenID', buyCountT31, 'has the price in WEI:', t31priceToPayInWEI, 'and this balance:', balanceInWEIBefore);
      
      await monkeyMarketplaceHHInstance.buyMonkey(buyCountT31, {from: accounts[5], value: t31priceToPayInWEI});  
      
      const balanceBeforeInWEIasBN = new BN(balanceInWEIBefore);
      const priceInWEIasBN = new BN(t31priceToPayInWEI);
      const expectedBalanceAfterInWEIasBN = balanceBeforeInWEIasBN.sub(priceInWEIasBN);

      //console.log('loop and tokenID', buyCountT31, 'has the expectedBalanceAfterInWEI:', expectedBalanceAfterInWEI);
      //console.log('loop and tokenID', buyCountT31, 'has the balanceBeforeInWEIasBN:');
      //console.log(balanceBeforeInWEIasBN);

      //console.log('loop and tokenID', buyCountT31, 'has the priceInWEIasBN:');
      //console.log(priceInWEIasBN);        
      
      console.log('priceInWEIasBN');
      console.log(priceInWEIasBN);
      console.log('balanceBeforeInWEIasBN');
      console.log(balanceBeforeInWEIasBN);
      console.log('expectedBalanceAfterInWEIasBN');
      console.log(expectedBalanceAfterInWEIasBN);

      //console.log('parseInt of it is:');
      //const expectedBalanceAfterInWEIParsed = Number(expectedBalanceAfterInWEIasBN)
      //console.log(expectedBalanceAfterInWEIParsed);

      //const expectedBalanceAfterInWEIasString = expectedBalanceAfterInWEI.toString();       
      
      await assertBalanceAsBN(accounts[5], expectedBalanceAfterInWEIasBN);

      // balance after buy
      //const balanceInWEIAfter = await web3.eth.getBalance(accounts[5]); 
      //console.log('accounts[5] has', parseInt(balanceInWEIAfter), 'WEI after buying Token ID', buyCountT31)       
      //console.log('accounts[5] has', parseInt(balanceInETHAfter), 'ether after buying Token ID', buyCountT31)
      
    }      
    const offersArray = [36,37,38];
    await assertAmountOfActiveOffersAndCount(3, offersArray);

    const account0ArrayToAssert = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    await assertAllFourTrackersCorrect (accounts[0], 0,  account0ArrayToAssert);

    const account1ArrayToAssert = [0, 0, 8, 9, 10, 11, 12];
    await assertAllFourTrackersCorrect (accounts[1], 5,  account1ArrayToAssert);

    const account2ArrayToAssert = [0,0,0, 4, 0, 7];
    await assertAllFourTrackersCorrect (accounts[2], 2,  account2ArrayToAssert);

    const account3ArrayToAssert = [0,0,13,0,0,16,17,18,19,20,21,22,23,24,25,26];
    await assertAllFourTrackersCorrect (accounts[3], 12,  account3ArrayToAssert);
    
    const account4ArrayToAssert = [5, 6, 14, 15, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38];
    await assertAllFourTrackersCorrect (accounts[4], 16,  account4ArrayToAssert);

    const account5ArrayToAssert = [1, 2, 3];
    await assertAllFourTrackersCorrect (accounts[5], 3,  account5ArrayToAssert);


  })   

  it('Test 32: accounts[1] should buy 2 NFTs (Token IDs: 36, 37) from accounts[4], now 1 active offer should exist (Token ID: 38)', async () => {  
    for (let buyCountT32 = 36; buyCountT32 <= 37; buyCountT32++) { 
      let largeCountingNrT32 = buyCountT32.toString();
      let t32priceToPayInWEI = web3.utils.toWei(largeCountingNrT32);
      await monkeyMarketplaceHHInstance.buyMonkey(buyCountT32, {from: accounts[1], value: t32priceToPayInWEI});
    }
    const offersArray = [38];
    await assertAmountOfActiveOffersAndCount(1, offersArray);

    const account0ArrayToAssert = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    await assertAllFourTrackersCorrect (accounts[0], 0,  account0ArrayToAssert);

    const account1ArrayToAssert = [0, 0, 8, 9, 10, 11, 12, 36, 37];
    await assertAllFourTrackersCorrect (accounts[1], 7,  account1ArrayToAssert);

    const account2ArrayToAssert = [0,0,0, 4, 0, 7];
    await assertAllFourTrackersCorrect (accounts[2], 2,  account2ArrayToAssert);

    const account3ArrayToAssert = [0,0,13,0,0,16,17,18,19,20,21,22,23,24,25,26];
    await assertAllFourTrackersCorrect (accounts[3], 12,  account3ArrayToAssert);
    
    const account4ArrayToAssert = [5, 6, 14, 15, 27, 28, 29, 30, 31, 32, 33, 34, 35, 0, 0, 38];
    await assertAllFourTrackersCorrect (accounts[4], 14,  account4ArrayToAssert);

    const account5ArrayToAssert = [1, 2, 3];
    await assertAllFourTrackersCorrect (accounts[5], 3,  account5ArrayToAssert);
  }) 
  
  it('Test 33: accounts[3] should breed NFTs (IDs:25,26) creating 3 gen2 NFTs (Token IDs:39,40,41) create offers, now 4 active offers (Token ID: 38,39,40,41)', async () => {  
    // breeding NFTs with Token IDs 25 and 26 three times, creating gen2 Token IDs 39,40,41       
    for (let index22B1 = 1; index22B1 <= 3; index22B1++) {
      await monkeyContractHHInstance.breed(25, 26, {from: accounts[3]});         
    }        

    // Giving operator status 
    giveMarketOperatorAndAssertAndCount(accounts[3]);
 
    for (let test33Counter = 39; test33Counter <= 41; test33Counter++) {        
      // args: price in ETH, Token ID, account
      await createOfferAndAssert (test33Counter, test33Counter, accounts[3]);    
    }
    const offersArray = [38,39,40,41];
    await assertAmountOfActiveOffersAndCount(4, offersArray);

    const account0ArrayToAssert = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    await assertAllFourTrackersCorrect (accounts[0], 0,  account0ArrayToAssert);

    const account1ArrayToAssert = [0, 0, 8, 9, 10, 11, 12, 36, 37];
    await assertAllFourTrackersCorrect (accounts[1], 7,  account1ArrayToAssert);

    const account2ArrayToAssert = [0,0,0, 4, 0, 7];
    await assertAllFourTrackersCorrect (accounts[2], 2,  account2ArrayToAssert);

    const account3ArrayToAssert = [0,0,13,0,0,16,17,18,19,20,21,22,23,24,25,26, 39, 40, 41];
    await assertAllFourTrackersCorrect (accounts[3], 15,  account3ArrayToAssert);
    
    const account4ArrayToAssert = [5, 6, 14, 15, 27, 28, 29, 30, 31, 32, 33, 34, 35, 0, 0, 38];
    await assertAllFourTrackersCorrect (accounts[4], 14,  account4ArrayToAssert);

    const account5ArrayToAssert = [1, 2, 3];
    await assertAllFourTrackersCorrect (accounts[5], 3,  account5ArrayToAssert);
  }) 
  
  it('Test 34: accounts[1] should create 2 offers (Token IDs:36,37) and accounts[5] 2 offers (Token IDs:1,2), now 8 active offers (Token IDs: 38,39,40,41,36,37,1,2)', async () => {  
    
    // Giving operator status 
    giveMarketOperatorAndAssertAndCount(accounts[1]);
    giveMarketOperatorAndAssertAndCount(accounts[5]);
    
    // accounts[1] creating 2 offers (Token IDs:36,37)
    for (let test34Counter2 = 36; test34Counter2 <= 37; test34Counter2++) {        
      // args: price in ETH, Token ID, account
      await createOfferAndAssert (test34Counter2, test34Counter2, accounts[1]);            
    }      
    
    // accounts[5] creating 2 offers (Token IDs:1,2)
    for (let test34Counter1 = 1; test34Counter1 <= 2; test34Counter1++) {        
      // args: price in ETH, Token ID, account
      await createOfferAndAssert (test34Counter1, test34Counter1, accounts[5]); 
    }
  
    const offersArray = [38,39,40,41,36,37,1,2];
    await assertAmountOfActiveOffersAndCount(8, offersArray);
  }) 
  
  it('Test 35: accounts[4] should buy back 2 NFTs (Token IDs: 36, 37) from accounts[1], now 6 active offers should exist (Token IDs: 1,2,38,39,40,41)', async () => {  
    for (let buyCountT35 = 36; buyCountT35 <= 37; buyCountT35++) { 

      let largeCountingNrT35 = buyCountT35.toString();
      let t35priceToPayInWEI = web3.utils.toWei(largeCountingNrT35);
      await monkeyMarketplaceHHInstance.buyMonkey(buyCountT35, {from: accounts[4], value: t35priceToPayInWEI});
    }
    const offersArray = [38,39,40,41, 1,2];
    await assertAmountOfActiveOffersAndCount(6, offersArray);

    const account0ArrayToAssert = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    await assertAllFourTrackersCorrect (accounts[0], 0,  account0ArrayToAssert);

    const account1ArrayToAssert = [0, 0, 8, 9, 10, 11, 12, 0, 0];
    await assertAllFourTrackersCorrect (accounts[1], 5,  account1ArrayToAssert);

    const account2ArrayToAssert = [0, 0, 0, 4, 0, 7];
    await assertAllFourTrackersCorrect (accounts[2], 2,  account2ArrayToAssert);

    const account3ArrayToAssert = [0, 0, 13, 0, 0, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 39, 40, 41];
    await assertAllFourTrackersCorrect (accounts[3], 15,  account3ArrayToAssert);
    
    const account4ArrayToAssert = [5, 6, 14, 15, 27, 28, 29, 30, 31, 32, 33, 34, 35, 0, 0, 38, 36, 37];
    await assertAllFourTrackersCorrect (accounts[4], 16,  account4ArrayToAssert);

    const account5ArrayToAssert = [1, 2, 3];
    await assertAllFourTrackersCorrect (accounts[5], 3,  account5ArrayToAssert);
  })     
  
  it('Test 36: accounts[6] (Token IDs 1) and accounts[7] (Token ID 2) should buy from accounts[5], now 4 active offers (Token IDs: 38,39,40,41) ', async () => {  
    await monkeyMarketplaceHHInstance.buyMonkey(1, {from: accounts[6], value: web3.utils.toWei('1')});   
    await monkeyMarketplaceHHInstance.buyMonkey(2, {from: accounts[7], value: web3.utils.toWei('2')});   
    const offersArray = [38,39,40,41];
    await assertAmountOfActiveOffersAndCount(4, offersArray);
    
    const account0ArrayToAssert = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    await assertAllFourTrackersCorrect (accounts[0], 0,  account0ArrayToAssert);

    const account1ArrayToAssert = [0, 0, 8, 9, 10, 11, 12, 0, 0];
    await assertAllFourTrackersCorrect (accounts[1], 5,  account1ArrayToAssert);

    const account2ArrayToAssert = [0, 0, 0, 4, 0, 7];
    await assertAllFourTrackersCorrect (accounts[2], 2,  account2ArrayToAssert);

    const account3ArrayToAssert = [0, 0, 13, 0, 0, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 39, 40, 41];
    await assertAllFourTrackersCorrect (accounts[3], 15,  account3ArrayToAssert);
    
    const account4ArrayToAssert = [5, 6, 14, 15, 27, 28, 29, 30, 31, 32, 33, 34, 35, 0, 0, 38, 36, 37];
    await assertAllFourTrackersCorrect (accounts[4], 16,  account4ArrayToAssert);

    const account5ArrayToAssert = [0, 0, 3];
    await assertAllFourTrackersCorrect (accounts[5], 1,  account5ArrayToAssert);

    const account6ArrayToAssert = [1];
    await assertAllFourTrackersCorrect (accounts[6], 1,  account6ArrayToAssert);

    const account7ArrayToAssert = [2];
    await assertAllFourTrackersCorrect (accounts[7], 1,  account7ArrayToAssert);
  }) 
  
  it('Test 37: accounts[6] creates 1 offer with decimal amount for Token ID 1, which is then bought by accounts[8], now still 4 active offers (Token IDs: 38,39,40,41) ', async () => {  
    // Giving operator status 
    giveMarketOperatorAndAssertAndCount(accounts[6]);   
    await createOfferAndAssert(2.456, 1, accounts[6]);
    await monkeyMarketplaceHHInstance.buyMonkey(1, {from: accounts[8], value: web3.utils.toWei('2.456')});         
    const offersArray = [38,39,40,41];
    await assertAmountOfActiveOffersAndCount(4, offersArray);

    const account0ArrayToAssert = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    await assertAllFourTrackersCorrect (accounts[0], 0,  account0ArrayToAssert);

    const account1ArrayToAssert = [0, 0, 8, 9, 10, 11, 12, 0, 0];
    await assertAllFourTrackersCorrect (accounts[1], 5,  account1ArrayToAssert);

    const account2ArrayToAssert = [0, 0, 0, 4, 0, 7];
    await assertAllFourTrackersCorrect (accounts[2], 2,  account2ArrayToAssert);

    const account3ArrayToAssert = [0, 0, 13, 0, 0, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 39, 40, 41];
    await assertAllFourTrackersCorrect (accounts[3], 15,  account3ArrayToAssert);
    
    const account4ArrayToAssert = [5, 6, 14, 15, 27, 28, 29, 30, 31, 32, 33, 34, 35, 0, 0, 38, 36, 37];
    await assertAllFourTrackersCorrect (accounts[4], 16,  account4ArrayToAssert);

    const account5ArrayToAssert = [0, 0, 3];
    await assertAllFourTrackersCorrect (accounts[5], 1,  account5ArrayToAssert);

    const account6ArrayToAssert = [0];
    await assertAllFourTrackersCorrect (accounts[6], 0,  account6ArrayToAssert);

    const account7ArrayToAssert = [2];
    await assertAllFourTrackersCorrect (accounts[7], 1,  account7ArrayToAssert);

    const account8ArrayToAssert = [1];
    await assertAllFourTrackersCorrect (accounts[8], 1,  account8ArrayToAssert);


  }) 
  
  it('Test 38: accounts[7] creates 1 offer with decimal amount under 1 for Token ID 1, which is then bought by accounts[8], now still 4 active offers (Token IDs: 38,39,40,41) ', async () => {  
    // Giving operator status 
    giveMarketOperatorAndAssertAndCount(accounts[7]);   
    await createOfferAndAssert(0.21, 2, accounts[7]);
    const offersArrayBetween = [38,39,40,41,2];
    await assertAmountOfActiveOffersAndCount(5, offersArrayBetween);
    await monkeyMarketplaceHHInstance.buyMonkey(2, {from: accounts[8], value: web3.utils.toWei('0.21')});  
    // showArrayOfAccount(accounts[8]);  
    const offersArray = [38,39,40,41];
    await assertAmountOfActiveOffersAndCount(4, offersArray);

    const account0ArrayToAssert = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    await assertAllFourTrackersCorrect (accounts[0], 0,  account0ArrayToAssert);

    const account1ArrayToAssert = [0, 0, 8, 9, 10, 11, 12, 0, 0];
    await assertAllFourTrackersCorrect (accounts[1], 5,  account1ArrayToAssert);

    const account2ArrayToAssert = [0, 0, 0, 4, 0, 7];
    await assertAllFourTrackersCorrect (accounts[2], 2,  account2ArrayToAssert);

    const account3ArrayToAssert = [0, 0, 13, 0, 0, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 39, 40, 41];
    await assertAllFourTrackersCorrect (accounts[3], 15,  account3ArrayToAssert);
    
    const account4ArrayToAssert = [5, 6, 14, 15, 27, 28, 29, 30, 31, 32, 33, 34, 35, 0, 0, 38, 36, 37];
    await assertAllFourTrackersCorrect (accounts[4], 16,  account4ArrayToAssert);

    const account5ArrayToAssert = [0, 0, 3];
    await assertAllFourTrackersCorrect (accounts[5], 1,  account5ArrayToAssert);

    const account6ArrayToAssert = [0];
    await assertAllFourTrackersCorrect (accounts[6], 0,  account6ArrayToAssert);

    const account7ArrayToAssert = [0];
    await assertAllFourTrackersCorrect (accounts[7], 0,  account7ArrayToAssert);

    const account8ArrayToAssert = [1, 2];
    await assertAllFourTrackersCorrect (accounts[8], 2,  account8ArrayToAssert);
  }); 

  it('Test 39makeLast: should verify the intergrity between trackers _monkeyIdsAndTheirOwnersMapping and MonkeyIdPositionsMapping for all NFTs', async () => {  
    
    await assertPosIntegrAllNFTs();
  }); 
  

  it('Test 40: should show how many assertions in testing were done', async () => {  

    console.log('During these Hardhat tests, at least', assertionCounter , 'assertions were succesfully proven correct.')


  }); 
  */
})