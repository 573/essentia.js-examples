

var resultTabContainers = ['melody-div', 'key-div', 'bpm-div', 'loudness-div', 'mfcc-div']


// compute predominant melody of a given audio buffer
const getPreDominantMelody = function(audioData) {
    var signal = typedFloat32Array2Vec(audioData);
    var pitches = new Module.VectorFloat();
    var pitchConfidence = new Module.VectorFloat();
    Module.predominantPitchMelodiaExtractor(signal, pitches, pitchConfidence);
    var pitch = vec2typedFloat32Array(pitches);
    // empty std::vectors manually
    pitches.resize(0, 1);
    pitchConfidence.resize(0, 1);
    return pitch;
}


const getLogMelBands = function(audioData) {
    var signal = typedFloat32Array2Vec(audioData);
    var melbands = Module.logMelBandsExtractor(signal, 1024, 1024);
    var mbands = vec2typedFloat32Array(melbands);
    melbands.resize(0,1);
    return mbands;
}


// compute
getPercivalBpmEstimate = function(audioData, sampleRate=44100, frameSize=1024, hopSize=512) {
    var signal = typedFloat32Array2Vec(audioData);
    var bpm = Module.percivalBpmEstimator(signal, sampleRate, frameSize, hopSize);
    signal.resize(0, 1);
    return bpm;
}


// compute vickers loudness of a given audio frame.
getLoudnessVickers = function(audioFrame) {
    var signal = typedFloat32Array2Vec(audioFrame);
    var loudness = Module.loudnessVickers(signal);
    signal.resize(0, 1);
    return volumes;
}


const plotMelodyChart = function(audioData, opts) {
    // compute pitch contours
    var pitch = getPreDominantMelody(audioData);  
    var timeAxis = makeLinSpace(0, audioData.length / 44100., pitch.length);
    // round to 2 decimels
    timeAxis = timeAxis.map(function(each_element){
        return Number(each_element.toFixed(2));
    });
    // set data
    opts.xAxis.data = timeAxis;
    opts.series[0].data = pitch;
    // plot
    myChartObj = echarts.init(document.getElementById('melody-div'), 'light');
    myChartObj.setOption(opts);
}


const plotMelBandsChart = function(audioData, opts) {

    var melbands = getLogMelBands(audioData);
    var timeAxis = makeLinSpace(0, audioData.length / 44100., melbands.length);
    // round to 2 decimels
    timeAxis = timeAxis.map(function(each_element){
        return Number(each_element.toFixed(2));
    });

    // set data
    opts.xAxis.data = timeAxis;
    opts.series[0].data = melbands;
    // plot
    myChartObj = echarts.init(document.getElementById('mfcc-div'), 'light');
    myChartObj.setOption(opts);
}


const plotChromaChart = function(audioData, opts) {


    // set data
    opts.xAxis.data = 0;
    opts.yAxis.data = 0;
    opts.series[0].data = 0;
    // plot the chart
    myChartObj = echarts.init(document.getElementById('chroma-div'), 'light');
    myChartObj.setOption(opts);

}



// given a audio buffer array compute and plot pre-dominant melody contours
plotLineChartMelody = function(audioData) {

    var pitch = getPreDominantMelody(audioData);
    var dataset = format1dDataToChartJsFormat(pitch, audioData.length);
    deleteCanvas();
    createCanvasOnDiv('melody-div', 'melody-viz');

    var scatterChart = new Chart(chartJsCtx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Predominant Pitch Melodia',
                data: dataset,
                showLine: true,
                xAxisID: 'Time (secs)',
                yAxisID: 'Frequencies (Hz)'
                
              }]
        },
        options : {
            scales : {
                xAxes: [{
                    type: 'linear',
                    position: 'bottom',
                    labelString: 'Time (secs)'
                }],
                yAxes: [{
                    type: 'linear',
                    labelString: 'Frequencies (Hz)'
                }]
            }
        }
    });

}


plotMelodyContour = function(pitchValues, audioLength) {

    pitchTimes = makeLinSpace(0, audioLength / 44100., pitchValues.length);
    var data = [{
        type: "scatter",
        mode: "linear",
        name: "Predominant Pitch Melodia",
        x: pitchTimes,
        y: pitchValues,
        line: {color: '#17BECF'}
    }]
    var layout = {
        title: "Predominant Pitch Melodia",
        xaxis: {
          autorange: true,
          range: [0, 2.28],
          type: 'time',
          name: 'Time (secs)'
        },
        yaxis: {
          range: [Math.min(...pitchValues), Math.max(...pitchValues)],
          type: 'linear',
          name: 'Frequencies (Hz)'
        }
    };
    Plotly.newPlot('viz-div', data, layout);
}



plotBpmHistogram = function(audioData) {

}



plotLoudnessBar = function() {

    var canvas = document.createElement('canvas');
    var chartDiv = document.getElementById('loudness-div');
    canvas.id = 'loudness-viz';
    canvas.width = 100;
    canvas.height = 200;
    canvas.style.display = 'block';
    canvas.style.margin = "auto";
    canvas.style.position = "absolute";
    canvas.style.top = 0;
    canvas.style.bottom = 0;
    canvas.style.left = 0;
    canvas.style.right = 0;
    chartDiv.appendChild(canvas);

    var canvasText = document.createElement('canvas');
    canvasText.id = 'loudness-value';
    canvasText.width = 200;
    canvasText.height = 100;
    canvasText.style.margin = "auto";
    canvasText.style.position = "relative";
    canvasText.style.top = 0;
    canvasText.style.bottom = 0;
    canvasText.style.left = 50;
    chartDiv.appendChild(canvasText);


    var optionsBars = {
      // Minimum number.
      min: -100,
      // Maximum number.
      max: 1,
      // Background dash color.
      dashColor: '#e5e5e5',
      // Bar color.
      barColor: '#007bfb',
      // Bar speed.
      speed: 10,
      // Bar color gradient or not.
      gradient: true
    };
    
    var barMeter = new zeu.BarMeter('loudness-viz', optionsBars);

    /* Setters */
    barMeter.value = 0;
    barMeter.dashColor = '#e5e5e5';
    barMeter.barColor = '#007bfb';
    barMeter.speed = 10;

    var signal = typedFloat32Array2Vec(urlAudioBuffer.getChannelData(0));
    loudness = getLoudnessVickers(signal);
        
    var optionsText = {
        // Text
        text: {
          // Font color.
          fontColor: '#dc3547',
          // Background color.
          bgColor: '#000000',
          // Text value.
          value: 'ZEU'
        },
        // Border color at four corners.
        borderColor: '#ffa500',
        // Wave color.
        waveColor: '#28a748',
        // Background color. Use rgba() function to have the gradient effect.
        bgColor: 'rgba(0, 0, 0, 0.01)'
    };

    var textBox = new zeu.TextBox('loudness-value', optionsText);

    /* Setter */
    textBox.value = 0;
    textBox.textColor = '#dc3547';
    textBox.textBgColor = '#000000';
    textBox.bgColor = 'rgba(0, 0, 0, 0.01)';
    textBox.borderColor = '#ffa500';
    textBox.waveColor = '#28a748';

    for (var i=0; i<loudness.length; i++) {
        barMeter.value = loudness[i]
        textBox.value = loudness[i];
    }
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


