const cpu0 = document.getElementById("cpu0");
const cpu1 = document.getElementById("cpu1");

const cores = [cpu0, cpu1];

const lookupTable = {};

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

    if (evt.in_irq && evt.in_irq === true && !lookupTable[evt.core_id].irq[evt.ctx_name]) {
        lookupTable[evt.core_id].irq[evt.ctx_name] = {}
    } else {
        lookupTable[evt.core_id].ctx[evt.ctx_name] = {}
    }
});

mcore.events.forEach((evt, index) => {
    let data = lookupTable[evt.core_id].ctx[evt.ctx_name];
    if (evt.in_irq === true) {
        data = lookupTable[evt.core_id].irq[evt.ctx_name];
    }
    if (!data.type) {
        data.type = "bar"
        data.orientation = "h"
        data.name = evt.in_irq === true ? `IRQ: ${evt.ctx_name}` : evt.ctx_name
        data.y = []
        data.x = []
        data.base = []
    }
    if (evt.in_irq === true) {
        data.y.push("IRQ");
    } else {
        data.y.push("CTX");
    }
    data.base.push(evt.ts)
    if (mcore.events.length - 1 === index) {
        data.x.push(0)
    } else {
        data.x.push(mcore.events[index + 1].ts - evt.ts)
    }
})

const plotData = []

const CPU_0 = lookupTable[0]
Object.keys(CPU_0.ctx).forEach(ctx => {
    plotData.push(CPU_0.ctx[ctx])
})
Object.keys(CPU_0.irq).forEach(irq => {
    plotData.push(CPU_0.irq[irq])
})

const plotData1 = []

const CPU_1 = lookupTable[1]
Object.keys(CPU_1.ctx).forEach(ctx => {
    plotData1.push(CPU_1.ctx[ctx])
})
Object.keys(CPU_1.irq).forEach(irq => {
    plotData1.push(CPU_1.irq[irq])
})

const layout_0 = {
    title: 'CPU CORE 0',
    height: 300,
    hovermode: 'closest',
    showlegend: true,
    dragmode: "pan",
    xaxis: {
        range: [range.xmin, 0.01],
        // rangeslider: { range: [range.xmin, range.xmax] },
        showspikes: true,
        spikemode: "across",
        spikedash: "solid",
        spikecolor: "#000000",
        spikethickness: 0.1
    },
    yaxis: {
        fixedrange: true
    },
    spikedistance: 200,
    hoverdistance: 10,
};

const layout_1 = {
    title: 'CPU CORE 1',
    height: 300,
    hovermode: 'closest',
    showlegend: true,
    dragmode: "pan",
    xaxis: {
        range: [range.xmin, 0.01],
        // rangeslider: { range: [range.xmin, range.xmax] },
    },
    yaxis: {
        fixedrange: true
    }
};


Plotly.newPlot(cpu0, plotData, layout_0, { scrollZoom: true })

Plotly.newPlot(cpu1, plotData1, layout_1, { scrollZoom: true })

cores.forEach(core => {
    core.on("plotly_relayout", function (data) {
        rangeLayout(data);
    });
});

function rangeLayout(el) {
    if (el.hasOwnProperty("dragmode") || el.hasOwnProperty("hovermode") || el.hasOwnProperty("xaxis.showspikes") || el.hasOwnProperty("yaxis.showspikes")) {
        return;
    }
    cores.forEach(core => {
        let x = core.layout.xaxis;
        if (el["xaxis.autorange"] && x.autorange) return;
        if (x.range[0] != el["xaxis.range[0]"] || x.range[1] != el["xaxis.range[1]"])
            Plotly.relayout(core, el);
    })
}