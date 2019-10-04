// Set functions to compute specific MIR features using essentia.js


// compute predominant melody of a given audio data (std::vector<float>)
const computePreDominantMelody = function(signal) {
    var pitches = new Module.VectorFloat();
    var pitchConfidence = new Module.VectorFloat();
    Module.predominantPitchMelodiaExtractor(signal, pitches, pitchConfidence);
    var pitch = vec2typedFloat32Array(pitches);
    // bad hack: empty std::vectors manually
    pitches.resize(0, 1);
    pitchConfidence.resize(0, 1);
    return pitch;
}


// compute log-scaled mel bands of a given audio data (std::vector<float>)
const computeLogMelBands = function(signal) {
    var melbands = Module.logMelBandsExtractor(signal, 1028, 1028);
    var mbands = vec2typedFloat32Array(melbands);
    // bad hack: empty std::vectors manually
    melbands.resize(0,1);
    return mbands;
}


// compute bpm histogram of a given audio data (std::vector<float>)
const computeBpmHistogram = function(signal) {
    var bpmEst = new Module.VectorFloat();
    var bpmHist = new Module.VectorFloat();
    Module.bpmHistogram(signal, bpmEst, bpmHist);
    var bpmHistogram = vec2typedFloat32Array(bpmHist);
    // bad hack: empty std::vectors manually
    bpmHist.resize(0, 1);
    bpmEst.resize(0, 1);
    return bpmHistogram;
}


// compute hpcp chroma features of a given audio data (std::vector<float>)
const computeChromaHpcp = function(signal) {
    var frames = Module.frameCutter(signal, 4096, 4096, "blackmanharris62");
    var hpcpFrames = [];
    for (var i=0; i < frames.size(); i++) {
        var hpcp = Module.hpcp(frames.get(i), true);
        var hpArray = vec2typedFloat32Array(hpcp);
        hpcpFrames.push(hpArray);
    }
    return hpcpFrames;
}


// compute vickers loudness of a given audio data (std::vector<float>)
const computeLoudnessVickers = function(signal) {
    var loudness = Module.loudnessVickers(signal);
    return loudness;
}

