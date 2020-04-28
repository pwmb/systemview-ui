export interface SysViewEvent {
  ctx_name?: string;
  id?: number;
  core_id?: number;
  ts?: number;
  in_irq?: boolean;

  // plot related meta info
  type?: string;
  mode?: string;
  opacity?: number;
  line?: { width?: number };
  name?: string;
  yaxis?: string;
  xaxis?: string;
  x?: Array<any>;
  y?: Array<any>;
}
export type SysViewEventObjects = {
  [key: string]: SysViewEvent;
};

export interface LookUpTable {
  [key: string]: {
    irq: SysViewEventObjects;
    ctx: SysViewEventObjects;
    lastEvent: SysViewEvent;
    contextSwitch: {
      line: { width: 0.5; color: "blue" };
      opacity: 0.5;
      type: "scatterql";
      x: Array<number>;
      y: Array<string>;
      xaxis?: "x";
      yaxis?: "y" | "y2";
      mode: "lines";
      name: "context-switch";
      visible: "legendonly";
      hoverinfo: "skip";
    };
  };
}
export const IGNORE_RENDER_SYS_STREAM_LIST = [
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
  "SYS_TASK_INFO",
];
