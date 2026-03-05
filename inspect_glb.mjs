import fs from 'fs';

const buffer = fs.readFileSync('./public/star.glb');
const magic = buffer.readUInt32LE(0);
if (magic !== 0x46546C67) {
    console.log('Not a GLB file');
    process.exit(1);
}

const chunkLength = buffer.readUInt32LE(12);
const chunkType = buffer.readUInt32LE(16);

if (chunkType === 0x4E4F534A) { // 'JSON'
    const jsonStr = buffer.toString('utf8', 20, 20 + chunkLength);
    const gltf = JSON.parse(jsonStr);
    console.log("Materials:", JSON.stringify(gltf.materials, null, 2));
    console.log("Nodes:", JSON.stringify(gltf.nodes, null, 2));
}
