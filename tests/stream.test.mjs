import test from "node:test";
import assert from "node:assert/strict";
import {existsSync} from "node:fs";
test("SSE parser buffers partial frames and preserves authoritative snapshots",async()=>{
 assert.ok(existsSync("stream.js"),"SSE parser must exist");
 const {createParser}=await import("../stream.js");
 const events=[];const parse=createParser(e=>events.push(e));
 parse("event: snapshot\ndata: {\"total\":1");assert.equal(events.length,0);
 parse("}\n\nevent: heartbeat\ndata: {}\n\n");
 assert.deepEqual(events,[{event:"snapshot",data:{total:1}},{event:"heartbeat",data:{}}]);
 parse("event: snapshot\ndata: {\"total\":1}\n\n");
 assert.equal(events.at(-1).data.total,1);
});

test("chart keeps mobile labels at native readable size",async()=>{
 const {readFileSync}=await import("node:fs");
 const source=readFileSync("app.js","utf8");
 assert.ok(source.includes("$(\"chart\").clientWidth"),"chart viewport must follow actual container width, not a shrinking desktop canvas");
});

test("mobile chart uses four spaced date labels",async()=>{
 assert.ok(existsSync("chart.js"),"responsive chart label selection must exist");
 const {chartLabelIndices}=await import("../chart.js");
 assert.deepEqual(chartLabelIndices(300),[0,10,20,29]);
 assert.deepEqual(chartLabelIndices(1000),[0,6,12,18,24,29]);
});
