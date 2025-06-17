"use server";

import { erc20Contract, publicClient, walletClient, account } from "../index";
import { courseBadgeContract } from "../course-badge-contract";
import { generateCertificate } from "../../lib/certificateGenerator";
import { uploadToIPFS } from "../../lib/ipfsUploader";
import { unlink } from "fs/promises";
import { existsSync } from "fs";
import { fetchFilesFromPinata } from "./get-files.action";
import { GROUP_ID } from "@/constants/data";

export async function claimCreditForStudent(dto: { userAddress: `0x${string}` }) {
    const { userAddress } = dto;

    if (!userAddress) {
        return { error: "Invalid input: userAddress and are required." };
    }

    try {
        console.log(`Preparing to claim tokens for ${userAddress}...`);
        const { request }: { request: any } = await publicClient.simulateContract({
            args: [userAddress as `0x${string}`],
            ...erc20Contract,
            functionName: "claim",
        });
        const txHash = await walletClient.writeContract(request);

        console.log(`Transaction sent! Hash: ${txHash}`);

        return {
            message: "Reward added successfully!",
            transactionHash: txHash,
        };
    } catch (error: any) {
        console.error("Error in server action:", error);
        return {
            error: "Failed to execute transaction.",
            details: error.message,
        };
    }
}

export async function createCertificateType({
    name,
    maxSupply,
    uriCertificate,
}: {
    name: string;
    maxSupply: bigint;
    uriCertificate: string;
}) {
    try {
        console.log(`Creating certificate type: ${name}...`);
        console.log(`Account address: ${account.address}`);

        const txHash = await walletClient.writeContract({
            args: [name, maxSupply, uriCertificate],
            ...courseBadgeContract,
            functionName: "createCertificateType",
        });

        console.log(`Certificate type creation transaction sent: ${txHash}`);

        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
        console.log(`Transaction mined in block: ${receipt.blockNumber}`);
        console.log(`Transaction status: ${receipt.status}`);
        console.log(`Gas used: ${receipt.gasUsed}`);

        if (receipt.status === "reverted") {
            return {
                error: "Transaction reverted",
                details: "The createCertificateType transaction was reverted",
            };
        }

        let tokenId: bigint | null = null;

        console.log(`Parsing ${receipt.logs.length} logs...`);
        for (let i = 0; i < receipt.logs.length; i++) {
            const log = receipt.logs[i];
            console.log(`Log ${i}:`, {
                address: log.address,
                topics: log.topics,
                data: log.data,
            });

            try {
                if (log.address.toLowerCase() === courseBadgeContract.address.toLowerCase()) {
                    if (log.topics && log.topics.length >= 2) {
                        if (log.topics[1] !== undefined) {
                            tokenId = BigInt(log.topics[1]);
                            console.log(`Found tokenId in logs: ${tokenId}`);
                            break;
                        } else {
                            console.warn("log.topics[1] is undefined, cannot convert to BigInt");
                        }
                    }
                }
            } catch (e) {
                console.log(`Could not parse log ${i}:`, e);
                continue;
            }
        }

        if (!tokenId) {
            console.log("Could not extract tokenId from logs");
        }

        return {
            message: "Certificate type created successfully!",
            transactionHash: txHash,
            tokenId: tokenId,
        };
    } catch (error: any) {
        console.error("Error creating certificate type:", error);
        return {
            error: "Failed to create certificate type.",
            details: error.message,
        };
    }
}

