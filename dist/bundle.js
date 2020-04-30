!function(e){var t={};function n(o){if(t[o])return t[o].exports;var r=t[o]={i:o,l:!1,exports:{}};return e[o].call(r.exports,r,r.exports,n),r.l=!0,r.exports}n.m=e,n.c=t,n.d=function(e,t,o){n.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:o})},n.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},n.t=function(e,t){if(1&t&&(e=n(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var o=Object.create(null);if(n.r(o),Object.defineProperty(o,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var r in e)n.d(o,r,function(t){return e[t]}.bind(null,r));return o},n.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(t,"a",t),t},n.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},n.p="",n(n.s=0)}([function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});const o=n(1),r=n(2),i=document.getElementById("plot"),c=document.getElementById("file"),s={height:700,hovermode:"closest",showlegend:!0,dragmode:"pan",xaxis:{range:[0,.01],showspikes:!0,spikemode:"across",spikedash:"solid",spikecolor:"#000000",spikethickness:.5},yaxis:{title:"Core 0",fixedrange:!0,showgrid:!1,zeroline:!1,showline:!1},yaxis2:{title:"Core 1",fixedrange:!0,showgrid:!1,zeroline:!1,showline:!1},spikedistance:200,hoverdistance:10,grid:{rows:2,columns:1,subplots:[["xy"],["xy2"]]}};function a(e){const t=new Set(o.IGNORE_RENDER_SYS_STREAM_LIST.map(t=>e.streams.system[t])),n=r.generateLookupTable(e.events),i=r.calculateAndInjectDataPoints(e.events,n,t,e.streams.system.SYS_OVERFLOW);s.xaxis.range=[i.xmin,.01];const c=r.populatePlotData(n);return console.log("Plot data"),console.dir(c),c}c.addEventListener("change",e=>{const t=e.target.files[0];if(!t||!t.type.match("application/json"))return;const n=new FileReader;n.addEventListener("loadend",e=>{try{const t=a(JSON.parse(e.target.result));Plotly.react(i,t,s,{displaylogo:!1,scrollZoom:!0,responsive:!0})}catch(e){alert("Invalid JSON File"+e)}}),n.readAsBinaryString(t)}),async function(){fetch("https://soumeshbanerjee.github.io/systemview-ui/mcore.json").then(e=>e.json()).then(e=>{const t=a(e);Plotly.newPlot(i,t,s,{displaylogo:!1,scrollZoom:!0,responsive:!0})}).catch(e=>{console.error(e),alert("Failed to fetch mcore.json")})}()},function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.IGNORE_RENDER_SYS_STREAM_LIST=["SYS_INIT","SYS_MODULEDESC","SYS_NAME_RESOURCE","SYS_NOP","SYS_NUMMODULES","SYS_STACK_INFO","SYS_SYSDESC","SYS_SYSTIME_CYCLES","SYS_SYSTIME_US","SYS_TRACE_START","SYS_TRACE_STOP","SYS_TASK_INFO"]},function(e,t,n){"use strict";function o(e,t){e&&"lines"===e.mode&&(e.line.color=t)}Object.defineProperty(t,"__esModule",{value:!0}),t.generateLookupTable=function(e){const t={};return e.forEach(e=>{t[e.core_id]||(t[e.core_id]={irq:{},ctx:{},lastEvent:null,contextSwitch:{name:"context-switch",line:{color:"blue",width:.5},mode:"lines",opacity:.5,type:"scatterql",x:[],y:[],xaxis:"x",yaxis:1===e.core_id?"y2":"y",hoverinfo:"skip"}}),!0!==e.in_irq||t[e.core_id].irq.hasOwnProperty(e.ctx_name)?!1!==e.in_irq||t[e.core_id].ctx.hasOwnProperty(e.ctx_name)||(t[e.core_id].ctx[e.ctx_name]={}):t[e.core_id].irq[e.ctx_name]={}}),t},t.calculateAndInjectDataPoints=function(e,t,n,o){function r(e,n){const o=t[e].lastEvent;if(!o)return;const r=!0===o.in_irq?t[e].irq[o.ctx_name]:t[e].ctx[o.ctx_name];r.x.push(n,null),r.y.push(r.name,null)}const i={xmin:Number.POSITIVE_INFINITY,xmax:Number.NEGATIVE_INFINITY};return e.forEach(e=>{if(n.has(e.id))return;if(e.id===o)return console.log("Halt event arrived",e),r(0,e.ts),r(1,e.ts),t[0].lastEvent=null,void(t[1].lastEvent=null);e.ts>=i.xmax&&(i.xmax=e.ts),e.ts<=i.xmin&&(i.xmin=e.ts);let c=t[e.core_id].ctx[e.ctx_name];!0===e.in_irq&&(c=t[e.core_id].irq[e.ctx_name]),c.type||(c.type="scattergl",c.mode="lines",c.opacity=.9,c.line={width:20},c.name=!0===e.in_irq?"IRQ: "+e.ctx_name:e.ctx_name,1===e.core_id&&(c.yaxis="y2",c.xaxis="x"),c.y=[],c.x=[]),r(e.core_id,e.ts);const s=t[e.core_id].lastEvent;if(s){const n=!0===s.in_irq?t[e.core_id].irq[s.ctx_name]:t[e.core_id].ctx[s.ctx_name];!function(e,n,o,r){if(n===o)return;const i=t[e].contextSwitch;i.x.push(r,r,null),i.y.push(n,o,null)}(e.core_id,n.name,c.name,e.ts)}c.x.push(e.ts),c.y.push(c.name),t[e.core_id].lastEvent=e}),i},t.populatePlotData=function(e){const t=[];return Object.keys(e).forEach(n=>{const r=e[n],i=new Set,c=new Set(Object.keys(r.ctx));if(c.forEach(e=>{if(e.match(/^IDLE[0-9]*/)){o(r.ctx[e],"#c2ffcc"),i.add(e),c.delete(e)}}),c.forEach(t=>{if("scheduler"!==t){const o="#"+(16777216*Math.random()|0).toString(16);(function(e,t,n,o){let r=!1;return Object.keys(n).forEach(i=>{if(i===o)return;const c=n[i].ctx[e];c&&"lines"===c.mode&&(c.line.color=t,r=!0)}),r})(t,o,e,n)&&"lines"===r.ctx[t].mode&&(r.ctx[t].line.color=o),i.add(t),c.delete(t)}}),c.has("scheduler")){o(r.ctx.scheduler,"#444444"),i.add("scheduler"),c.delete("scheduler")}i.forEach(e=>{t.push(r.ctx[e])}),Object.keys(r.irq).forEach(e=>{t.push(r.irq[e])}),t.push(r.contextSwitch)}),t}}]);
//# sourceMappingURL=bundle.js.map