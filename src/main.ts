import { IGNORE_RENDER_SYS_STREAM_LIST, SysViewEvent, events } from "./model";
import {
  generateLookupTable,
  calculateAndInjectDataPoints,
  populatePlotData,
} from "./render";
import { resize } from "./interact";

const plot = document.getElementById("plot");
const uploadFile = document.getElementById("file");
const event_table = document.getElementById("event_table_data");

resize(plot);

const layout = {
  margin: {
    t: 30,
    b: 30,
    r: 20,
  },
  paper_bgcolor: "red",
  plot_bgcolor: "#000000",
  font: {
    color: "#ffffff",
    size: 8,
  },
  hovermode: "closest",
  showlegend: false,
  dragmode: "pan",
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
    domain: [0.5, 1],
    fixedrange: true,
    showgrid: false,
    zeroline: false,
    showline: false,
  },
  yaxis2: {
    title: "Core 1",
    domain: [0, 0.49],
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
      Plotly.react(plot, plotData, layout, {
        displaylogo: false,
        scrollZoom: true,
        responsive: true,
      });
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

function generateEventTableTR(
  event: events,
  index: number
): HTMLTableRowElement {
  function createTDWithData(data: string): HTMLTableDataCellElement {
    const td = document.createElement("td");
    td.innerText = data;
    return td;
  }
  const tr = document.createElement("tr");

  tr.appendChild(createTDWithData(index.toString()));
  tr.appendChild(createTDWithData(event.ts.toString()));
  tr.appendChild(createTDWithData(event.core_id.toString()));
  tr.appendChild(createTDWithData(event.ctx_name.toString()));

  if (event.params && event.params.desc) {
    tr.appendChild(createTDWithData(event.params.desc));
  }

  return tr;
}

function fillEventTable(mcore: any) {
  const holder = document.createDocumentFragment();
  mcore.events.forEach((event: events, index: number) =>
    holder.appendChild(generateEventTableTR(event, index))
  );
  event_table.appendChild(holder);
}

(async function () {
  fetch("https://pwmb.github.io/systemview-ui/mcore.json")
    .then((response) => {
      return response.json();
    })
    .then((mcore) => {
      fillEventTable(mcore);
      const plotData = drawPlot(mcore);

      //@ts-ignore
      Plotly.newPlot(plot, plotData, layout, {
        displaylogo: false,
        scrollZoom: true,
        responsive: true,
      });
    })
    .catch((error) => {
      console.error(error);
      alert("Failed to fetch mcore.json");
    });
})();
