// scripts for data visualisation of essentia features


// data viz settings for each features
let myDataVizSettings = {

    layout_template: {
        plot_bgcolor: "transparent",
        paper_bgcolor: "#FCF7F7",
        width: 670,
        height: 290,
    },

    yin: {
        startTimeIndex: 0
    },
    pyin: {
        startTimeIndex: 0
    },
    melodia: {
        startTimeIndex: 0
    },
    predominantMelodia: {
        startTimeIndex: 0
    },
    hpcp: {
        startTimeIndex: 0
    },
    chroma: {
        startTimeIndex: 0
    },
    beatTracker: {
        startTimeIndex: 0
    },
    onsetDetection: {
        startTimeIndex: 0
    },
    danceability: {
        startTimeIndex: 0
    },
    chords: {
        startTimeIndex: 0
    },
    logMelSpectrogram: {
        startTimeIndex: 0
    },
}


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


makeLinSpace = function(a, b, n) {
    if(typeof n === "undefined") n = Math.max(Math.round(b-a)+1,1);
    if(n<2) { return n===1?[a]:[]; }
    var i,ret = Array(n);
    n--;
    for(i=n;i>=0;i--) { ret[i] = (i*b+(n-i)*a)/n; }
    return ret;
}


const convertTypedArray2JsArray = function(typedArray) {
    var array =  Array.prototype.slice.call(typedArray);
    return array;
}


function plotChromaHeatmap(hpcpArray, featureObj, plotObj, divId, plotTitle) {

    
    if (myAppSettings.uploadMode === 'mic') {
        var timeAxis = makeLinSpace(plotObj.startTimeIndex, 
            myAppSettings.bufferSize / myAppSettings.sampleRate, 
            hpcpArray.length);
    } else {
        var timeAxis = makeLinSpace(plotObj.startTimeIndex, 
            myAppSettings.uploadAudioDataLength / myAppSettings.sampleRate, 
            hpcpArray.length);
    }

    var layout = {
        title: plotTitle,
        plot_bgcolor: "transparent",
        paper_bgcolor:"#FCF7F7",
        autosize: false,
        width: 670,
        height: 290,
        xaxis: {
            autorange: true,
            time: 'Time',
        },
        yaxis: {
            range: [0, 11]
        },
    };

    var chromaBins = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    var data = {
        x: timeAxis,
        y: chromaBins,
        z: hpcpArray,
        colorscale: 'Jet',
        type: 'heatmap',
        transpose: true,
    };

    if (myAppSettings.initiatePlot.hpcp) {
        Plotly.newPlot(divId, [data], layout)
        myAppSettings.initiatePlot.hpcp = false;
        plotObj.startTimeIndex = timeAxis[timeAxis.length-1];

    } else {
      timeAxis = makeLinSpace(plotObj.startTimeIndex,
            plotObj.startTimeIndex + (myAppSettings.bufferSize / myAppSettings.sampleRate), hpcpArray.length);

      plotObj.startTimeIndex = timeAxis[timeAxis.length-1];   

      Plotly.extendTraces(divId, {
          x: [timeAxis],
          z: [hpcpArray],
      }, [0]);
    }
}


function plotSpectrogram(spectrogram, featureObj,plotObj, divId, plotTitle) {

    var numBands = spectrogram[0].length;

    var specArray = [];
    for (var i=0; i<spectrogram.length; i++) {
        specArray.push(convertTypedArray2JsArray(spectrogram[i])); 
    }

    // var timeAxis = makeLinSpace(plotObj.startTimeIndex, 
    //     myAppSettings.uploadAudioDataLength / myAppSettings.sampleRate, 
    //     spectrogram.length);

    if (myAppSettings.uploadMode === 'mic') {
        var timeAxis = makeLinSpace(plotObj.startTimeIndex, 
            myAppSettings.bufferSize / myAppSettings.sampleRate, 
            spectrogram.length);
    } else {
        var timeAxis = makeLinSpace(plotObj.startTimeIndex, 
            myAppSettings.uploadAudioDataLength / myAppSettings.sampleRate, 
            spectrogram.length);
    }

    var layout = {
        title: plotTitle,
        plot_bgcolor: "transparent",
        paper_bgcolor:"#FCF7F7",
        autosize: false,
        width: 670,
        height: 290,
        xaxis: {
            title: 'Time',
            range: [plotObj.startTimeIndex, timeAxis[timeAxis.length - 1]],
        },
        yaxis: {
            title: 'Bands',
            range: [0, numBands + 1 ],
            type: 'linear',
        },
    };

    var data = {
        x: timeAxis,
        z: specArray,
        type: 'heatmapgl',
        colorscale: 'Jet',
        transpose: true,
        // colorscale: colorscaleValue,
        //showscale: false,
    };

    if (myAppSettings.initiatePlot.logMelSpectrogram) {
        Plotly.newPlot(divId, [data], layout);
        myAppSettings.initiatePlot.logMelSpectrogram = false;
        plotObj.startTimeIndex = timeAxis[timeAxis.length-1];
    } else {

        timeAxis = makeLinSpace(plotObj.startTimeIndex,
            plotObj.startTimeIndex + (myAppSettings.bufferSize / myAppSettings.sampleRate), spectrogram.length);

        plotObj.startTimeIndex = timeAxis[timeAxis.length-1];

        Plotly.extendTraces(divId, {
            x: [timeAxis],
            z: [specArray],
        }, [0]);
    }
}


