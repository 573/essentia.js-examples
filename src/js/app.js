// A simple web app using essentia.js

// global js object for the web app settings and event states
let myAppSettings = {
                      // category of demo {'pitch', 'rhythm', 'dynamics'}
                      category: null,
                      audioContext: null,
                      // global mic stream object for the audio recording
                      gumStream: null,
                      // buffer size for mic stream processing using webAudioApi
                      bufferSize: 8192,
                      sampleRate: 44100,
                      recorder: null,
                      // temp array to store the chunks of audio buffers in a recording session
                      recordedAudioBuffer: [],
                      // float 32 array for the total recorded audio data from a mic stream
                      recordedAudioData: null,
                      recordedAudioDataLength: null,
                      recordedAudioDuration: null,
                      // state to check if an audio is loaded in the app front-end 
                      audioLoaded: false, 
                      realtime: false,
                      // mode of audio input for feature extraction (whether using realtime mic or offlline file upload)
                      uploadMode: 'mic', // {'mic', 'file'},
                      uploadAudioVector: null,
                      uploadAudioData: null,
                      uploadAudioDataLength: null,
                      uploadAudioDuration: null,
                      audioChanged: false,
                      isRecording: false,
                      stopRecord: false,
                      /*// states to check whether to initiate plotly graph instances
                      initiatePlot: {
                          melody: true,
                      },
                      // states to check whether to plot the audio features in the front-end
                      doPlot: {
                          melody: true,
                      },*/
                      cacheFeatures: {},
                      reloadPage: false,
                      // For dev env, freesound soud uri for testing 
                      testAudioUri: "https://freesound.org/data/previews/328/328857_230356-lq.mp3",
};


var myRecorder; // for recorder.js object
// test audio
let testAudioBuffer = null;
let recordedAudioBlob;


// Visualize realtime microphone audio input on the pre-configured html div using wavesurfer.js 
function realtimeAudioVizWaveSurf() {
    if (!myAppSettings.isRecording) {

        if (myAppSettings.audioLoaded) { removeAudioButtons(); };

        wavesurfer.microphone.on('deviceReady', function (stream) {
            myAppSettings.isRecording = true;
            console.log('Microphone device ready ..');
            // console.log('Microphone device ready ..', stream);
            // recStream = stream;
        });
        wavesurfer.microphone.start();        
    }
}


function loadAudioFromUriAsAudioBuffer(url) {
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';

    // Decode asynchronously
    request.onload = function() {
        audioCtx.decodeAudioData(request.response, function(buffer) {
        testAudioBuffer = buffer;
    });
    }
    request.send();
}


// record native microphone input and do further audio processing on each audio buffer using the given callback functions
// TODO: replace the web audio api scriptProcessor with audio worklets once it has more support various web browsers 
function startMicRecordStream(bufferSize, onProcessCallback, callback) {

    // visualize audio streams from the microphone
    wavesurfer.microphone.on('deviceReady', function (stream) {
        myAppSettings.isRecording = true;
        console.log('Microphone visualizer ready ..');
    });

    $('#info-msg').hide();
    wavesurfer.microphone.start();
    // cross-browser support for getUserMedia
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;           
    window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL

    if (navigator.getUserMedia) {
        console.log('Initializing audio...')

        navigator.getUserMedia({audio: true, video: false}, function(stream) {

            // assign global gumstream
            myAppSettings.gumStream = stream;
            // clear the audiodata from the previous recording session
            if (myAppSettings.recordedAudioData) { myAppSettings.recordedAudioData.length = 0 };

            if (myAppSettings.gumStream.active) { 
                myAppSettings.uploadMode = 'mic';
                console.log('Audio context sample rate = ' + audioCtx.sampleRate);
                var mic = audioCtx.createMediaStreamSource(stream);

                // We need the buffer size that is a power of two 
                if ((bufferSize % 2) != 0 || bufferSize < 4096) {
                    error("* Wrong stream buffer size");
                    throw "Choose a buffer size that is a power of two and greater than 4096"
                };
                // In most platforms where the sample rate is 44.1 kHz or 48 kHz, 
                // and the default bufferSize will be 4096, giving 10-12 updates/sec.
                console.log('Buffer size = ' + bufferSize);
                const scriptNode = audioCtx.createScriptProcessor(bufferSize, 1, 1);
                // onprocess callback
                scriptNode.onaudioprocess = onProcessCallback;
                // adapted from crema.js code
                // It seems necessary to connect the stream to a sink for the pipeline to work, contrary to documentataions.
                // As a workaround, here we create a gain node with zero gain, and connect temp to the system audio output.
                const gain = audioCtx.createGain();
                gain.gain.setValueAtTime(0, audioCtx.currentTime);
                mic.connect(scriptNode);
                scriptNode.connect(gain);
                gain.connect(audioCtx.destination);

                if (audioCtx.state !== 'running') {
                  // user gesture (like click) is required to start the webAudioApi AudioContext, in some browser versions
                  updateAppStatus('<a href="javascript:resumeAudioCtx();" style="color:red;">* Click here to resume the audio engine *</a>');
                }; 

                if (callback) { callback() };

            } else error("* No mic stream");
      }, function(message) {
        error("* No mic access!")
        console.log('Could not access microphone - ' + message);
      });
    } else {console.log('Could not access microphone - getUserMedia not available'); error("* getUserMedia not available") };

}


