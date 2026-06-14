import hre from "hardhat";

async function main() {
  console.log("Sözleşme deploy ediliyor...");

  const DocumentRegistry = await hre.ethers.getContractFactory("DocumentRegistry");
  const documentRegistry = await DocumentRegistry.deploy();

  await documentRegistry.waitForDeployment();

  console.log(
    `DocumentRegistry sözleşmesi şu adrese başarıyla deploy edildi: ${await documentRegistry.getAddress()}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
