const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const os = require('os');
const fs = require('fs');
const ffmpegStatic = require('ffmpeg-static');

ffmpeg.setFfmpegPath(ffmpegStatic);

const watermarkAudioFile = async (inputBuffer, inputMime) => {
    const tempInput = path.join(os.tmpdir(), `input-${Date.now()}.wav`);
    const beepPath = path.join(os.tmpdir(), `beep-${Date.now()}.wav`);
    const tempOutput = path.join(os.tmpdir(), `output-${Date.now()}.wav`);

    // Write input buffer to temp file
    fs.writeFileSync(tempInput, inputBuffer);

    // Generate a short beep (440 Hz for 0.5s)
    await new Promise((resolve, reject) => {
        ffmpeg()
            .input('sine=frequency=440:duration=0.5')
            .inputFormat('lavfi')
            .audioCodec('pcm_s16le')
            .audioFrequency(44100)
            .save(beepPath)
            .on('end', resolve)
            .on('error', reject);
    });

    // Mix the beep at the start of the input audio
    await new Promise((resolve, reject) => {
        ffmpeg()
            .input(tempInput)
            .input(beepPath)
            .complexFilter(['[0:a][1:a]amix=inputs=2:duration=first:dropout_transition=3'])
            .audioCodec('pcm_s16le')
            .save(tempOutput)
            .on('end', resolve)
            .on('error', reject);
    });

    const outputBuffer = fs.readFileSync(tempOutput);

    // Cleanup
    [tempInput, beepPath, tempOutput].forEach(f => {
        try { fs.unlinkSync(f); } catch (e) { }
    });

    return outputBuffer;
};

module.exports = { watermarkAudioFile };