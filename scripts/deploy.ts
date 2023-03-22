import { ethers } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";

async function main() {
  const Factory = await ethers.getContractFactory("HeroFactory");
  const token = await Factory.deploy(
    "0x0582fB623317d4B711Da3D7658cd6f834b508417",
    10000
  );
  await token.deployed();

  const hre: HardhatRuntimeEnvironment = await import("hardhat");
  console.warn(`Factory Deployed: ${token.address}`);
  setTimeout(async () => {
    await hre.run("verify:verify", {
      address: token.address,
      constructorArguments: ["0x0582fB623317d4B711Da3D7658cd6f834b508417", 10000],
      contract: "contracts/PackFactory.sol:HeroFactory",
    });
  }, 15000);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
