import { SysViewEvent, LookUpTable } from "./model";

export function generateLookupTable(events: SysViewEvent[]): LookUpTable {
  const lookupTable: LookUpTable = {};

  events.forEach((evt: SysViewEvent) => {
    if (!lookupTable[evt.core_id]) {
      lookupTable[evt.core_id] = {
        irq: {},
        ctx: {},
        lastEvent: null,
        contextSwitch: {
          name: "context-switch",
          line: {
            color: "blue",
            width: 0.5,
          },
          mode: "lines",
          opacity: 0.5,
          type: "scatterql",
          x: [],
          y: [],
          xaxis: "x",
          yaxis: evt.core_id === 1 ? "y2" : "y",
          // visible: "legendonly",
          hoverinfo: "skip",
        },
      };
    }

    if (
      evt.in_irq === true &&
      !lookupTable[evt.core_id].irq.hasOwnProperty(evt.ctx_name)
    ) {
      lookupTable[evt.core_id].irq[evt.ctx_name] = {};
    } else if (
      evt.in_irq === false &&
      !lookupTable[evt.core_id].ctx.hasOwnProperty(evt.ctx_name)
    ) {
      lookupTable[evt.core_id].ctx[evt.ctx_name] = {};
    }
  });

  return lookupTable;
}

export function calculateAndInjectDataPoints(
  events: SysViewEvent[],
  lookupTable: LookUpTable,
  ignoreRenderIds: Set<number>,
  sysOverflowId: number
): { xmin: number; xmax: number } {
  function drawContextSwitch(
    coreId: number,
    previousYAxis: any,
    currentYAxis: any,
    commonXAxis: any
  ) {
    if (previousYAxis === currentYAxis) {
      return;
    }
    const contextSwitch = lookupTable[coreId].contextSwitch;
    contextSwitch.x.push(commonXAxis, commonXAxis, null);
    contextSwitch.y.push(previousYAxis, currentYAxis, null);
  }
  function stopLastEventBar(coreId: number, stopTimeStamp: number) {
    const previousEvt = lookupTable[coreId].lastEvent;
    if (!previousEvt) {
      return;
    }
    const previousData =
      previousEvt.in_irq === true
        ? lookupTable[coreId].irq[previousEvt.ctx_name]
        : lookupTable[coreId].ctx[previousEvt.ctx_name];

    //stop for last event
    previousData.x.push(stopTimeStamp, null);
    previousData.y.push(previousData.name, null);
  }

  const range = {
    xmin: Number.POSITIVE_INFINITY,
    xmax: Number.NEGATIVE_INFINITY,
  };

  events.forEach((evt: SysViewEvent) => {
    //Ignore the list of ignored System Events
    if (ignoreRenderIds.has(evt.id)) {
      return;
    }
    //SYS_OVERFLOW event halt all the running tasks and draw void rect
    if (evt.id === sysOverflowId) {
      console.log("Halt event arrived", evt);
      //halts both the tasks running on both the core
      stopLastEventBar(0, evt.ts);
      stopLastEventBar(1, evt.ts);

      //set previous event as null for both core
      lookupTable[0].lastEvent = null;
      lookupTable[1].lastEvent = null;

      //ignore everything else and continue like a fresh start
      return;
    }
    if (evt.ts >= range.xmax) {
      range.xmax = evt.ts;
    }
    if (evt.ts <= range.xmin) {
      range.xmin = evt.ts;
    }

    let data = lookupTable[evt.core_id].ctx[evt.ctx_name];
    if (evt.in_irq === true) {
      data = lookupTable[evt.core_id].irq[evt.ctx_name];
    }

    if (!data.type) {
      data.type = "scattergl";
      data.mode = "lines";
      data.opacity = 0.9;
      data.line = { width: 20 };
      data.name = evt.in_irq === true ? `IRQ: ${evt.ctx_name}` : evt.ctx_name;
      if (evt.core_id === 1) {
        data.yaxis = "y2";
        data.xaxis = "x";
      }
      data.y = [];
      data.x = [];
    }
    //stop the last event bar (if exists)
    stopLastEventBar(evt.core_id, evt.ts);

    //draw context switch
    const previousEvt = lookupTable[evt.core_id].lastEvent;
    if (previousEvt) {
      const previousData =
        previousEvt.in_irq === true
          ? lookupTable[evt.core_id].irq[previousEvt.ctx_name]
          : lookupTable[evt.core_id].ctx[previousEvt.ctx_name];
      drawContextSwitch(evt.core_id, previousData.name, data.name, evt.ts);
    }

    //start point for current evt
    data.x.push(evt.ts);
    data.y.push(data.name);

    //store current event for a core as last event for the same core
    lookupTable[evt.core_id].lastEvent = evt;
  });
  return range;
}

export function populatePlotData(lookupTable: LookUpTable): Array<any> {
  const plotData = [];
  Object.keys(lookupTable).forEach((coreId) => {
    const cpuCore = lookupTable[coreId];
    Object.keys(cpuCore.ctx).forEach((ctx) => {
      plotData.push(cpuCore.ctx[ctx]);
    });
    Object.keys(cpuCore.irq).forEach((irq) => {
      plotData.push(cpuCore.irq[irq]);
    });
    plotData.push(cpuCore.contextSwitch);
  });
  return plotData;
}
