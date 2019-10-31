// Set functions to compute specific MIR features using essentia.js


// compute melody of a given audio data  using essentia PitchYin (std::vector<float>)
const computePitchYin = function(signal) {

    var frames = Module.frameGenerator(signal, 2048, 2048);
    var pitches = []
    var pitchConfidence;
    for (var i=0; i<frames.size(); i++) {
        var pitch = 0;
        var pc = 0;
        Module.pitchYin(frames.get(i), pitch, pc);
        pitches.push(pitch);
    }
    return pitches;
}


// compute melody of a given audio data  using essentia PitchYinProbabilistic (std::vector<float>)
const computePitchYinProbabilistic = function(signal) {
    var pitches = new Module.VectorFloat();
    var pitchConfidence = new Module.VectorFloat();
    Module.pitchProbabilisticYinExtractor(signal, pitches, pitchConfidence);
    var pitch = vec2typedFloat32Array(pitches);
    // bad hack: empty std::vectors manually
    pitches.resize(0, 1);
    pitchConfidence.resize(0, 1);
    return pitch;
}


// compute melody of a given audio data  using essentia PitchMelodia (std::vector<float>)
const computePitchMelody = function(signal) {
    var pitches = new Module.VectorFloat();
    var pitchConfidence = new Module.VectorFloat();
    Module.pitchMelodiaExtractor(signal, pitches, pitchConfidence);
    var pitch = vec2typedFloat32Array(pitches);
    // bad hack: empty std::vectors manually
    pitches.resize(0, 1);
    pitchConfidence.resize(0, 1);
    return pitch;
}


// compute predominant melody of a given audio data using essentia PredominantMelodia(std::vector<float>)
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



// compute key
const computeKey = function(signal) {

}


// compute chord descriptors
const computeChordFeatures = function(signal) {
    var chds = new Module.VectorString();
    var strg = new Module.VectorFloat();
    var chords = [];
    var strength = [];
    var frames = Module.frameGenerator(signal, 4096, 2048);
    for (var i=0; i < frames.size(); i++) {
        var wFrame = Module.windowing(frames.get(i), "blackmanharris62");
        var hpcp = Module.hpcp(wFrame, false);
        Module.chordExtractor(hpcp, 2048, chds, strg);
    }
    for (var i=0; i<chds.size(); i++) {
        chords.push(chds.get(i));
        strength.push(strg.get(i));
    }
    // bad hack: empty std::vectors manually
    strg.resize(0, 1);
    return {chords: chords, strength: strength};
}


// compute log-scaled mel bands of a given audio data (std::vector<float>)
const computeLogMelBands = function(signal) {
    var melbands = Module.logMelBandsExtractor(signal, 128, 1024, 1024);
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
    var frames = Module.frameGenerator(signal, 4096, 2048);
    var hpcpFrames = [];
    for (var i=0; i < frames.size(); i++) {
        var wFrame = Module.windowing(frames.get(i), "blackmanharris62");
        var hpcp = Module.hpcp(wFrame, true);
        var hpArray = vec2typedFloat32Array(hpcp);
        hpcpFrames.push(hpArray);
    }
    wFrame.resize(0, 1);
    hpcp.resize(0, 1);
    return hpcpFrames;
}


// compute vickers loudness of a given audio data (std::vector<float>)
const computeLoudnessVickers = function(signal) {
    var loudness = Module.loudnessVickers(signal);
    return loudness;
}


// compute beat tracking
const computBeatTrackerMultiFeature = function(signal) {
    var ticks = new Module.VectorFloat();
    var confidence = 0.;
    Module.beatTrackerMultiFeature(signal, ticks, confidence);
    var beatTicks = vec2typedFloat32Array(ticks);
    console.log('confidence: ', confidence);
    // bad hack to free the vectors
    ticks.resize(0, 1);
    return beatTicks;
}


// compute danceability
const computeDanceability = function(signal) {
    var danceability = 0.
    danceability = Module.danceability(signal);
    return danceability;
}


// compute onset detection
const computeOnsetsGlobal = function(signal) {
    var onsets = Module.onsetDetectionGlobal(signal);
    var beatOnsets = vec2typedFloat32Array(onsets);
    // bad hack to free the vectors
    onsets.resize(0, 1);
    return beatOnsets;
}


// log mel bands
const computeLogMelSpectrogram = function(signal, numBands) {
    var frames = Module.frameGenerator(signal, 2048, 1024);
    var logMelbandFrames = [];
    for (var i=0; i < frames.size(); i++) {
        var wFrame = Module.windowing(frames.get(i), "hann");
        var spectrum = Module.spectrum(wFrame);
        var logBand = Module.logMelBands(spectrum, numBands);
        var melBandFrame = vec2typedFloat32Array(logBand);
        logMelbandFrames.push(melBandFrame);
    }
    wFrame.resize(0, 1);
    spectrum.resize(0, 1);
    logBand.resize(0, 1);
    return logMelbandFrames;
}