// from recorder.js
function mergeBuffers(recBuffers, recLength) {
    var result = new Float32Array(recLength);
    var offset = 0;
    for (var i = 0; i < recBuffers.length; i++) {
        result.set(recBuffers[i], offset);
        offset += recBuffers[i].length;
    }
    return result;
}


function stopMicRecordStream() {

    console.log("Stopped recording ...");
    // stop mic stream viz
    wavesurfer.microphone.stopDevice();
    wavesurfer.microphone.destroy();

    // stop the actual mic stream
    myAppSettings.stopRecord = true;
    myAppSettings.isRecording = false;
    myAppSettings.gumStream.getAudioTracks()[0].stop();

    // assign the whole recorded audio stream by merging the collected buffers
    myAppSettings.recordedAudioData = mergeBuffers(myAppSettings.recordedAudioBuffer, 
                                      myAppSettings.bufferSize * myAppSettings.recordedAudioBuffer.length);

    myAppSettings.recordedAudioDataLength = myAppSettings.recordedAudioData.length;

    myAppSettings.recordedAudioDuration = myAppSettings.recordedAudioData.length / myAppSettings.sampleRate;

    // encode the audio data into blob element
    var blobData = encodeWAV(myAppSettings.recordedAudioData);
    var blob = new Blob([blobData], { type:'audio/wav' });
    myAppSettings.recordedAudioBlob = blob;

    // render audio to div for viz
    wavesurfer.loadBlob(blob);
    // create playback ctrl buttons
    if (myAppSettings.audioLoaded) { removeAudioButtons(); };
    createAudioButtons();
    myAppSettings.audioLoaded = true;

    // clear recorded buffer data
    myAppSettings.recordedAudioBuffer.length = 0;
    myAppSettings.recordedAudioData.length = 0;

    $("#recordButton").removeClass('recording');
    $("#recordButton").html('Record &nbsp;&nbsp;<i class="microphone icon"></i>');
}


// callback function to do feature extraction and plotting on mic input streams
function onRecordAudioFeatureExtractor(event) {

    if (myAppSettings.reloadPage) {
        window.location.reload();
    }

    if (myAppSettings.isRecording) {
    
        myAppSettings.recordedAudioBuffer.push(event.inputBuffer.getChannelData(0)); 
        // convert the float32 audio data into std::vector<float> for using essentia algos 
        var bufferSignal = typedFloat32Array2Vec(event.inputBuffer.getChannelData(0));

        if (!bufferSignal) { throw "onRecordingError: empty audio signal input found!"};

        if (myAppSettings.category === 'pitch') {
            onRecordProcessPitchCategory(bufferSignal);
        }
        if (myAppSettings.category === "rhythm") { 
            console.log(Module.danceability(bufferSignal));
            onRecordProcessRhythmCategory(bufferSignal);
        }
        if (myAppSettings.category === "tonal") { 
            onRecordProcessTonalCategory(bufferSignal);
        }
        if (myAppSettings.category === "dynamics") { 
            onRecordProcessDynamicsCategory(bufferSignal);
        }
        if (myAppSettings.category === "spectral") { 
            onRecordProcessSpectralCategory(bufferSignal);
        }
    }
}


// callback function to do feature extraction and plotting of an offline uploaded audio file
function onFileUploadAudioFeatureExtractor(url) {

    if (myAppSettings.reloadPage) {
        window.location.reload();
    }

    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';

    // Decode asynchronously
    request.onload = function() {
        audioCtx.decodeAudioData(request.response, function(buffer) {

            myAppSettings.uploadAudioDuration = buffer.duration;

            if (buffer.duration > FILE_UPLOAD_DURATION_LIMIT) {
                alert("Too long audio file to process! Please a upload a audio file less than " + FILE_UPLOAD_DURATION_LIMIT + " seconds");
                throw "Excedees maximum duration of audio file upload of: " + FILE_UPLOAD_DURATION_LIMIT + " seconds";
            }

            wavesurfer.load(url);
            createAudioButtons();
            myAppSettings.audioLoaded = true;
            console.log("file uploaded ...");
            updateAppStatus("* file uploaded ...");
            updateAppStatus("* computing features ...")

            myAppSettings.uploadAudioDataLength = buffer.getChannelData(0).length;
            myAppSettings.uploadAudioData = buffer.getChannelData(0);
            var signal = typedFloat32Array2Vec(myAppSettings.uploadAudioData);
            myAppSettings.uploadAudioVector = signal;

            var sTime = performance.now();

            if (myAppSettings.category === "pitch") { 
                onFileUploadProcessPitchCategory(signal);
            }

            if (myAppSettings.category === "rhythm") { 
                onFileUploadProcessRhythmCategory(signal); 
            }

            if (myAppSettings.category === "tonal") { 
                onFileUploadProcessTonalCategory(signal);
            }

            if (myAppSettings.category === "dynamics") { 
                onFileUploadProcessDynamicsCategory(signal);
            }

            if (myAppSettings.category === "spectral") { 
                onFileUploadProcessSpectralCategory(signal);
            }

            var eTime = performance.now();
            console.log('Feature computation and plotting done in ' + (eTime - sTime).toFixed(2) + ' ms');

            myAppSettings.reloadPage = true;
            updateAppStatus("* done ...");
        });
    }
    request.send();
}


