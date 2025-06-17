import { createCanvas, loadImage, registerFont } from 'canvas';
import path from 'path';
import fs from 'fs';

export interface CertificateOptions {
    name: string;
    course: string;
    date: string;
    output: string;
}

export async function generateCertificate({ name, course, date, output }: CertificateOptions): Promise<string> {
    try {
        const templatePath = path.join(process.cwd(), 'public/template.jpg');
        let base;
        try {
            base = await loadImage(templatePath);
        } catch (e) {
            throw new Error(`Failed to load template image at ${templatePath}: ${e}`);
        }

        const canvas = createCanvas(base.width, base.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(base, 0, 0);

        try {
            registerFont(path.join(process.cwd(), 'public/fonts/GreatVibes-Regular.ttf'), { family: 'Signature' });
            registerFont(path.join(process.cwd(), 'public/fonts/OpenSans-Regular.ttf'), { family: 'Body' });
        } catch (e) {
            throw new Error(`Failed to register fonts: ${e}`);
        }

        ctx.font = 'bold 56px Signature';
        ctx.fillStyle = '#2d3748';
        ctx.textAlign = 'center';
        ctx.fillText(name, canvas.width / 2, Math.floor(canvas.height * 0.44));

        ctx.font = 'bold 36px Body';
        ctx.fillStyle = '#1a202c';
        ctx.fillText('Certificate of Achievement', canvas.width / 2, Math.floor(canvas.height * 0.25));

        ctx.font = '22px Body';
        ctx.fillStyle = '#333';
        ctx.fillText('This certificate is proudly presented to', canvas.width / 2, Math.floor(canvas.height * 0.3));

        ctx.font = '28px Body';
        ctx.fillStyle = '#4a5568';
        ctx.fillText('for successfully completing:', canvas.width / 2, Math.floor(canvas.height * 0.55));
        ctx.font = 'bold 28px Body';
        ctx.fillStyle = '#2d3748';
        ctx.fillText(course, canvas.width / 2, Math.floor(canvas.height * 0.6));

        const logoPath = path.join(process.cwd(), 'public/logo.png');
        let logo;
        try {
            logo = await loadImage(logoPath);
        } catch (e) {
            throw new Error(`Failed to load logo image at ${logoPath}: ${e}`);
        }
        const logoWidth = 100;
        const logoHeight = 100 * (logo.height / logo.width);
        const logoX = (canvas.width - logoWidth) / 2;
        const logoY = Math.floor(canvas.height * 0.69);
        ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);

        ctx.font = '20px Body';
        ctx.fillStyle = '#555';
        ctx.textAlign = 'left';
        ctx.fillText(`Date: ${date}`, 80, canvas.height - 80);

        ctx.font = 'italic 20px Body';
        ctx.fillStyle = '#888';
        ctx.textAlign = 'right';
        ctx.fillText('Credura Team', canvas.width - 80, canvas.height - 80);

        const outputPath = path.isAbsolute(output) ? output : path.join('/tmp', output);
        try {
            fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        } catch (e) {
            throw new Error(`Failed to create output directory: ${e}`);
        }
        let out;
        try {
            out = fs.createWriteStream(outputPath);
        } catch (e) {
            throw new Error(`Failed to create write stream for output: ${e}`);
        }
        const stream = canvas.createJPEGStream();
        stream.pipe(out);
        return new Promise((resolve, reject) => {
            out.on('finish', () => resolve(outputPath));
            out.on('error', (e) => reject(new Error(`Failed to write certificate image: ${e}`)));
        });
    } catch (err) {
        throw new Error(`Certificate generation failed: ${err}`);
    }
}
