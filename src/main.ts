import { IGNORE_RENDER_SYS_STREAM_LIST, SysViewEvent } from "./model";
import {
  generateLookupTable,
  calculateAndInjectDataPoints,
  populatePlotData,
} from "./render";

const plot = document.getElementById("plot");
const uploadFile = document.getElementById("file");

const layout = {
  height: 700,
  hovermode: "closest",
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
    spikethickness: 0.5,
  },
  yaxis: {
    title: "Core 0",
    // domain: [0.5, 1],
    fixedrange: true,
    showgrid: false,
    zeroline: false,
    showline: false,
  },
  yaxis2: {
    title: "Core 1",
    // domain: [0, 0.48],
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
    subplots: [["xy"], ["xy2"]],
  },
};

interface HTMLInputEvent extends Event {
  target: HTMLInputElement & EventTarget;
}

uploadFile.addEventListener("change", (evt: HTMLInputEvent) => {
  const file = evt.target.files[0];
  if (!file || !file.type.match("application/json")) {
    return;
  }
  const reader = new FileReader();
  reader.addEventListener("loadend", (ev) => {
    //re-render stuff
    try {
      const mcore = JSON.parse(ev.target.result as string);
      const plotData = drawPlot(mcore);
      //@ts-ignore
      Plotly.react(plot, plotData, layout, { scrollZoom: true });
    } catch (error) {
      alert("Invalid JSON File" + error);
    }
  });
  reader.readAsBinaryString(file);
});

function drawPlot(mcore: any) {
  const IGNORE_RENDER_SYS_STREAM_ID_LIST = new Set(
    IGNORE_RENDER_SYS_STREAM_LIST.map((name) => mcore.streams.system[name])
  );

  const lookupTable = generateLookupTable(mcore.events as SysViewEvent[]);

  const range = calculateAndInjectDataPoints(
    mcore.events as SysViewEvent[],
    lookupTable,
    IGNORE_RENDER_SYS_STREAM_ID_LIST,
    mcore.streams.system["SYS_OVERFLOW"]
  );

  layout.xaxis.range = [range.xmin, 0.01];

  const plotData = populatePlotData(lookupTable);

  return plotData;
}

(async function () {
  fetch("https://soumeshbanerjee.github.io/systemview-ui/mcore.json")
    .then((response) => {
      return response.json();
    })
    .then((mcore) => {
      const plotData = drawPlot(mcore);

      //@ts-ignore
      Plotly.newPlot(plot, plotData, layout, { scrollZoom: true });
    })
    .catch((error) => {
      console.error(error);
      alert("Failed to fetch mcore.json");
    });
})();
