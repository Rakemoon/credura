import { PinataSDK } from "pinata";
import fs from "fs";
import { GROUP_ID, IPFS_GATEWAY_BASE } from "@/constants/data";

export const pinata = new PinataSDK({
    pinataJwt: `${process.env.PINATA_JWT}`,
    pinataGateway: `${process.env.NEXT_PUBLIC_GATEWAY_URL}`,
});

interface MetadataAttribute {
    trait_type: string;
    value: string;
}

interface UploadToIPFSResult {
    imageIpfs: string;
    metadataIpfs: string;
}

export interface CertificateMetadata {
    name: string;
    description: string;
    image: string;
    attributes: MetadataAttribute[];
}

function generateMetadataJSON(
    name: string,
    course: string,
    date: string,
    imageIpfsUrl: string
): CertificateMetadata {
    return {
        name: `Certificate of Completion: ${course}`,
        description: `This certificate is proudly presented to ${name} for completing ${course}.`,
        image: imageIpfsUrl,
        attributes: [
            { trait_type: "Student", value: name },
            { trait_type: "Course", value: course },
            { trait_type: "Date", value: date },
            { trait_type: "Certificate Type", value: "Course Completion" },
        ],
    };
}

export async function uploadToIPFS(
    certificatePath: string,
    name: string,
    course: string,
    date: string,
    tokenId: bigint
): Promise<UploadToIPFSResult> {
    try {
        const gatewayBase =
            IPFS_GATEWAY_BASE + "bafkreibte6wv75o65qa3hyouyf2pdkuapwfbd5vdwcyji6b2hrgyxpxvlu";
        const metadataUrl = `${gatewayBase}/${tokenId}.json`;

        const metadata: CertificateMetadata = generateMetadataJSON(name, course, date, "");

        const fileBuffer: Buffer = fs.readFileSync(certificatePath);
        const file: File = new File([fileBuffer], `${tokenId}.jpg`, {
            type: "image/jpeg",
        });
        const fileResult: { cid: string } = await pinata.upload.public.file(file).group(GROUP_ID!);

        metadata.image = `ipfs://${fileResult.cid}`;

        const metadataFile = new File([JSON.stringify(metadata)], `${tokenId}.json`, {
            type: "application/json",
        });
        await pinata.upload.public.file(metadataFile).group(GROUP_ID!);

        return {
            imageIpfs: fileResult.cid,
            metadataIpfs: metadataUrl,
        };
    } catch (err) {
        console.error("❌ Error uploading to IPFS:", err);
        throw err;
    }
}
