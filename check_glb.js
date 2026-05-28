const fs = require('fs');

function readGlbAnimations(filename) {
    const buffer = fs.readFileSync(filename);
    const magic = buffer.readUInt32LE(0);
    if (magic !== 0x46546C67) { // "glTF"
        console.error("Not a GLB file");
        return;
    }

    const version = buffer.readUInt32LE(4);
    const length = buffer.readUInt32LE(8);
    
    // Read Chunk 0 (JSON)
    const jsonChunkLength = buffer.readUInt32LE(12);
    const jsonChunkType = buffer.readUInt32LE(16);
    
    if (jsonChunkType !== 0x4E4F534A) { // "JSON"
        console.error("First chunk is not JSON");
        return;
    }

    const jsonBuffer = buffer.slice(20, 20 + jsonChunkLength);
    const jsonStr = jsonBuffer.toString('utf-8');
    const gltf = JSON.parse(jsonStr);

    console.log("Found Animations:");
    if (gltf.animations) {
        gltf.animations.forEach((anim, i) => {
            console.log(`- ${anim.name || 'Unnamed Animation ' + i}`);
        });
    } else {
        console.log("No animations found in file.");
    }
}

readGlbAnimations(process.argv[2]);
