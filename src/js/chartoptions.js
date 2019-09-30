// Option templates for echarts objects


// echarts options template for plotting melody contour charts
var melodyChartOptions = {

    color: ["#2B6FAC"],
        title: {
            text: "Predominant Pitch Melodia",
    },
    tooltip: {
        trigger: 'axis',
        /*
        axisPointer: {
            type: 'cross',
        }*/
    },
    xAxis: {
        // type: 'category',
        data: null,
        name: 'Time(Secs)',
        // boundaryGap: false,
        //interval: 0,

    },
    yAxis: {
        type: 'value',
        name: 'Frequencies(Hz)',
        axisLabel: {
            formatter: '{value} Hz'
        }
    },
    series: [{
        name: 'Frequency(Hz)',
        type: 'line',
        smooth: true,
        data: null,
    }]
};


// echarts options template for plotting melody contour charts
var melbandsChartOptions = {

    tooltip: {
        position: 'top',
    },

    title: {
        top: 30,
        left: 'center',
        text: 'HPCP'
    },
    xAxis: {
        type: 'category',
        data: null,
        splitArea: {
            show: true
        }
    },
    yAxis: {
        type: 'category',
        data: null,
        splitArea: {
            show: true
        }
    },
    tooltip : {},
    visualMap: {
        min: 0,
        max: 1,
        type: 'piecewise',
        orient: 'horizontal',
        left: 'center',
        bottom: '15%',
        textStyle: {
            color: '#000'
        }
    },
    series: [{
        name: 'HPCP',
        type: 'heatmap',
        data: null,
        label: {
            normal: {
                show: true
            }
        },
        itemStyle: {
            emphasis: {
                shadowBlur: 10,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
        }
    }] 
};


// echarts options template for plotting chroma featurs as heatmaps
var chromaChartOptions = {

    tooltip: {
        position: 'top',
    },

    title: {
        top: 30,
        left: 'center',
        text: 'HPCP'
    },
    xAxis: {
        type: 'category',
        data: null,
        splitArea: {
            show: true
        }
    },
    yAxis: {
        type: 'category',
        data: null,
        splitArea: {
            show: true
        }
    },
    tooltip : {},
    visualMap: {
        min: 0,
        max: 1,
        type: 'piecewise',
        orient: 'horizontal',
        left: 'center',
        bottom: '15%',
        textStyle: {
            color: '#000'
        }
    },
    series: [{
        name: 'HPCP',
        type: 'heatmap',
        data: null,
        label: {
            normal: {
                show: true
            }
        },
        itemStyle: {
            emphasis: {
                shadowBlur: 10,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
        }
    }] 
};