function onRecordProcessPitchCategory(bufferSignal) {

    if (myAppSettings.doPlot.pyin) { 
        var pitches = computePitchYinProbabilistic(bufferSignal);
        plotMelodyContour(pitches, myDataVizSettings.pyin, 'pyin-div', 'PitchYinProbabilistic');
    }   
}


function onFileUploadProcessPitchCategory(signal) {

    if (myAppSettings.doPlot.pyin) { 
        var pitches = computePitchYinProbabilistic(myAppSettings.uploadAudioVector);
        plotMelodyContour(pitches, myDataVizSettings.pyin, 'pyin-div', 'PitchYinProbabilistic');
    }   
}


function onRecordProcessTonalCategory(bufferSignal) {

    if (myAppSettings.doPlot.chords) {
        var chordFeats = computeChordFeatures(bufferSignal);
        onRecordChordPlot(chordFeats, myAppSettings.initiatePlot.chords, 'chord-div', 'ChordDetection');
    }

    if (myAppSettings.doPlot.hpcp) { 
        var chrom = computeChromaHpcp(bufferSignal);   
        plotChromaHeatmap(chrom, myAppSettings.initiatePlot.hpcp, myDataVizSettings.hpcp, 'hpcp-div', 'Harmonic Pitch Class Profile (HPCP)');
    }
}


function onFileUploadProcessTonalCategory(signal) {

    if (myAppSettings.doPlot.hpcp) { 
        var chrom = computeChromaHpcp(signal);    
        plotChromaHeatmap(chrom, myAppSettings.initiatePlot.hpcp, myDataVizSettings.hpcp, 'hpcp-div', 'Harmonic Pitch Class Profile (HPCP)');
    }   
}


function onRecordProcessRhythmCategory(bufferSignal) {

    if (myAppSettings.doPlot.danceability) {
        var danceability = computeDanceability(myAppSettings.uploadAudioVector);
        plotSingleValueData(danceability, myAppSettings.initiatePlot.danceability, 'danceability-div', 'Danceability');
    }
}

function onFileUploadProcessRhythmCategory(signal) {

    if (myAppSettings.doPlot.beatTracker) {
        var beats = computBeatTrackerMultiFeature(signal);
        var dataObj = {
            ticks: beats,
        }
        plotTimeSeriesOverlayAudio(dataObj, myAppSettings.initiatePlot.beatTracker, myDataVizSettings.beatTracker, 'beattracker-div', 'BeatTrackerMultiFeature');
    }   
}

function onRecordProcessDynamicsCategory(bufferSignal) {

    if (myAppSettings.doPlot.loudnessVickers) { 
        var vickersLoudness = computeLoudnessVickers(bufferSignal);    
        plotLoudness(vickersLoudness, myAppSettings.initiatePlot.loudnessVickers, 'loudnessvickers-div');
    }   
}

function onFileUploadProcessDynamicsCategory(signal) {

    if (myAppSettings.doPlot.loudnessVickers) { 
        var vickersLoudness = computeLoudnessVickers(signal);    
        plotLoudness(vickersLoudness, myAppSettings.initiatePlot.loudnessVickers, 'loudnessvickers-div');
    }   
}


function onRecordProcessSpectralCategory(bufferSignal) {

    if (myAppSettings.doPlot.logMelSpectrogram) { 
        var logMelSpect = computeLogMelSpectrogram(bufferSignal, 128);
        plotSpectrogram(logMelSpect, myAppSettings.initiatePlot.logMelSpectrogram, myDataVizSettings.logMelSpectrogram, 'logmelbands-div', 'LogMelSpectrogram'); 
    }   
}

function onFileUploadProcessSpectralCategory(signal) {

    if (myAppSettings.doPlot.logMelSpectrogram) { 
        // 128 mel bands
        var logMelSpect = computeLogMelSpectrogram(signal, 128); 
        plotSpectrogram(logMelSpect, myAppSettings.initiatePlot.logMelSpectrogram, myDataVizSettings.logMelSpectrogram, 'logmelbands-div', 'LogMelSpectrogram');   
    }   
}


