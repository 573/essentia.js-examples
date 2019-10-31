// Some utility functions used in the web app


function updateAppStatus(message) {
    document.getElementById('app-status').innerHTML = message;
}


function clearStatusMessage() {
    document.getElementById('app-status').innerHTML = "";
}


function error(message) {
    document.getElementById('app-status').innerHTML = 'Error:' + message;
}


function addSourceToAudioPlayer(url) {
    $("#audio-source").attr("src", url);
    $("#audio-div")[0].pause();
    $("#audio-div")[0].load();
    $("#audio-div")[0].oncanplaythrough = $("#audio-div")[0].pause();
    myAppSettings.audioLoaded = true;
}


function addToAudioPlayer(blob) {
    var blobUrl = URL.createObjectURL(blob);
    addSourceToAudioPlayer(blobUrl);
}


function getBlobFileContainer() {
    if ($('#file-menu')[0].files.length != 0) {
        return $("#file-menu")[0].files[0];
    } else {
        throw "Couldn't find any files in the filecontainer. Please upload your file again."
    };
}


function addProcessLoader() {
    var loaderDiv = "<div id='loader-div' class='ui active dimmer'><div class='ui text loader'>Computing</div></div>"
}


function checkUploadFileExtension(blob, allowedExtensions=["wav", "mp3", 'ogg']) {
    var filename_split = blob.name.split(".")
    var fileExt = filename_split[filename_split.length - 1];
    fState = $.inArray(fileExt, allowedExtensions) > -1;
    if (!fState) {
        alert('Incompatible audio file format! Only the following file formats are supported at the moment: \n [' + allowedExtensions.join(", ") + ', ]');
        throw "uploaded un-supported audio file format";
    }
}


function createAudioButtons() {
    var $input = $('<button id="play-btn" class="ui vertical red inverted centered button" onclick="wavesurfer.playPause()"><i class="play icon"></i>Play</button>');
    $input.appendTo($("#audio-obj"));
    var $stop = $('<button id="stop-btn" class="ui vertical red inverted centered button" onclick="wavesurfer.stop()"><i class="stop icon"></i>Stop</button>');
    $stop.appendTo($('#audio-obj'));
}

function removeAudioButtons() {
    $('#play-btn').remove();
    $('#stop-btn').remove();
}


// submit a local file from users disk using web ui
function uploadAudioFileFromMenu(fileContainer, uploadType, onLoadExtractor) {
    let reader = new FileReader();
    var blob;

    if (uploadType === 'popup') { 
        blob = fileContainer[0].files[0] 
    } else if (uploadType === 'dragndrop') { 
        blob = fileContainer; 
    };

    reader.readAsBinaryString(blob);
    checkUploadFileExtension(blob);

    if ((blob.size / 1024 / 1024) > FILE_UPLOAD_SIZE_LIMIT) {
        alert("Too big file to process! Please a upload a audio file less than " + FILE_UPLOAD_SIZE_LIMIT + "mb!");
        throw "Excedees maximum upload file size limit " + FILE_UPLOAD_SIZE_LIMIT + "mb!";
    }
   
    // addToAudioPlayer(blob);
    if (myAppSettings.audioLoaded) { removeAudioButtons() };
  
    var blobUrl = URL.createObjectURL(blob);
    // here we do the feature extraction and plotting offline using the callback function
    onLoadExtractor(blobUrl);
}


// encode to wav audio from channel data from recorder.js
function encodeWAV(samples) {
    var numChannels = 1;
    var sampleRate = 44100;

    function writeString(view, offset, string) {
        for (var i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    function floatTo16BitPCM(output, offset, input) {
        for (var i = 0; i < input.length; i++, offset += 2) {
            var s = Math.max(-1, Math.min(1, input[i]));
            output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        }
    }

    var buffer = new ArrayBuffer(44 + samples.length * 2);
    var view = new DataView(buffer);

    /* RIFF identifier */
    writeString(view, 0, 'RIFF');
    /* RIFF chunk length */
    view.setUint32(4, 36 + samples.length * 2, true);
    /* RIFF type */
    writeString(view, 8, 'WAVE');
    /* format chunk identifier */
    writeString(view, 12, 'fmt ');
    /* format chunk length */
    view.setUint32(16, 16, true);
    /* sample format (raw) */
    view.setUint16(20, 1, true);
    /* channel count */
    view.setUint16(22, numChannels, true);
    /* sample rate */
    view.setUint32(24, sampleRate, true);
    /* byte rate (sample rate * block align) */
    view.setUint32(28, sampleRate * 4, true);
    /* block align (channel count * bytes per sample) */
    view.setUint16(32, numChannels * 2, true);
    /* bits per sample */
    view.setUint16(34, 16, true);
    /* data chunk identifier */
    writeString(view, 36, 'data');
    /* data chunk length */
    view.setUint32(40, samples.length * 2, true);

    floatTo16BitPCM(view, 44, samples);

    return view;
}


function checkHostBrowser() {
    // Opera 8.0+
    var isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;

    // Firefox 1.0+
    var isFirefox = typeof InstallTrigger !== 'undefined';

    // Safari 3.0+ "[object HTMLElementConstructor]" 
    var isSafari = /constructor/i.test(window.HTMLElement) || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window['safari'] || (typeof safari !== 'undefined' && safari.pushNotification));

    // Internet Explorer 6-11
    var isIE = /*@cc_on!@*/false || !!document.documentMode;

    // Edge 20+
    var isEdge = !isIE && !!window.StyleMedia;

    // Chrome 1 - 71
    var isChrome = !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime);

    // Blink engine detection
    var isBlink = (isChrome || isOpera) && !!window.CSS;


    var output = 'Detecting browsers by ducktyping:<hr>';
    output += 'isFirefox: ' + isFirefox + '<br>';
    output += 'isChrome: ' + isChrome + '<br>';
    output += 'isSafari: ' + isSafari + '<br>';
    output += 'isOpera: ' + isOpera + '<br>';
    output += 'isIE: ' + isIE + '<br>';
    output += 'isEdge: ' + isEdge + '<br>';
    output += 'isBlink: ' + isBlink + '<br>';
    updateAppStatus(output);

    if (isFirefox) { return "firefox"};

    if (isChrome) { return "chrome" };

}


function jsonCopy(src) {
  return JSON.parse(JSON.stringify(src));
}


function getMostFreqElementArray(array)
{
    if(array.length == 0)
        return null;
    var modeMap = {};
    var maxIdx = 0;
    var maxEl = array[0], maxCount = 1;
    for(var i = 0; i < array.length; i++)
    {
        var el = array[i];
        if(modeMap[el] == null)
            modeMap[el] = 1;
        else
            modeMap[el]++;  
        if(modeMap[el] > maxCount)
        {
            maxEl = el;
            maxIdx = i;
            maxCount = modeMap[el];
        }
    }
    var outObj = {maxEl: maxEl, maxIdx: maxIdx};
    return outObj;
}


function transposeArray(matrix) {
  return matrix[0].map((col, i) => matrix.map(row => row[i]));
}


function logNorm(arr) {
    let normArr = arr.map(x => Math.log10(x) * 10);
    return normArr;
}


