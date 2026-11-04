import { RouterProvider, type createBrowserRouter } from "react-router";
import { RuntimeProvider, type Runtime } from "../context/RuntimeContext";
import { ThemeProvider } from "../context/ThemeContext";
import { AppBootstrapProvider } from "../context/AppBootstrapContext";
import { ToastProvider } from "../context/ToastContext";
import { ConsentProvider } from "../context/ConsentContext";
import { ToastContainer } from "../components/ui/ToastNotification";
import { LocaleProvider } from "../context/LocaleContext";
export function ShellApp({runtime,router}:{runtime:Runtime;router:ReturnType<typeof createBrowserRouter>}){return <RuntimeProvider value={runtime}><LocaleProvider><ThemeProvider><AppBootstrapProvider><ToastProvider><ConsentProvider><RouterProvider router={router}/></ConsentProvider><ToastContainer/></ToastProvider></AppBootstrapProvider></ThemeProvider></LocaleProvider></RuntimeProvider>;}
