const { ethers } = require("hardhat");
const PinataSDK = require("@pinata/sdk");

// --- ВАШИ КЛЮЧИ ОТ PINATA ---
const PINATA_API_KEY = "b512c455920078f9e884"; // <-- ВСТАВЬТЕ СЮДА API Key
const PINATA_API_SECRET = "0d12a72af4a35676a585e7f63b9e02dffca5d999240a9efec2acb0490aa6504e"; // <-- ВСТАВЬТЕ СЮДА API Secret

const pinata = new PinataSDK(PINATA_API_KEY, PINATA_API_SECRET);

async function uploadToIPFS(proposalJSON) {
    console.log("Uploading proposal description to IPFS via @pinata/sdk...");
    try {
        const result = await pinata.pinJSONToIPFS(proposalJSON, {
            pinataMetadata: {
                name: `Monolith Ledger Proposal - ${new Date().toISOString()}`,
            },
        });
        console.log("Upload successful! IPFS CID:", result.IpfsHash);
        return result.IpfsHash;
    } catch (error) {
        console.error("Pinata SDK Error:", error);
        throw error;
    }
}

async function main() {
    const [deployer] = await ethers.getSigners();

    // 1. Загружаем описание предложения в IPFS
    const proposalDescriptionJSON = {
        title: "Proposal #1: Purchase Test Asset",
        description: "This is a test proposal to verify the voting mechanism.",
    };
    const ipfsCid = await uploadToIPFS(proposalDescriptionJSON);

    // 2. Получаем развернутые контракты
    const path = require("path");
    const fs = require("fs");
    const deploymentsPath = path.resolve(__dirname, "../ignition/deployments/chain-31337/deployed_addresses.json");
    let deployments;
    try {
        if (!fs.existsSync(deploymentsPath)) {
            throw new Error(`deployed_addresses.json not found at: ${deploymentsPath}`);
        }
        deployments = require(deploymentsPath);
    } catch (e) {
        console.error("Ошибка чтения deployed_addresses.json:", e);
        process.exit(1);
    }
    const daoAddress = deployments["MonolithLedgerModule#DAO"];
    const mleTokenAddress = deployments["MonolithLedgerModule#AssetToken"];
    if (!daoAddress || !mleTokenAddress) {
        console.error("\n[DEBUG] Ключи в deployed_addresses.json:", Object.keys(deployments));
        console.error("[DEBUG] Содержимое deployed_addresses.json:", deployments);
        throw new Error(`Адреса контрактов не найдены в deployments.\nОжидались ключи: MonolithLedgerModule#DAO и MonolithLedgerModule#AssetToken.\nПроверьте деплой и ключи в ${deploymentsPath}`);
    }
    const dao = await ethers.getContractAt("MonolithLedgerDAO", daoAddress);
    const mleToken = await ethers.getContractAt("MonolithAssetToken", mleTokenAddress);

    // 3. Создаем предложение в DAO
    console.log("\nCreating proposal on-chain...");
    const amountToMint = ethers.parseUnits("1000", 18);
    const calldata = mleToken.interface.encodeFunctionData("mint", [
        deployer.address,
        amountToMint,
    ]);
    const tx = await dao.propose(
        [mleTokenAddress],      // targets
        [0],                    // values
        [calldata],             // calldatas
        ipfsCid // Используем CID как описание
    );
    console.log("TX result:", tx);
    const receipt = await tx.wait();

    // 4. Ищем Proposal ID в событиях
    let proposalId = null;
    // Попытка получить из возврата функции (если контракт возвращает proposalId)
    if (tx && tx.proposalId) {
        proposalId = tx.proposalId;
    }
    // Если не найдено — ищем через фильтр событий
    if (!proposalId) {
        try {
            const filter = dao.filters.ProposalCreated();
            const events = await dao.queryFilter(filter, "latest");
            if (events && events.length > 0) {
                proposalId = events[events.length - 1].args.proposalId;
                console.log("ProposalCreated event found via queryFilter.");
            } else {
                console.warn("[DEBUG] ProposalCreated events not found via queryFilter.");
            }
        } catch (e) {
            console.warn("[DEBUG] Ошибка при поиске событий через queryFilter:", e);
        }
    }
    if (!proposalId) {
        // Попытка вычислить proposalId вручную (OpenZeppelin Governor style)
        try {
            const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(ipfsCid));
            const abiCoder = ethers.AbiCoder.defaultAbiCoder ? ethers.AbiCoder.defaultAbiCoder() : ethers.AbiCoder;
            proposalId = ethers.keccak256(
                abiCoder.encode(
                    ["address[]", "uint256[]", "bytes[]", "bytes32"],
                    [[mleTokenAddress], [0], [calldata], descriptionHash]
                )
            );
            console.log("ProposalId (calculated):", proposalId);
        } catch (e) {
            console.warn("[DEBUG] Не удалось вычислить proposalId вручную:", e);
        }
    }
    console.log("Transaction for proposal creation is complete.");
    console.log("Proposal created! ID:", proposalId ? proposalId.toString() : "(ID not found in events, please check transaction)");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
