const plot = document.getElementById("plot");
const rendering = document.getElementById("switch");
const plotData = [];
const lookupTable = {};

const layout = {
    hovermode: 'closest',
    showlegend: false,
    dragmode: "pan",
    xaxis: {
        range: [0, 0.01],
        // rangeslider: { range: [range.xmin, range.xmax] },
        showspikes: true,
        spikemode: "across",
        spikedash: "solid",
        spikecolor: "#000000",
        spikethickness: 0.5
    },
    yaxis: {
        fixedrange: true,
        showgrid: false,
        zeroline: false,
        showline: false,
    },
    spikedistance: 200,
    hoverdistance: 10,
    // grid: {
    //     rows: 2,
    //     columns: 1,
    //     subplots: [["xy", "xy1"]],
    // }
};

rendering.addEventListener("click", () => {
    plotData.forEach(data => {
        if (data.type === "scattergl") {
            data.type = "scatter"
        } else {
            data.type = "scattergl"
        }
    });
    Plotly.react(plot, plotData, layout);
})

let range = {
    xmin: Number.MAX_SAFE_INTEGER,
    xmax: Number.MIN_SAFE_INTEGER
}

mcore.events.forEach(evt => {
    if (!lookupTable[evt.core_id]) {
        lookupTable[evt.core_id] = {
            irq: {},
            ctx: {}
        };
    }
    if (evt.ts >= range.xmax) {
        range.xmax = evt.ts;
    }
    if (evt.ts <= range.xmin) {
        range.xmin = evt.ts;
    }

    if (evt.in_irq === true && !lookupTable[evt.core_id].irq.hasOwnProperty(evt.ctx_name)) {
        lookupTable[evt.core_id].irq[evt.ctx_name] = {}
    } else if (evt.in_irq === false && !lookupTable[evt.core_id].ctx.hasOwnProperty(evt.ctx_name)) {
        lookupTable[evt.core_id].ctx[evt.ctx_name] = {}
    }
});

mcore.events.forEach((evt, index) => {
    if (mcore.events.length - 1 === index) {
        return;
    }
    let data = lookupTable[evt.core_id].ctx[evt.ctx_name];
    if (evt.in_irq === true) {
        data = lookupTable[evt.core_id].irq[evt.ctx_name];
    }
    if (!data.type) {
        data.type = "scattergl"
        data.mode = "lines"
        // data.opacity = 0.9
        data.line = { width: 20 }
        data.name = evt.in_irq === true ? `IRQ: ${evt.ctx_name}` : evt.ctx_name
        // if (evt.core_id === 1) {
        //     data.yaxis = "y1"
        // }
        data.y = []
        data.x = []
    }
    data.x.push(evt.ts, mcore.events[index + 1].ts, null);
    data.y.push(data.name, data.name, data.name);
})

// Object.keys(lookupTable).forEach(coreId => {
const cpuCore = lookupTable[0]
Object.keys(cpuCore.ctx).forEach(ctx => {
    plotData.push(cpuCore.ctx[ctx])
})
Object.keys(cpuCore.irq).forEach(irq => {
    plotData.push(cpuCore.irq[irq])
})
// })


Plotly.plot(plot, plotData, layout, { scrollZoom: true })