

var resultTabContainers = ['melody-div', 'key-div', 'bpm-div', 'loudness-div', 'mfcc-div']

createCanvasOnDiv = function(divId, chartId) {
    var canvas = document.createElement('canvas');
    var chartDiv = document.getElementById(divId);
    canvas.id = chartId;
    canvas.display = 'block';
    canvas.height = '100%';
    chartDiv.appendChild(canvas);
    chartJsCtx = document.getElementById(chartId).getContext('2d');
}


deleteCanvas = function() {
    $('canvas:nth-of-type(1)').remove();
}


format1dDataToChartJsFormat = function(data, audioLength) {
    audioTimes = makeLinSpace(0, audioLength / 44100., data.length);
    return formatTwoArrays2ObjectArrays(audioTimes, data);
}


makeLinSpace = function(a,b,n) {
    if(typeof n === "undefined") n = Math.max(Math.round(b-a)+1,1);
    if(n<2) { return n===1?[a]:[]; }
    var i,ret = Array(n);
    n--;
    for(i=n;i>=0;i--) { ret[i] = (i*b+(n-i)*a)/n; }
    return ret;
}


formatTwoArrays2ObjectArrays = function(arrayOne, arrayTwo) {
    var outArray = new Array(arrayOne.length);
    for (var i=0; i<arrayOne.length; i++) {
      outArray[i] = {"x": arrayOne[i], "y": arrayTwo[i]};
    }
    return outArray;
}


let myDataVizSettings = {
    melody: {
        startTimeIndex: 0
    },
    chroma: {
        startTimeIndex: 0
    },
}


const convertTypedArray2JsArray = function(typedArray) {
    var array =  Array.prototype.slice.call(typedArray);
    return array;
}


function offlineHpcpPlot(hpcpArray) {

    var layout = {
        title: "Harmonic Pitch Class Profile (HPCP)",
        plot_bgcolor: "transparent",
        paper_bgcolor:"#FCF7F7",
        autosize: false,
        width: 670,
        height: 290,
        xaxis: {},
        yaxis: {},
    };

    var colorscaleValue = [
        [0, '#3D9970'],
        [1, '#001f3f']
    ];

    var chromaBins = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    var timeAxis = makeLinSpace(myDataVizSettings.chroma.startTimeIndex, 
        myAppSettings.uploadAudioDataLength / myAppSettings.sampleRate, 
        hpcpArray.length);

    var data = {
        x: timeAxis,
        y: chromaBins,
        z: hpcpArray,
        type: 'heatmap',
        // colorscale: colorscaleValue,
        //showscale: false,
    };

    console.log("myFristCall");

    Plotly.newPlot('chroma-div', [data], layout);
}


function onRecordHpcpPlot(hpcpFrames, callback) {

    var hpcpArray = [];
    for (var i=0; i<hpcpFrames.length; i++) {
        hpcpArray.push(convertTypedArray2JsArray(hpcpFrames[i])); 
    }

    if (myAppSettings.initiatePlots.chroma) {
        callback(hpcpArray);
        myAppSettings.initiatePlots.chroma = false;
    } else {
      var timeAxis = makeLinSpace(myDataVizSettings.chroma.startTimeIndex,
          myAppSettings.recordedAudioDataLength, hpcpArray.length);

      myDataVizSettings.chroma.startTimeIndex = timeAxis[timeAxis.length-1];

      Plotly.extendTraces('melody-div', {
          x: [[timeAxis]],
          z: [[hpcpArray]],
      }, [0]);
    }


}


function offlineBpmHistogramPlot(bpmHist) {
    var layout = {
        title: {
            text: "BPM Histogram (Essentia RhythmDescriptors)",
        },
        plot_bgcolor: "transparent",
        paper_bgcolor:"#FCF7F7",
        autosize: false,
        width: 670,
        height: 290,
        marker: {
            color: '#2B6FAC'
        },
        xaxis: {
            range: [0, 250],
            title: "BPM"
        },
        yaxis: {
            autorange: true,
            gridwidth: 1,
        },
        bargap: 0.01,
    };

    // var bpms = makeLinSpace(0, bpmHist[bpmHist.length-1], bpmHist.length);
    var data = {
        // x: bpms,
        y: bpmHist,
        type: 'bar'
    };

    Plotly.newPlot('bpm-div', [data], layout);
}


