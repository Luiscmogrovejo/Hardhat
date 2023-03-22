/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-return-await */
/* eslint-disable max-len */
/* eslint-disable no-undef */

import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import { TestHeroFactory } from "../typechain-types";

const bigNum = (num: number) => num + "0".repeat(18);

describe("HeroFactory", () => {
  it("Should", async () => {
    let heroFactory: TestHeroFactory;
    let contractOwner;
    let testAccount;
    let testHeroCreator: { address: any; };
    let testHeroCreator1: { address: any; };
    let mockERC20;
    let strn;
    let treasuryAddr;

    beforeEach(async () => {
      [
        contractOwner,
        testAccount,
        testHeroCreator,
        testHeroCreator1,
        treasuryAddr,
      ] = await ethers.getSigners();

      mockERC20 = await ethers.getContractFactory("MockERC20");
      strn = await mockERC20.deploy("STRN", "STRN", bigNum(100000000));
      await strn.deployed();

      const TestHeroContract = await ethers.getContractFactory(
        "TestHeroFactory"
      );
      heroFactory = await TestHeroContract.connect(contractOwner).deploy(
        treasuryAddr.address,
        1
      );
      await heroFactory.deployed();

      strn.transfer(heroFactory.address, bigNum(50000000));
    });

    async function createHero2(_times: number) {
      return await heroFactory.connect(testHeroCreator).createHero2(_times);
    }

    describe("HeroFactory - Create Hero", () => {
      let expHero: { owner: any; dna?: BigNumber; stage?: BigNumber; };
      let transaction: any;
      beforeEach(async () => {
        expHero = {
          dna: BigNumber.from("00000000040000000007"),
          stage: BigNumber.from("0"),
          owner: testHeroCreator,
        };
        transaction = await createHero2(1);
      });

      it("should store the new hero", async () => {
        const result = await heroFactory.getHero(1);
        expect(result.dna.toString(10).length).to.be.within(31, 32);

        const actualOwner = await heroFactory.ownerOf(1);
        expect(actualOwner).to.equal(expHero.owner.address);
      });

      it("should record the ownership of the new hero", async () => {
        const heroOwer = await heroFactory.ownerOf(1);
        expect(heroOwer).to.equal(testHeroCreator.address);
      });

      it("should update the owner count", async () => {
        const result = await heroFactory.balanceOf(testHeroCreator.address);
        expect(result.toString(10)).to.equal("1");
      });

      it("should emit a HeroCreated event", async () => {
        const time = await heroFactory.getHero(1);
        await expect(transaction)
          .to.emit(heroFactory, "HeroCreated")
          .withArgs(expHero.owner.address, 1, time.createdTime);
      });

      it("should update the counter", async () => {
        const result = await heroFactory.totalSupply();
        expect(result.toString()).to.equal("1");
      });

      it("should REVERT if hero counter would exceed the creation limit", async () => {
        expect(createHero2(1)).to.be.revertedWith("No more seeds");
      });
    });

    describe("HeroFactory - Heros of", () => {
      beforeEach(async () => {
        await heroFactory.updateHeroLimit(4);
        await createHero2(4);
      });

      it("should return all the heroIds owned by the given address", async () => {
        const exptectedIds = ["1", "2", "3", "4"];
        const results = await heroFactory.herosOf(testHeroCreator.address);

        expect(results.length).to.equal(exptectedIds.length);
        results
          .map((id: { toString: (arg0: number) => any; }) => id.toString(10))
          .forEach((id: any) => expect(exptectedIds).to.contain(id));
      });

      it("should return an empty array if the owner has no heros", async () => {
        const result = await heroFactory.herosOf(testHeroCreator1.address);

        expect(result.length).to.equal(0);
      });

      it("should return rarity scores of the owner heros", async () => {
        const hero = await heroFactory.getHero(1);
        expect(hero.rarityScore.toString(10).length).to.be.within(2, 3);
      });
    });

    describe("HeroFactory - Randomizer", () => {
      beforeEach(async () => {});

      it("should return a number between 1 and 10", async () => {
        const results = await heroFactory
          .connect(testHeroCreator)
          .callStatic.testRandomizer();
        const decoded = results;
        expect(decoded).to.be.within(1, 10);
      });

      it("should be able to run 20 times", async () => {
        for (let i = 0; i < 20; i++) {
          await heroFactory
            .connect(testHeroCreator)
            .callStatic.testRandomizer();
        }
        const results = await heroFactory
          .connect(testHeroCreator)
          .callStatic.testRandomizer();
        const decoded = results;
        expect(decoded).to.be.within(1, 10);
      });
    });

    describe("HeroFactory - Genes to Number", () => {
      beforeEach(async () => {});

      it("should return a number between 1 and 10", async () => {
        const results = await heroFactory.callStatic.testGenesToNumber(
          "809100908070605040302010102030405"
        );
        const decoded = results;
        expect(decoded).to.be.within(15, 150);
      });

      it("should NOT be able to work without a correct dna", async () => {
        await expect(
          heroFactory.callStatic.testGenesToNumber("40302010102030405")
        ).to.be.revertedWith("Gens incorrect");
      });
    });

    describe("HeroFactory - Get Hero Count", () => {
      beforeEach(async () => {
        await heroFactory.updateHeroLimit(4);
        await createHero2(4);
      });

      it("should return the number of tokens a user owns", async () => {
        const results = await heroFactory.getHeroCount(testHeroCreator.address);
        expect(results).to.be.equal(4);
      });
    });

    describe("HeroFactory - Update limit", () => {
      beforeEach(async () => {});

      it("should REVERT if you mint more than limit", async () => {
        const results = await heroFactory.mintLimit();
        expect(results).to.be.equal(1);
        expect(createHero2(4)).to.be.revertedWith("No more seeds");
      });

      it("should update the limit and let user mint", async () => {
        const results = await heroFactory.mintLimit();
        expect(results).to.be.equal(1);
        await heroFactory.updateHeroLimit(4);
        const results1 = await heroFactory.mintLimit();
        expect(results1).to.be.equal(4);
        await createHero2(4);
      });
    });

    describe("HeroFactory - Get Rarity", () => {
      beforeEach(async () => {});

      it("should REVERT if you call a non-minted token", async () => {
        expect(heroFactory.getRarity(1)).to.be.reverted;
      });

      it("should get the rarity of the created hero", async () => {
        await createHero2(1);
        expect(await heroFactory.getRarity(1)).to.be.within(15, 150);
      });
    });

    describe("HeroFactory - Set Hero Base URI", () => {
      beforeEach(async () => {});
      it("should REVERT if msg.sender is not the admin", async () => {
        expect(
          heroFactory.connect(testHeroCreator1).setHeroBaseURI("Hello World")
        ).to.be.reverted;
      });

      it("should get the Base URI to Hello World", async () => {
        await heroFactory.setHeroBaseURI("Hello World");
        await createHero2(1);
        const uri = await heroFactory.getBaseUri();
        expect(uri).to.equal("Hello World");
      });
    });
  });
});
