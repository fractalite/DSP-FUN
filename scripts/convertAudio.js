import { AudioOptimizer } from '../js/utils/audioOptimizer.js';
import fs from 'fs/promises';
import path from 'path';

const AUDIO_DIR = path.join(process.cwd(), 'audio');
const OUTPUT_DIR = path.join(process.cwd(), 'audio', 'optimized');

async function convertAudioFiles() {
    try {
        // Create output directory if it doesn't exist
        await fs.mkdir(OUTPUT_DIR, { recursive: true });

        // Initialize audio optimizer
        const optimizer = new AudioOptimizer();

        // Get all audio files
        const files = await fs.readdir(AUDIO_DIR);
        const audioFiles = files.filter(file => 
            ['.mp3', '.wav', '.m4a', '.ogg'].some(ext => 
                file.toLowerCase().endsWith(ext)
            )
        );

        console.log(`Found ${audioFiles.length} audio files to convert`);

        // Convert each file
        for (const file of audioFiles) {
            const inputPath = path.join(AUDIO_DIR, file);
            const outputPath = path.join(
                OUTPUT_DIR, 
                `${path.parse(file).name}.${optimizer.getOptimalFormat()}`
            );

            console.log(`Converting ${file}...`);

            try {
                const buffer = await optimizer.loadAndOptimize(inputPath);
                const optimizedBlob = await optimizer.convertToOptimalFormat(buffer);
                
                // Save the optimized file
                await fs.writeFile(outputPath, Buffer.from(await optimizedBlob.arrayBuffer()));
                
                // Get file sizes for comparison
                const originalSize = (await fs.stat(inputPath)).size;
                const optimizedSize = (await fs.stat(outputPath)).size;
                const savings = ((originalSize - optimizedSize) / originalSize * 100).toFixed(2);

                console.log(`✓ Converted ${file}`);
                console.log(`  Original size: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
                console.log(`  Optimized size: ${(optimizedSize / 1024 / 1024).toFixed(2)} MB`);
                console.log(`  Space saved: ${savings}%\n`);
            } catch (error) {
                console.error(`✗ Failed to convert ${file}:`, error);
            }
        }

        console.log('Conversion complete!');
    } catch (error) {
        console.error('Conversion script failed:', error);
        process.exit(1);
    }
}

convertAudioFiles();
