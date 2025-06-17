import { IPFS_GATEWAY_BASE } from "@/constants/data";

interface PinataFileMetadata {
    name?: string;
    [key: string]: any;
}

interface PinataFile {
    ipfs_pin_hash: string;
    metadata?: PinataFileMetadata;
    [key: string]: any;
}

interface PinataApiResponse {
    rows: PinataFile[];
    [key: string]: any;
}

export async function fetchFilesFromPinata(
    groupId: string,
    tokenId: string | number | bigint,
    authToken: string
) {
    try {
        const response = await fetch(`https://api.pinata.cloud/data/pinList?group_id=${groupId}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch files from Pinata: ${response.statusText}`);
        }

        const data = await response.json();
        const files = data.rows;

        const matchingFile: PinataFile | undefined = files.find((file: PinataFile) => {
            const metadata: PinataFileMetadata = file.metadata || {};
            return metadata.name && metadata.name.startsWith(String(tokenId));
        });

        if (matchingFile) {
            return `${IPFS_GATEWAY_BASE}${matchingFile.ipfs_pin_hash}`;
        } else {
            console.log(`No matching file found for tokenId: ${tokenId}`);
            return null;
        }
    } catch (error) {
        console.error("Error fetching files from Pinata:", error);
        throw error;
    }
}