export async function claimBadgeWithCertificate({
    userAddress,
    tokenId,
    name,
    course,
    date,
    amount,
}: {
    userAddress: `0x${string}`;
    tokenId?: bigint;
    name: string;
    course: string;
    date: string;
    amount?: bigint;
}) {
    try {
        console.log("Starting claimBadgeWithCertificate process...");

        const certPath = `/tmp/cert-${userAddress}.jpg`;

        if (existsSync(certPath)) {
            try {
                await unlink(certPath);
                console.log(`Removed existing certificate image: ${certPath}`);
            } catch (unlinkError) {
                console.warn(`Failed to remove existing certificate image: ${unlinkError}`);
            }
        }

        const adjustedDate: string = new Date(date).toISOString().split("T")[0];

        await generateCertificate({ name, course, date: adjustedDate, output: certPath });

        if (!existsSync(certPath)) {
            return {
                error: "Certificate image was not generated.",
                details: `File not found after generateCertificate: ${certPath}. This may indicate a problem with the certificate generator or missing dependencies on the server.`,
            };
        }

        const { metadataIpfs } = await uploadToIPFS(
            certPath,
            name,
            course,
            date,
            tokenId !== undefined && tokenId !== null ? BigInt(tokenId) : BigInt(0)
        );
        const additionalData = metadataIpfs;

        let certificateTokenId = tokenId;

        if (!certificateTokenId) {
            console.log("No tokenId provided, creating new certificate type...");

            const createResult = await createCertificateType({
                name: `${course} Certificate`,
                maxSupply: BigInt(1000 * 10 ** 18),
                uriCertificate: additionalData,
            });

            if (createResult.error) {
                console.error("Failed to create certificate type:", createResult.error);
                return createResult;
            }

            if (!createResult.tokenId) {
                return {
                    error: "Failed to get token ID from certificate type creation.",
                    details: "Token ID was not returned from createCertificateType",
                };
            }

            certificateTokenId = createResult.tokenId;
            console.log(`Successfully created certificate type with ID: ${certificateTokenId}`);
        }

        console.log(`Verifying certificate type ${certificateTokenId} exists...`);
        try {
            const tokenInfo = (await publicClient.readContract({
                ...courseBadgeContract,
                functionName: "tokenInfo",
                args: [certificateTokenId],
            })) as any;

            console.log(`Token info:`, tokenInfo);

            if (!tokenInfo || tokenInfo.maxSupply === BigInt(0)) {
                return {
                    error: "Certificate type does not exist or has invalid configuration.",
                    details: `Token ID ${certificateTokenId} not found or maxSupply is 0`,
                };
            }
        } catch (error) {
            console.error("Error verifying certificate type:", error);
            return {
                error: "Failed to verify certificate type exists.",
                details: error,
            };
        }

        const latestUri = await fetchFilesFromPinata(
            GROUP_ID!,
            tokenId !== undefined && tokenId !== null ? tokenId : 0,
            process.env.PINATA_JWT!
        );

        if (!latestUri) {
            return {
                error: "Failed to fetch latest URI from Pinata.",
                details: "No matching file found for the given token ID",
            };
        }
        console.log(`Latest URI fetched from Pinata: ${latestUri}`);

        console.log(`Issuing certificate with tokenId: ${certificateTokenId}...`);

        const txHash = await walletClient.writeContract({
            args: [userAddress, certificateTokenId, latestUri!],
            ...courseBadgeContract,
            functionName: "issueCertificate",
        });

        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

        if (receipt.status === "reverted") {
            return { error: "Certificate issue transaction reverted" };
        }

        console.log(`Certificate issued successfully! Transaction: ${txHash}`);

        console.log(`Setting token URI for tokenId: ${certificateTokenId} to ${latestUri}...`);

        const setTokenUriTx = await walletClient.writeContract({
            functionName: "setTokenURI",
            args: [certificateTokenId, latestUri!],
            ...courseBadgeContract,
        });

        console.log(`Token URI set successfully! Transaction: ${setTokenUriTx}`);
        const tokenUriReceipt = await publicClient.waitForTransactionReceipt({ hash: setTokenUriTx });

        if (tokenUriReceipt.status === "reverted") {
            return {
                error: "Failed to set token URI.",
                details: "The setTokenURI transaction was reverted",
            };
        }

        console.log(`Token URI set successfully in block: ${tokenUriReceipt.blockNumber}`);

        try {
            if (existsSync(certPath)) {
                await unlink(certPath);
                console.log(`Cleaned up certificate image: ${certPath}`);
            }
        } catch (cleanupError) {
            console.warn(`Failed to clean up certificate image: ${cleanupError}`);
        }

        return {
            message: "Badge and certificate claimed successfully!",
            transactionHash: txHash,
            tokenId: certificateTokenId,
            additionalData,
        };
    } catch (error: any) {
        console.error("Error in claimBadgeWithCertificate:", error);

        const certPath = `/tmp/cert-${userAddress}.jpg`;
        try {
            if (existsSync(certPath)) {
                await unlink(certPath);
                console.log(`Cleaned up certificate image after error: ${certPath}`);
            }
        } catch (cleanupError) {
            console.warn(`Failed to clean up certificate image after error: ${cleanupError}`);
        }

        return {
            error: "Failed to claim badge/certificate.",
            details: error?.message || error?.toString() || JSON.stringify(error),
            stack: error?.stack || null,
            raw: JSON.stringify(error, Object.getOwnPropertyNames(error)),
        };
    }
}

export async function checkCertificateTypeExists(tokenId: bigint) {
    try {
        const tokenInfo = (await publicClient.readContract({
            ...courseBadgeContract,
            functionName: "tokenInfo",
            args: [tokenId],
        })) as any;

        return tokenInfo && tokenInfo.maxSupply > BigInt(0);
    } catch (error) {
        console.error("Error checking certificate type:", error);
        return false;
    }
}