function offlineBpmHistogramPlot(bpmHist, divId) {
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

    Plotly.newPlot(divId, [data], layout);
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


function plotMelodyContour(pitchValues, plotObj, divId, plotTitle) {


    if (myAppSettings.uploadMode === 'mic') {
        var timeAxis = makeLinSpace(plotObj.startTimeIndex, 
            myAppSettings.bufferSize / myAppSettings.sampleRate, 
            pitchValues.length);
    } else {
        var timeAxis = makeLinSpace(plotObj.startTimeIndex, 
            myAppSettings.uploadAudioDataLength / myAppSettings.sampleRate, 
            pitchValues.length);
    }

    var layout = {
        title: plotTitle,
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
            autorange: false,
            range: [0, 1500],
            type: "linear",
            title: "Frequency (Hz)"
        }
    };

    if (myAppSettings.uploadMode === 'mic') { myAppSettings.initiatePlot.melodia = false; myAppSettings.initiatePlot.predominantMelodia = false; };

    // var pitchArray = convertTypedArray2JsArray(pitchValues);

    if (myAppSettings.initiatePlot.pyin || myAppSettings.initiatePlot.melodia || myAppSettings.initiatePlot.predominantMelodia) {

        Plotly.newPlot(divId, [{
            x: timeAxis,
            y: pitchValues,
            mode: 'lines',
            line: { color: '#2B6FAC', width: 2 }
        }], layout);
        
        myAppSettings.initiatePlot.pyin = false;
        plotObj.startTimeIndex = timeAxis[timeAxis.length-1];

    } else {
        timeAxis = makeLinSpace(plotObj.startTimeIndex,
            plotObj.startTimeIndex + (myAppSettings.bufferSize / myAppSettings.sampleRate), pitchValues.length);
        plotObj.startTimeIndex = timeAxis[timeAxis.length-1];

        Plotly.extendTraces(divId, {
            x: [timeAxis],
            y: [pitchValues],
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


function plotLoudness(loudness, featureObj, divId) {

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

    if (featureObj) {
        Plotly.newPlot(divId, [data], layout);
        featureObj = false;
    } else {
        Plotly.restyle(divId, {value: loudness});
    }
}


function offlineChordPlot(chordFeatures, featureObj, divId, plotTitle) {

    createChordMarkers = function(ticks) {
        var marker = {
            type: 'rect',
            // x-reference is assigned to the x-values
            xref: 'x',
            // y-reference is assigned to the plot paper [0,1]
            // yref: 'paper',
            x0: null,
            y0: 0,
            x1: null,
            y1: 1,
            fillcolor: '#d3d3d3',
            opacity: 0.1,
            line: {
                width: 1
            },
        }
        var shapes = [];
        var startIdx = 0;
        for (var i=1; i< ticks.length; i++) {
            var vline = jsonCopy(marker);
            vline.x0 = startIdx;
            vline.x1 = ticks[i];
            startIdx = ticks[i];
            shapes.push(vline);
        }
        return shapes;
    }

    var timeAxis = makeLinSpace(myDataVizSettings.chords.startTimeIndex, 
        myAppSettings.uploadAudioDataLength / myAppSettings.sampleRate, 
        chordFeatures.chords.length);

    var vlines = createChordMarkers(timeAxis);

    var layout = {
        plot_bgcolor: "transparent",
        paper_bgcolor: "#FCF7F7",
        width: 670,
        height: 290,
        shapes: vlines,
        yAxis: {
            type: 'linear',
            range: [0, 1],
        },
        title: plotTitle,

    };

    var strength = {
        type: "scatter",
        mode: "lines",
        name: "strength",
        x: timeAxis,
        y: chordFeatures.strength,
        line: {color: '#2B6FAC'},
    }

    var yLocs = new Array(chordFeatures.chords.length);
    yLocs.fill(0.2);

    var chords = {
        x: timeAxis,
        y: yLocs,
        text: chordFeatures.chords,
        mode: 'text',
        name: 'chord',
    };

    if (featureObj) {

        Plotly.newPlot(divId, [ chords, strength ], layout);

    } else {

        Plotly.extendTraces(divId, {
            y: [ chordFeatures.strength ],
        }, [0]);
    }

}


function onRecordChordPlot(chordFeatures, featureObj, divId, plotTitle) {

    var chords = getMostFreqElementArray(chordFeatures.chords);

    var layout = {
        plot_bgcolor: "transparent",
        paper_bgcolor: "#FCF7F7",
        width: 670,
        height: 290,
    };

    var data = [
    {
        type: "indicator",
        mode: "number",
        value: chordFeatures.strength[chords.maxIdx],
        ticker: { showticker: true },
        // number: { prefix: "$" },
        title: chords.maxEl,
      }
    ];

    if (featureObj) {

        Plotly.newPlot(divId, data, layout);

    } else {
        Plotly.restyle(divId, {value: chordFeatures.strength[chords.maxIdx], title: chords.maxEl }, [0]);
    }

}


function plotSingleValueData(value, featureObj, divId, plotTitle) {

    var layout = {
        plot_bgcolor: "transparent",
        paper_bgcolor: "#FCF7F7",
        width: 670,
        height: 290,
    };

    var data = [
    {
        type: "indicator",
        mode: "number",
        value: value,
        ticker: { showticker: true },
        // number: { prefix: "$" },
        title: plotTitle,
      }
    ];

    if (featureObj) {

        Plotly.newPlot(divId, data, layout);

    } else {
        Plotly.restyle(divId, {value: value }, [0]);
    }
}



function plotTimeSeriesOverlayAudio(dataObj, featureObj, plotObj, divId, plotTitle) {

    createTicksConfigs = function(ticks) {
        var marker = {
            type: 'rect',
            // x-reference is assigned to the x-values
            xref: 'x',
            // y-reference is assigned to the plot paper [0,1]
            // yref: 'paper',
            x0: null,
            y0: -1,
            x1: null,
            y1: 1,
            fillcolor: 'red',
            opacity: 0.5,
            line: {
                width: 1.5
            }
        }
        var shapes = [];
        for (var i=0; i<ticks.length; i++) {
            var vline = jsonCopy(marker);
            vline.x0 = ticks[i];
            vline.x1 = ticks[i];
            shapes.push(vline);
        }
        return shapes;
    }

    var timeAxis = makeLinSpace(plotObj.startTimeIndex, 
        myAppSettings.uploadAudioDataLength / myAppSettings.sampleRate, 
        dataObj.ticks.length);

    var vlines = createTicksConfigs(dataObj.ticks);

    var layout = {
        plot_bgcolor: "transparent",
        paper_bgcolor: "#FCF7F7",
        width: 670,
        height: 290,
        title: plotTitle,
        shapes: vlines,
        yAxis: {
            type: 'linear',
            range: [-1, 1],
        }

    };

    var audioData = [{
        type: "scatter",
        mode: "lines",
        x: timeAxis,
        y: myAppSettings.uploadAudioData,
        line: {color: '#2B6FAC'},
    }];

    if (featureObj) {

        Plotly.newPlot(divId, audioData, layout);

    } else {

        Plotly.extendTraces(divId, {
            y: [ dataObj.audioData ],
        }, [0]);
    }
}



formatTwoArrays2ObjectArrays = function(arrayOne, arrayTwo) {
    var outArray = new Array(arrayOne.length);
    for (var i=0; i<arrayOne.length; i++) {
      outArray[i] = {"x": arrayOne[i], "y": arrayTwo[i]};
    }
    return outArray;
}


format1dDataToChartJsFormat = function(data, audioLength) {
    audioTimes = makeLinSpace(0, audioLength / 44100., data.length);
    return formatTwoArrays2ObjectArrays(audioTimes, data);
}



