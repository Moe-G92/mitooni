import "../chunkRecoveryBootstrap";
import { createRoot } from "react-dom/client";
import { useMemo, useState } from "react";
import { createBrowserRouter } from "react-router";
import { ShellApp } from "./App";
import { createFixtureServices } from "./fixtures";
import { createShellRoutes } from "./routes";
import "../index.css";
function Preview(){const [signedIn,setSignedIn]=useState(true);const services=useMemo(createFixtureServices,[]);const router=useMemo(()=>createBrowserRouter(createShellRoutes(()=>setSignedIn(true)), { basename: "/preview" }),[]);const runtime=useMemo(()=>({user:signedIn?{id:"synthetic-local-learner",name:""}:null,isAuthenticated:signedIn,isLoading:false,logout:async()=>setSignedIn(false),services}),[signedIn,services]);return <ShellApp runtime={runtime} router={router}/>;}
createRoot(document.getElementById("root")!).render(<Preview/>);
