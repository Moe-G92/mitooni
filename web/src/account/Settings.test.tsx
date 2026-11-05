import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { it, expect } from "vitest";
import { BrowserRouter } from "react-router";
import Settings from "./Settings";
import { AccountProvider, useAccount } from "./state";
import { AccountClient } from "./transport";
import { SessionController } from "@/auth/session";
const profile = {
  name: "A",
  locale: "fa",
  theme: "system",
  targets: { overall: 6, listening: 6, reading: 6, writing: 6, speaking: 6 },
  testDate: null,
  currentLevel: null,
  weeklyHours: 6,
  showFlag: true,
  notifications: { email: false, reminders: false },
  onboarded: true,
  revision: 1,
};
const envelope = (name: string, revision: number) => ({
  identity: { id: "a", email: "a@example.invalid" },
  membership: {
    status: "active",
    roles: ["learner"],
    entitlements: ["profile:write"],
  },
  state: "ready",
  profile: { ...profile, name, revision },
});
function View() {
  return useAccount().account?.profile ? <Settings /> : null;
}
it("locks editable fields during save and preserves an accessible saved confirmation after ACK", async () => {
  let resolve!: (r: Response) => void;
  const delayed = new Promise<Response>((r) => {
    resolve = r;
  });
  const session = new SessionController({
    initialize: async () => null,
    subscribe: () => () => {},
    signIn: async () => ({ subject: "a", token: "a" }),
    refresh: async () => null,
    signOut: async () => {},
  });
  await session.start();
  await session.signIn("a", "");
  const client = new AccountClient(session, "", async (_url, options) =>
    options?.method === "PATCH" ? delayed : Response.json(envelope("A", 1)),
  );
  render(
    <BrowserRouter>
      <AccountProvider session={session} client={client}>
        <View />
      </AccountProvider>
    </BrowserRouter>,
  );
  const name = await screen.findByDisplayValue("A");
  fireEvent.change(name, { target: { value: "saved A" } });
  fireEvent.submit(name.closest("form")!);
  await waitFor(() => expect(name).toBeDisabled());
  await act(async () => {
    resolve(Response.json(envelope("saved A", 2)));
  });
  expect(await screen.findByDisplayValue("saved A")).not.toBeDisabled();
  expect(screen.getByRole("status")).not.toBeEmptyDOMElement();
  fireEvent.change(screen.getByDisplayValue("saved A"), {
    target: { value: "new unsaved edit" },
  });
  expect(screen.queryByRole("status")).toBeNull();
});
