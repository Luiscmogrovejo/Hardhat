/* eslint-disable max-len */
/* eslint-env node, mocha */

import { expect } from 'chai';
import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';
import { zeroAddress } from './utils';

describe('HeroContract', () => {
  it('Should', async () => {
    let contract: any;
    let heroOwner: any;
    let hero: any;
    let newOwner: any;
    let testAccount3: any;
    let testAccount4: any;
    let testAccount5: any;
    beforeEach(async () => {
      [heroOwner, newOwner, testAccount3, testAccount4, testAccount5] = await ethers.getSigners();
      hero = {
        heroId: 1,
        dna: "1010101010101010101010101010101",
        owner: heroOwner,
        rarityScore: 50
      };

      const TestHeroContract = await ethers.getContractFactory('TestHeroContract');
      contract = await TestHeroContract.deploy();
      await contract.deployed();
    });

    function addHero(heroToken: { dna: any; }) {
      return contract.addHero(
        heroToken.dna,
      );
    }

    async function addApproval(heroToken: { owner: any; heroId: any; }, approved: { address: any; }) {
      const result = await contract.connect(heroToken.owner).approve(approved.address, heroToken.heroId);
      return result;
    }

    async function addHeroAndApproval(heroToken: { dna: any; }, approved: any) {
      await addHero(heroToken);
      const result = await addApproval(heroToken, approved);
      return result;
    }

    describe('HeroContract - ownerOf', () => {
      it('should return the owner of a hero', async () => {
        await addHero(hero);
        const result = await contract.ownerOf(hero.heroId);
        expect(result).to.equal(heroOwner.address);
      });

      it('should REVERT if the heroId does NOT exist', async () => {
        const idDoesNotExist = 123;
        await expect(contract.ownerOf(idDoesNotExist)).to.be.revertedWith('invalid heroId');
      });
    });

    it('name should return the contract name', async () => {
      const expected = 'Hero NFT Token';
      const actual = await contract.name();
      expect(actual).to.equal(expected);
    });

    it('symbol should return the contract symbol', async () => {
      const expected = 'SNT';
      const actual = await contract.symbol();
      expect(actual).to.equal(expected);
    });

    describe('HeroContract - transfer', () => {
      beforeEach(async () => {
        await addHero(hero);
      });

      it('should change the ownership of the hero to the new address', async () => {
        await contract.connect(heroOwner).transfer(newOwner.address, hero.heroId);
        expect(await contract.ownerOf(hero.heroId)).to.be.equal(newOwner.address);
        expect(await contract.balanceOf(heroOwner.address)).to.be.equal(0);
        expect(await contract.balanceOf(newOwner.address)).to.be.equal(1);
      });

      it('should emit a Transfer event', async () => {
        await expect(contract.connect(heroOwner).transfer(newOwner.address, hero.heroId)).to.emit(contract, 'Transfer');
      });

      it('should REVERT if the sender does NOT own the hero and is NOT approved', async () => {
        await expect(contract.connect(newOwner).transfer(newOwner.address, hero.heroId)).to.be.revertedWith('sender not hero owner OR approved');
      });

      it('should NOT revert if the sender is NOT the owner but IS approved', async () => {
        const approvedAddress = testAccount3;
        await addApproval(hero, approvedAddress);
        await contract.connect(approvedAddress).transferFrom(hero.owner.address, approvedAddress.address, hero.heroId);
      });

      it('should NOT revert if the send is NOT the owner but IS an approved operator', async () => {
      // grant operator approval
        const operator = testAccount4;
        await contract.connect(heroOwner).setApprovalForAll(operator.address, true);
        await contract.connect(operator).transfer(operator.address, hero.heroId);
      });

      it('should REVERT if the "to" address is zero', async () => {
        await expect(contract.connect(heroOwner).transfer(zeroAddress, hero.heroId)).to.be.revertedWith('zero address');
      });

      it('should REVERT if the "to" address is the contract address', async () => {
        const contractAddress = contract.address;
        await expect(contract.connect(heroOwner).transfer(contractAddress, hero.heroId)).to.be.revertedWith('to contract address');
      });
    });

    describe('HeroContract - approve', () => {
      let approvedAddr: { address: any; };
      beforeEach(async () => {
        await addHero(hero);
        approvedAddr = newOwner;
      });

      it('should set an approval for the given address', async () => {
        await contract.connect(hero.owner).approve(approvedAddr.address, hero.heroId);

        const result = await contract.heroToApproved(hero.heroId);
        expect(result.toString(10)).to.equal(approvedAddr.address);
      });

      it('should emit an Approval event', async () => {
        await expect(contract.connect(hero.owner).approve(approvedAddr.address, hero.heroId)).to.emit(contract, 'Approval').withArgs(
          hero.owner.address,
          approvedAddr.address,
          hero.heroId.toString(10)
        );
      });

      it('should REVERT if the sender is not the owner or approved', async () => {
        const bogusAddress = testAccount3;
        await expect(contract.connect(bogusAddress).approve(bogusAddress.address, hero.heroId)).to.be.revertedWith('sender not hero owner OR approved');
      });

      // is this desired behaviour?
      it('should NOT revert if the sender is NOT the owner but IS approved', async () => {
        const anotherAddress = testAccount3;
        await contract.connect(hero.owner).approve(
          approvedAddr.address,
          hero.heroId
        );
        await contract.connect(approvedAddr).approve(anotherAddress.address, hero.heroId);
      });

      it('should NOT revert if the sender is NOT the owner but is an approved operator', async () => {
      // grant operator approval
        const operator = testAccount4;
        await contract.connect(heroOwner).setApprovalForAll(
          operator.address, true
        );
        await contract.connect(operator).approve(operator.address, hero.heroId);
      });
    });

    describe('HeroContract - Get Approved', () => {
      let approved: { address: any; };
      beforeEach(() => {
        approved = newOwner;
      });

      it('when set, it should return the approved address', async () => {
        await addHeroAndApproval(hero, approved);

        const result = await contract.getApproved(hero.heroId);
        expect(result).to.equal(approved.address);
      });

      it('should return the zero address when no approval has been set', async () => {
      // add hero but don't set an approval
        await addHero(hero);

        const result = await contract.getApproved(hero.heroId);
        expect(result).to.equal(zeroAddress);
      });

      it('should REVERT if tokenId is NOT valid', async () => {
        const invalidTokenId = 1234;
        await expect(contract.getApproved(invalidTokenId)).to.be.revertedWith('invalid heroId');
      });
    });

    describe('HeroContract - Operator approval for all', () => {
      it('should set and revoke operator approval for an address', async () => {
      // grant operator approval
        const operator = testAccount4;
        await contract.connect(heroOwner).setApprovalForAll(
          operator.address, true
        );

        const result = await contract.isApprovedForAll(heroOwner.address, operator.address);
        expect(result).to.equal(true);

        // revoke operator approval
        await contract.connect(heroOwner).setApprovalForAll(operator.address, false);
        const result2 = await contract.isApprovedForAll(heroOwner.address, operator.address);
        expect(result2).to.equal(false);
      });

      it('should support setting multiple operator approvals per address', async () => {
      // approve first operator
        const operator1 = testAccount4;
        await contract.setApprovalForAll(operator1.address, true, { from: heroOwner.address, });

        const result = await contract.isApprovedForAll(heroOwner.address, operator1.address);
        expect(result).to.equal(true);

        // approve second operator
        const operator2 = testAccount5;
        await contract.setApprovalForAll(operator2.address, true, { from: heroOwner.address, });

        const result2 = await contract.isApprovedForAll(heroOwner.address, operator1.address);
        expect(result2).to.equal(true);
      });

      it('should emit an ApprovalForAll event', async () => {
        const operator1 = testAccount4;
        await expect(contract.connect(heroOwner).setApprovalForAll(operator1.address, true)).to.emit(contract, 'ApprovalForAll').withArgs(
          heroOwner.address,
          operator1.address,
          true
        );
      });
    });

    describe('HeroContract - transferFrom', () => {
      beforeEach(async () => {
        await addHero(hero);
      });

      it('when the sender is the owner it should transfer ownership', async () => {
        await contract.transferFrom(
          hero.owner.address,
          newOwner.address,
          hero.heroId,
          { from: hero.owner.address, }
        );

        const result = await contract.ownerOf(hero.heroId);
        expect(result).to.equal(newOwner.address);
      });

      it('when the sender is approved it should transfer ownership', async () => {
        const approved = newOwner;
        await addApproval(hero, approved);
        await contract.connect(approved).transferFrom(hero.owner.address, approved.address, hero.heroId);
      });

      it('when the sender is an approved operator it should transfer ownership', async () => {
        const operator1 = testAccount4;
        await contract.setApprovalForAll(
          operator1.address, true, { from: heroOwner.address, }
        );
        await contract.connect(operator1).transferFrom(hero.owner.address, operator1.address, hero.heroId);
      });

      it('should REVERT when the sender is not the owner, approved, or an approved operator', async () => {
        const unapproved = testAccount3;
        await expect(contract.connect(unapproved).transferFrom(hero.owner.address, unapproved.address, hero.heroId)).to.be.revertedWith('sender not hero owner OR approved');
      });

      it('should REVERT if from address is not the owner', async () => {
        await expect(contract.connect(heroOwner).transferFrom(newOwner.address, newOwner.address, hero.heroId)).to.be.revertedWith('from address not hero owner');
      });

      it('should REVERT if to address is the zero address', async () => {
        await expect(contract.connect(heroOwner).transferFrom(hero.owner.address, zeroAddress, hero.heroId)).to.be.revertedWith('zero address');
      });

      it('should REVERT if tokenId is not valid', async () => {
        const invalidTokenId = 1234;
        await expect(contract.connect(heroOwner).transferFrom(hero.owner.address, newOwner.address, invalidTokenId)).to.be.revertedWith('sender not hero owner OR approved');
      });
    });

    describe('HeroContract - safeTransferFrom', () => {
      beforeEach(async () => {
        await addHero(hero);
      });

      it('should transfer ownership when the sender is the owner', async () => {
        await contract.connect(hero.owner)['safeTransferFrom(address,address,uint256)'](hero.owner.address, newOwner.address, hero.heroId);
        const result = await contract.ownerOf(hero.heroId);
        expect(result).to.equal(newOwner.address);
      });

      it('should transfer when the sender is NOT the owner but IS approved', async () => {
        const approved = testAccount3;
        await addApproval(hero, approved);
        await contract.connect(approved)['safeTransferFrom(address,address,uint256)'](hero.owner.address, approved.address, hero.heroId);

        const result = await contract.ownerOf(hero.heroId);
        expect(result).to.equal(approved.address);
      });

      it('should REVERT when the sender is NOT the owner and NOT approved', async () => {
        const unApproved = testAccount3;
        await contract.connect(hero.owner)['safeTransferFrom(address,address,uint256)'](hero.owner.address, unApproved.address, hero.heroId);
      });

      it('should REVERT if the from address is not the owner', async () => {
        await expect(contract.connect(hero.owner)['safeTransferFrom(address,address,uint256)'](newOwner.address, newOwner.address, hero.heroId)).to.be.revertedWith('from address not hero owner');
      });

      it('should REVERT if the to address is the zero address', async () => {
        await expect(contract.connect(hero.owner)['safeTransferFrom(address,address,uint256)'](hero.owner.address, zeroAddress, hero.heroId)).to.be.revertedWith('zero address');
      });

      it('should transfer the when the recieiver is an ERC721 contract', async () => {
        const TestERC721Receiver = await ethers.getContractFactory('TestERC721Receiver');
        const testERC721ReceiverContract = await TestERC721Receiver.deploy();
        await testERC721ReceiverContract.deployed();

        await contract.connect(hero.owner)['safeTransferFrom(address,address,uint256)'](hero.owner.address, testERC721ReceiverContract.address, hero.heroId);
      });

      it('should REVERT when the reciever contract is NOT ERC721 compliant', async () => {
        const TestBadNFTReceiver = await ethers.getContractFactory(
          "TestBadNFTReceiver"
        );
        const testBadNFTReceiverContract = await TestBadNFTReceiver.deploy();
        await testBadNFTReceiverContract.deployed();
        
        await expect(contract.connect(hero.owner)['safeTransferFrom(address,address,uint256)'](hero.owner.address, testBadNFTReceiverContract.address, hero.heroId)).to.be.reverted;
      });
    });

    describe('HeroContract - supports interface', () => {
      const ERC165_ID = '0x01ffc9a7';
      const ERC721_ID = '0x80ac58cd';

      it('should return TRUE for ERC165', async () => {
        const result = await contract.supportsInterface(ERC165_ID);

        expect(result).to.equal(true);
      });

      it('should return TRUE for ERC721', async () => {
        const result = await contract.supportsInterface(ERC721_ID);
        // ?
        expect(result).to.equal(true);
      });
    });

    describe('HeroContract - Dna To Array', () => {
      beforeEach(async () => {
        await addHero(hero);
      });

      it('should return dna array from dna string', async () => {
        const result = await contract.testDnaToArray(hero.dna)
        expect(result.length).to.equal(15);
      });

      it('should REVERT if dna is invalid', async () => {
        await expect(contract.testDnaToArray(9)).to.be.revertedWith('This dna is invalid');
      });

    });

    describe('HeroContract - Get Hero', () => {
      beforeEach(async () => {
        await addHero(hero);
      });

      it('HeroContract - should be created with the un-hero so valid heros have an id > 0', async () => {
        const unHero = {
          heroId: BigNumber.from(0),
          createdTime: BigNumber.from(0),
          cooldownEndTime: BigNumber.from(0),
          dna: BigNumber.from(0),
          owner: zeroAddress,
          rarityScore: BigNumber.from(0),
          extraRarity: BigNumber.from(0),
        };
        await expect( contract.getHero(0)).to.be.revertedWith('This dna is invalid')
      });
    });
  });
});
