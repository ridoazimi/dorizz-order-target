export function createParser(onEvent){
 let buffer="";
 return chunk=>{
  buffer+=chunk;
  if(buffer.length>1000000)throw new Error("Stream frame too large");
  let end;
  while((end=buffer.indexOf("\n\n"))>=0){
   const frame=buffer.slice(0,end);buffer=buffer.slice(end+2);
   let event="message";const data=[];
   for(const line of frame.split("\n")){
    if(line.startsWith("event:"))event=line.slice(6).trim();
    if(line.startsWith("data:"))data.push(line.slice(5).trim());
   }
   if(data.length)onEvent({event,data:JSON.parse(data.join("\n"))});
  }
 };
}