function onRecordHistogramPlot(bpmHist, callback) {

    // var bpmHistArray = convertTypedArray2JsArray(bpmHist);
    if (myAppSettings.initiatePlots.bpmHistogram) {
        callback(bpmHist);
        myAppSettings.initiatePlots.melody = false;
    } else {
        // var timeAxis = makeLinSpace(myDataVizSettings.melody.startTimeIndex,
        //     myAppSettings.recordedAudioDataLength, pitchArray.length);

        Plotly.restyle('bpm-div', {
            // x: [[timeAxis]],
            y: [bpmHist],
        });
    }
}


function offlineMelodyPlot(pitchValues) {

    var layout = {
        title: "Predominant Melody Contour (Melodia)",
        plot_bgcolor: "transparent",
        paper_bgcolor:"#FCF7F7",
        autosize: false,
        width: 670,
        height: 290,
        xaxis: {
            type: "time",
            title: "Time"
        },
        yaxis: {
            autorange: true,
            range: [0, 1500],
            type: "linear",
            title: "Frequency (Hz)"
        }
    };

    var timeAxis = makeLinSpace(myDataVizSettings.melody.startTimeIndex, 
        myAppSettings.uploadAudioDataLength / myAppSettings.sampleRate, 
        pitchValues.length);

    Plotly.newPlot('melody-div', [{
        x: timeAxis,
        y: pitchValues,
        mode: 'lines',
        line: { color: '#2B6FAC' }
    }], layout);

    updateAppStatus("* ready ...");

    myDataVizSettings.melody.startTimeIndex = timeAxis[timeAxis.length-1]; 
}


function onRecordPlotMelody(pitchValues, callback) {

    var pitchArray = convertTypedArray2JsArray(pitchValues);

    if (myAppSettings.initiatePlots.melody) {
        callback(pitchArray);
        myAppSettings.initiatePlots.melody = false;
    } else {
      var timeAxis = makeLinSpace(myDataVizSettings.melody.startTimeIndex,
          myAppSettings.recordedAudioDataLength, pitchArray.length);

      myDataVizSettings.melody.startTimeIndex = timeAxis[timeAxis.length-1];

      Plotly.extendTraces('melody-div', {
          // x: [[timeAxis]],
          y: [[pitchArray]],
      }, [0]);
    }
}


function offlineLogMelBandsPlot(melBands) {

    var layout = {
        title: "Log-scaled Mel Bands",
        plot_bgcolor: "transparent",
        paper_bgcolor:"#FCF7F7",
        autosize: false,
        width: 670,
        height: 290,
        xaxis: {
            // autorange: true,
            range: [0,128],
            title: "128 - Mel Bands"
        },
        yaxis: {
            range: [Math.min(...melBands), Math.max(...melBands)],
            type: "linear",
        }
    };

    Plotly.newPlot('mfcc-div', [{
        y: melBands,
        mode: 'lines',
        line: { color: '#2B6FAC' }
    }], layout);

}


function onRecordPlotLogMelBands(melBands, callback) {

    var mbands = convertTypedArray2JsArray(melBands);

    if (myAppSettings.initiatePlots.logMelBands) {
        callback(mbands);
        myAppSettings.initiatePlots.logMelBands = false;
    } else {

        Plotly.extendTraces('mfcc-div', {
          y: [[melBands]],
        }, [0]);
    }
}


function offlineLoudnessPlot(loudness) {
    var layout = {
        title: "Vicker's Loudness",
        plot_bgcolor: "transparent",
        paper_bgcolor:"#FCF7F7",
        width: 670,
        height: 290,
    };
    var data = {
        type: 'indicator',
        mode: "number+gauge+delta",
        gauge: { 
            shape: "bullet",
            axis: {
                range: [-100, 0],
            } 
        },
        delta: { reference: 0 },
        value: loudness,
        domain : { x: [0, 1] },
    };

    Plotly.newPlot('loudness-div', [data], layout);
}


function onRecordPlotLoudness(loudness, callback) {
    if (myAppSettings.initiatePlots.loudness) {
        callback(loudness);
        myAppSettings.initiatePlots.loudness = false;
    } else {
        Plotly.restyle('loudness-div', {value: loudness});
    }
}

