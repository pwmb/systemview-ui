
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

const layout = {
    title: 'CPU CORE 0',
    height: 300,
    hovermode: 'closest',
    showlegend: true,
    dragmode: "pan",
    xaxis: {
        range: [range.xmin, range.xmax],
        // rangeslider: { range: [range.xmin, range.xmax] },
    },
    yaxis: {
        fixedrange: true
    }
};


Plotly.plot('graph', plotData, layout, { scrollZoom: true })
Plotly.plot('graph1', plotData1, layout, { scrollZoom: true })