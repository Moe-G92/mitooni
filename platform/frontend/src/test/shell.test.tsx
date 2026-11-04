import { describe,it,expect,vi } from "vitest";
import { render,screen,waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter } from "react-router";
import { useState } from "react";
import { ShellApp } from "../preview/App";
import { createShellRoutes } from "../preview/routes";
import { RouteError } from "../components/RouteError";
import { createFixtureServices } from "../preview/fixtures";
import type { ShellServices } from "../context/RuntimeContext";
function mount(path="/topics",services:ShellServices=createFixtureServices()) {
 const router=createMemoryRouter(createShellRoutes(()=>{}),{initialEntries:[path]});
 function Harness(){const [auth,setAuth]=useState(true);return <ShellApp router={router} runtime={{user:auth?{id:"synthetic-test",name:""}:null,isAuthenticated:auth,isLoading:false,logout:async()=>setAuth(false),services}}/>;}
 render(<Harness/>);return router;
}
describe("BarEx-derived local shell",()=>{
 it("defaults to Persian, navigates genuine shell, persists language and never calls network",async()=>{
 const network=vi.spyOn(globalThis,"fetch").mockRejectedValue(new Error("network denied"));const user=userEvent.setup();const router=mount();
 await screen.findByRole("heading",{name:"خواندن"});expect(document.documentElement.dir).toBe("rtl");
 await user.click(screen.getAllByRole("link",{name:"حساب کاربری"})[0]);await screen.findByLabelText("زبان");
 await user.selectOptions(screen.getByLabelText("زبان"),"en");expect(document.documentElement.lang).toBe("en");expect(document.documentElement.dir).toBe("ltr");expect(localStorage.getItem("mitooni-locale")).toBe("en");
 expect(router.state.location.pathname).toBe("/profile");expect(network).not.toHaveBeenCalled();
 });
 it("surfaces bootstrap failure and retries without granting access",async()=>{
 const services=createFixtureServices();services.bootstrap=vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValue({id:"test"});const user=userEvent.setup();mount("/topics",services);
 await screen.findByRole("heading",{name:"اطلاعات بارگذاری نشد."});expect(screen.queryByRole("heading",{name:"خواندن"})).toBeNull();
 await user.click(screen.getByRole("button",{name:"تلاش دوباره"}));await screen.findByRole("heading",{name:"خواندن"});
 });
 it("saves theme, emits dismissible feedback, and denies protected routes after signout",async()=>{
 const user=userEvent.setup();const router=mount("/profile");await screen.findByLabelText("نمایش");await user.selectOptions(screen.getByLabelText("نمایش"),"dark");
 await waitFor(()=>expect(document.documentElement.getAttribute("data-color-scheme")).toBe("dark"));await screen.findByText("ذخیره شد");await user.click(screen.getByRole("button",{name:"بستن اعلان"}));
 await user.click(screen.getByRole("button",{name:"خروج"}));await screen.findByRole("heading",{name:"از حساب خارج شدید"});await router.navigate("/notes");await waitFor(()=>expect(router.state.location.pathname).toBe("/login"));
 });
 it("rolls back a failed theme write and tells the learner",async()=>{
 const services=createFixtureServices();services.updateUserPreferences=async()=>{throw new Error("storage unavailable");};const user=userEvent.setup();mount("/profile",services);await screen.findByLabelText("نمایش");await user.selectOptions(screen.getByLabelText("نمایش"),"dark");
 await waitFor(()=>expect(screen.getByRole("alert").textContent).toBe("اطلاعات بارگذاری نشد."));expect(document.documentElement.getAttribute("data-color-scheme")).not.toBe("dark");
 });
});

it("route-error retry retains the preview basename", async()=>{
 const user=userEvent.setup();
 const router=createMemoryRouter([{path:"/broken",loader:()=>{throw new Error("synthetic route failure");},element:<div/>,errorElement:<RouteError/>},{path:"/topics",element:<h1>Recovered</h1>}],{basename:"/preview",initialEntries:["/preview/broken"]});
 render(<ShellApp router={router} runtime={{user:null,isAuthenticated:false,isLoading:false,logout:async()=>{},services:createFixtureServices()}}/>);
 await screen.findByRole("heading",{name:"این صفحه باز نشد."});await user.click(screen.getByRole("button",{name:"تلاش دوباره"}));
 await screen.findByRole("heading",{name:"Recovered"});expect(router.state.location.pathname).toBe("/preview/topics");
});
