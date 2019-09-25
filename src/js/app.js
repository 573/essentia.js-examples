/*

*/
var recordButton = $("recordButton");
var stopButton = $("stopButton");
var recBlob;
let sampleFreesoundUri = "https://freesound.org/data/previews/0/515_319-lq.mp3";
let recorder = null;
let recAudio = null;
let recAudioChunks = [];
let fileAudioBuffer = null;
let recAudioBuffer = null;
let urlAudioBuffer = null;
var recStream = null;


// global js object for the web app
let appStatus = {
                  audioLoaded: false, 
                  realtime: false,
                  uploadMode: 'mic', // {'mic', 'file'}
                  audioChanged: false,
                  isRecording: false,
                  isPlotCached: {
                      melody: false,
                      chroma: false,
                      bpmHistogram: false
                  },
                };


function recordAudioWaveSurf() {
    if (!appStatus.isRecording) {
      
        if (appStatus.audioLoaded) { removeAudioButtons(); };

        wavesurfer.microphone.on('deviceReady', function (stream) {
            appStatus.isRecording = true;
            $('#recordButton').html('Stop &nbsp;&nbsp;<i class="stop icon"></i>');
            $("#recordButton").prop("disabled", false);
            // console.log('Microphone device ready ..');
            console.log('Microphone device ready ..', stream);
            // recStream = stream;
        });
        wavesurfer.microphone.start();        
    }
    else {
        wavesurfer.microphone.stopDevice();
        wavesurfer.microphone.destroy();
        appStatus.isRecording = false;
        $("#recordButton").prop("disabled", false);
        $("#recordButton").html('Record &nbsp;&nbsp;<i class="microphone icon"></i>');
        console.log("Stopped recording and close the device ...");
    }
}


function loadSoundFromUri(url) {
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';

    // Decode asynchronously
    request.onload = function() {
        audioCtx.decodeAudioData(request.response, function(buffer) {
        urlAudioBuffer = buffer;
    });
    }
    request.send();
}


getTrackFromMedia = function(audioElement) {
    const track = audioContext.createMediaElementSource(audioElement);
    return track;
}


// adapted from https://gist.github.com/bryanjenningz/f60c42b0a2091c91bad21c91faadc88d
const recordAudio = () =>
  new Promise(async resolve => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.addEventListener("dataavailable", event => {
      recAudioChunks.push(event.data);
    });
    const start = () => mediaRecorder.start();
    const stop = () =>
      new Promise(resolve => {
        mediaRecorder.addEventListener("stop", () => {
          const audioBlob = new Blob(recAudioChunks);
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          // plot stuffs here
          const play = () => audio.play();
          // addSourceToAudioPlayer(audio);
          resolve({ audioBlob, audioUrl, play});
        });
        mediaRecorder.stop();
      });
    resolve({ start, stop });
});


const recordStop = async () => {

  if (recorder) {
    recAudio = await recorder.stop();
    recorder = null;
    // add recorded audio to viz
    wavesurfer.load(recAudio.audioUrl);
    if (appStatus.audioLoaded) { removeAudioButtons(); };
    createAudioButtons();
    appStatus.audioLoaded = true;
    // addSourceToAudioPlayer(recAudio.audioUrl);
    // $("#audio-div").show();
    // $("#recordButton").prop("disabled", false);
    // $("#recordButton").html('Record &nbsp;&nbsp;<i class="microphone icon"></i>');
  } else {
    recorder = await recordAudio();
    recorder.start();
    // $('#recordButton').html('Stop &nbsp;&nbsp;<i class="stop icon"></i>');
    // $("#recordButton").prop("disabled", false);
  }
};


// self-explanatory
addSourceToAudioPlayer = function(url) {
    $("#audio-source").attr("src", url);
    $("#audio-div")[0].pause();
    $("#audio-div")[0].load();
    $("#audio-div")[0].oncanplaythrough = $("#audio-div")[0].pause();
    appStatus.audioLoaded = true;
}


// self-explanatory
addToAudioPlayer = function(blob) {
    var blobUrl = URL.createObjectURL(blob);
    addSourceToAudioPlayer(blobUrl);
}


getBlobFileContainer = function() {
    if ($('#file-menu')[0].files.length != 0) {
        return $("#file-menu")[0].files[0];
    }
    else {
        throw "Couldn't find any files in the filecontainer. Please upload your file again."
    }
}


// self-explanatory
checkUploadFileExtension = function(blob, allowedExtensions=["wav", "mp3", 'ogg']) {
    var filename_split = blob.name.split(".")
    var fileExt = filename_split[filename_split.length - 1];
    fState = $.inArray(fileExt, allowedExtensions) > -1;
    if (!fState) {
        alert('Incompatible audio file format! Only the following file formats are supported at the moment: \n [' + allowedExtensions.join(", ") + ', ]');
        throw "uploaded un-supported audio file format";
    }
}


createAudioButtons = function() {
    var $input = $('<button id="play-btn" class="ui vertical red inverted centered button" onclick="wavesurfer.playPause()"><i class="play icon"></i>Play</button>');
    $input.appendTo($("#audio-obj"));
    var $stop = $('<button id="stop-btn" class="ui vertical red inverted centered button" onclick="wavesurfer.stop()"><i class="stop icon"></i>Stop</button>');
    $stop.appendTo($('#audio-obj'));

}

removeAudioButtons = function() {
    $('#play-btn').remove();
    $('#stop-btn').remove();
}


// submit a local file from users disk using web ui
uploadAudioFileFromMenu = function(fileContainer, uploadType) {
    let reader = new FileReader();
    var blob;

    if (uploadType === 'popup') { 
    	blob = fileContainer[0].files[0] 
    }
    else if (uploadType === 'dragndrop') { 
    	blob = fileContainer; 
    }

    reader.readAsBinaryString(blob);
    checkUploadFileExtension(blob);

    if ((blob.size / 1024 / 1024) > FILE_UPLOAD_LIMIT) {
        alert("Too big file to process! Please a upload a audio file less than " + FILE_UPLOAD_LIMIT + "mb!");
        throw "Excedees maximum upload file size limit " + FILE_UPLOAD_LIMIT + "mb!";
    }
   
    // addToAudioPlayer(blob);
    wavesurfer.loadBlob(blob);
    if (appStatus.audioLoaded) { removeAudioButtons(); };
    createAudioButtons();
    appStatus.audioLoaded = true;
    console.log("file uploaded succesfully");
    // $("#audio-div").show();
    // here we do the feature extraction callback process if needed

}

assertAudioLoadedMessage = function() {
    if (!appStatus.audioLoaded) {
    }
}


