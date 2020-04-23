const plot = document.getElementById("plot");
const rendering = document.getElementById("switch");
const plotData = [];
const lookupTable = {};

const IGNORE_RENDER_SYS_STREAM_LIST = [
    "SYS_IDLE",
    "SYS_INIT",
    "SYS_MODULEDESC",
    "SYS_NAME_RESOURCE",
    "SYS_NOP",
    "SYS_NUMMODULES",
    "SYS_STACK_INFO",
    "SYS_SYSDESC",
    "SYS_SYSTIME_CYCLES",
    "SYS_SYSTIME_US",
    "SYS_TRACE_START",
    "SYS_TRACE_STOP",
    "SYS_TASK_INFO"
]

const IGNORE_RENDER_SYS_STREAM_ID_LIST = IGNORE_RENDER_SYS_STREAM_LIST.map(name => mcore.streams.system[name])

let range = {
    xmin: Number.MAX_SAFE_INTEGER,
    xmax: Number.MIN_SAFE_INTEGER
}

const layout = {
    height: 700,
    hovermode: 'closest',
    showlegend: false,
    dragmode: "pan",
    shapes: [
        // {
        //     type: 'line',
        //     xref: "x",
        //     yref: "y2",
        //     x0: 0.002789875,
        //     y0: "IDLE1",
        //     x1: 0.002789875,
        //     y1: "IRQ: SysTick",
        //     opacity: 0.5,
        //     line: {
        //         color: 'blue',
        //         width: 0.5
        //     }
        // }
    ],
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
        title: "Core 0",
        fixedrange: true,
        showgrid: false,
        zeroline: false,
        showline: false,
    },
    yaxis2: {
        title: "Core 1",
        fixedrange: true,
        showgrid: false,
        zeroline: false,
        showline: false,
    },
    spikedistance: 200,
    hoverdistance: 10,
    grid: {
        rows: 2,
        columns: 1,
        subplots: [['xy'], ['xy2']],
    }
};

rendering.addEventListener("click", () => {
    setTimeout(() => {
        plotData.forEach(data => {
            if (data.type === "scattergl") {
                data.type = "scatter"
            } else {
                data.type = "scattergl"
            }
        });
        Plotly.react(plot, plotData, layout);
    }, 0);
})

mcore.events.forEach(evt => {
    if (!lookupTable[evt.core_id]) {
        lookupTable[evt.core_id] = {
            irq: {},
            ctx: {},
            lastEvent: null
        };
    }

    let canRender = true;
    if (IGNORE_RENDER_SYS_STREAM_ID_LIST.includes(evt.id)) {
        canRender = false;
    }
    if (canRender && evt.ts >= range.xmax) {
        range.xmax = evt.ts;
    }
    if (canRender && evt.ts <= range.xmin) {
        range.xmin = evt.ts;
    }

    if (evt.in_irq === true && !lookupTable[evt.core_id].irq.hasOwnProperty(evt.ctx_name)) {
        lookupTable[evt.core_id].irq[evt.ctx_name] = { canRender }
    } else if (evt.in_irq === false && !lookupTable[evt.core_id].ctx.hasOwnProperty(evt.ctx_name)) {
        lookupTable[evt.core_id].ctx[evt.ctx_name] = { canRender }
    }
});

mcore.events.forEach((evt, index) => {
    let data = lookupTable[evt.core_id].ctx[evt.ctx_name];
    if (evt.in_irq === true) {
        data = lookupTable[evt.core_id].irq[evt.ctx_name];
    }
    if (data.canRender === false) {
        return;
    }
    if (!data.type) {
        data.type = "scattergl"
        data.mode = "lines"
        data.opacity = 0.9
        data.line = { width: 20 }
        data.name = evt.in_irq === true ? `IRQ: ${evt.ctx_name}` : evt.ctx_name
        if (evt.core_id === 1) {
            data.yaxis = "y2"
            data.xaxis = "x"
        }
        data.y = []
        data.x = []
    }
    if (lookupTable[evt.core_id].lastEvent !== null) {
        const previousEvt = lookupTable[evt.core_id].lastEvent;
        data.x.push(previousEvt.ts, evt.ts, null);
        data.y.push(data.name, data.name, data.name);
    }
    lookupTable[evt.core_id].lastEvent = evt;
})

Object.keys(lookupTable).forEach(coreId => {
    const cpuCore = lookupTable[coreId]
    Object.keys(cpuCore.ctx).forEach(ctx => {
        if (cpuCore.ctx[ctx].canRender === true) {
            plotData.push(cpuCore.ctx[ctx])
        }
    })
    Object.keys(cpuCore.irq).forEach(irq => {
        if (cpuCore.irq[irq].canRender === true) {
            plotData.push(cpuCore.irq[irq])
        }
    })
})


layout.xaxis.range = [range.xmin, 0.01]

Plotly.plot(plot, plotData, layout, { scrollZoom: true })