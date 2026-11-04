import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
Object.defineProperty(window,"matchMedia",{writable:true,value:vi.fn().mockImplementation(query=>({matches:false,media:query,addEventListener:vi.fn(),removeEventListener:vi.fn()}))});
window.scrollTo=vi.fn();
const storage=new Map<string,string>();
const local={getItem:(key:string)=>storage.get(key)??null,setItem:(key:string,value:string)=>{storage.set(key,String(value));},removeItem:(key:string)=>storage.delete(key),clear:()=>storage.clear(),key:(index:number)=>Array.from(storage.keys())[index]??null,get length(){return storage.size;}};
Object.defineProperty(window,"localStorage",{configurable:true,value:local});
vi.stubGlobal("localStorage",local);
afterEach(()=>{cleanup();localStorage.clear();vi.restoreAllMocks();});
