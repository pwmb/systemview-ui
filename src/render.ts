import { SysViewEvent, LookUpTable } from "./model";

export function generateLookupTable(events: SysViewEvent[]): LookUpTable {
  const lookupTable: LookUpTable = {};

  events.forEach((evt: SysViewEvent) => {
    if (!lookupTable[evt.core_id]) {
      lookupTable[evt.core_id] = {
        irq: {},
        ctx: {},
        lastEvent: null,
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
  ignoreRenderIds: Set<number>
): { xmin: number; xmax: number } {
  const range = {
    xmin: Number.POSITIVE_INFINITY,
    xmax: Number.NEGATIVE_INFINITY,
  };

  events.forEach((evt: SysViewEvent) => {
    if (ignoreRenderIds.has(evt.id)) {
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
    if (lookupTable[evt.core_id].lastEvent !== null) {
      const previousEvt = lookupTable[evt.core_id].lastEvent;
      const previousData =
        previousEvt.in_irq === true
          ? lookupTable[evt.core_id].irq[previousEvt.ctx_name]
          : lookupTable[evt.core_id].ctx[previousEvt.ctx_name];

      //stop for last event
      previousData.x.push(evt.ts, null);
      previousData.y.push(previousData.name, previousData.name);
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
  });
  return plotData;
}
