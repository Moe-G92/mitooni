import { readdir, readFile } from "node:fs/promises";
async function files(path){return(await Promise.all((await readdir(path,{withFileTypes:true})).map(d=>d.isDirectory()?files(`${path}/${d.name}`):`${path}/${d.name}`))).flat();}
const output=await files("dist");const text=(await Promise.all(output.filter(p=>/\.(html|js|css)$/.test(p)).map(p=>readFile(p,"utf8")))).join("\n");
for(const forbidden of ["synthetic-local-learner","createFixtureServices","Return to sample account","بازگشت به حساب نمونه","supabase.co","api.openai.com","sqecracker.com","barex.uk","preview.html"]){if(text.includes(forbidden))throw new Error(`Forbidden production reference: ${forbidden}`);}
console.log(`Production separation passed: ${output.length} artifacts; no fixture/session/provider references.`);
