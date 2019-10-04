// A simple web app using essentia.js


// global js object for the web app settings and event states
let myAppSettings = {
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
                      uploadAudioDataLength: null,
                      uploadAudioDuration: null,
                      audioChanged: false,
                      isRecording: false,
                      stopRecord: false,
                      // states to check whether to initiate plotly graph instances
                      initiatePlots: {
                          melody: true,
                          chroma: true,
                          bpmHistogram: true,
                          loudness: true,
                          key: true,
                          logMelBands: true,
                      },
                      // states to check whether to plot the audio features in the front-end
                      doPlot: {
                          melody: false,
                          chroma: false,
                          bpmHistogram: true,
                          key: false,
                          loudness: true,
                          logMelBands: true,
                      },
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
                    error("* Wrong buffer size");
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
    // stop viz
    wavesurfer.microphone.stopDevice();
    wavesurfer.microphone.destroy();

    // stop the stream
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

    if (myAppSettings.isRecording) {
    
        myAppSettings.recordedAudioBuffer.push(event.inputBuffer.getChannelData(0)); 
        // convert the flaot32 audio data into std::vector<float> for using essentia algos 
        var bufferSignal = typedFloat32Array2Vec(event.inputBuffer.getChannelData(0));

        // compute features and update the plot if the user has activated it in the front-end
        if (myAppSettings.doPlot.melody) {
            // compute melody contours
            var pitches = computePreDominantMelody(bufferSignal);
            // plot the graph
            onRecordPlotMelody(pitches, offlineMelodyPlot);

        }

        if (myAppSettings.doPlot.logMelBands) {
            var melBands = computeLogMelBands(bufferSignal);
            // plot
            onRecordPlotLogMelBands(melBands, offlineLogMelBandsPlot);
        };

        if (myAppSettings.doPlot.loudness) {
            var loud = computeLoudnessVickers(bufferSignal);
            // plot
            onRecordPlotLoudness(loud, offlineLoudnessPlot);
        };

        if (myAppSettings.doPlot.bpmHistogram) {
            var bpmHist = computeBpmHistogram(bufferSignal);
            onRecordHistogramPlot(bpmHist, offlineBpmHistogramPlot);
        }

        if (myAppSettings.doPlot.chroma) {
            var hpcpFrames = computeChromaHpcp(bufferSignal);
            onRecordHpcpPlot(hpcpFrames, offlineHpcpPlot);
        }

    }
}


// callback function to do feature extraction and plotting of an offline uploaded audio file
function onFileUploadAudioFeatureExtractor(url) {
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
            $('#loader-div').hide();
            wavesurfer.load(url);
            createAudioButtons();
            myAppSettings.audioLoaded = true;
            console.log("file uploaded ...");
            updateAppStatus("* file uploaded ...");
            updateAppStatus("* computing features ...")

            myAppSettings.uploadAudioDataLength = buffer.getChannelData(0).length;

            var signal = typedFloat32Array2Vec(buffer.getChannelData(0));

            if (myAppSettings.doPlot.melody) { 

                var pitches = computePreDominantMelody(signal);
                offlineMelodyPlot(pitches);
            }

            if (myAppSettings.doPlot.bpmHistogram) {

                var bpmHist = computeBpmHistogram(signal);
                offlineBpmHistogramPlot(bpmHist);
            }

            if (myAppSettings.doPlot.chroma) {

                var hpcpFrames = computeChromaHpcp(signal);
                offlineHpcpPlot(hpcpFrames);
            }

            if (myAppSettings.doPlot.logMelBands) {
                var melBands = computeLogMelBands(signal);
                // plot
                offlineLogMelBandsPlot(melBands);
            };

            if (myAppSettings.doPlot.loudness) {
                var loud = computeLoudnessVickers(signal);
                // plot
                offlineLoudnessPlot(loud);
            }


    });
    }
    request.send();
}



// var recBlob;
// let recorder = null;
// let recAudio = null;
// let recAudioChunks = [];
// var recStream = null;
// // adapted from https://gist.github.com/bryanjenningz/f60c42b0a2091c91bad21c91faadc88d
// const recordAudio = () =>
//   new Promise(async resolve => {
//     const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//     const mediaRecorder = new MediaRecorder(stream);
//     mediaRecorder.addEventListener("dataavailable", event => {
//       recAudioChunks.push(event.data);
//     });
//     const start = () => mediaRecorder.start();
//     const stop = () =>
//       new Promise(resolve => {
//         mediaRecorder.addEventListener("stop", () => {

//           const audioBlob = new Blob(recAudioChunks);
//           const audioUrl = URL.createObjectURL(audioBlob);
//           const audio = new Audio(audioUrl);
//           // plot stuffs here
//           const play = () => audio.play();
//           // addSourceToAudioPlayer(audio);
//           resolve({ audioBlob, audioUrl, play});
//         });
//         mediaRecorder.stop();
//       });
//     resolve({ start, stop });
// });


// const recordStop = async () => {

//   if (recorder) {
//     recAudio = await recorder.stop();
//     recorder = null;
//     // add recorded audio to viz
//     wavesurfer.load(recAudio.audioUrl);
//     if (myAppSettings.audioLoaded) { removeAudioButtons(); };
//     createAudioButtons();
//     myAppSettings.audioLoaded = true;
//     // addSourceToAudioPlayer(recAudio.audioUrl);
//     // $("#audio-div").show();
//     // $("#recordButton").prop("disabled", false);
//     // $("#recordButton").html('Record &nbsp;&nbsp;<i class="microphone icon"></i>');
//   } else {
//     recorder = await recordAudio();
//     recorder.start();
//     // $('#recordButton').html('Stop &nbsp;&nbsp;<i class="stop icon"></i>');
//     // $("#recordButton").prop("disabled", false);
//   }
// };
