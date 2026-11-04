import { Navigate } from "react-router";
import { RootLayout } from "../components/RootLayout";
import { AppLayout } from "../components/AppLayout";
import { AuthGuard } from "../components/AuthGuard";
import { RouteError } from "../components/RouteError";
import { Catalogue, EmptyPage, ProfilePage, LoginPage, NotesPage } from "./screens";
export function createShellRoutes(signIn:()=>void){return [{element:<RootLayout/>,errorElement:<RouteError/>,children:[{path:"/login",element:<LoginPage signIn={signIn}/>},{element:<AuthGuard/>,children:[{element:<AppLayout/>,children:[{path:"/topics",element:<Catalogue/>},{path:"/notes",element:<NotesPage/>},{path:"/practice",element:<EmptyPage/>},{path:"/mock",element:<EmptyPage/>},{path:"/profile",element:<ProfilePage/>},{path:"*",element:<Navigate to="/topics" replace/>}]}]}]}];}
