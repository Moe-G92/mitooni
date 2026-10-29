/*
 * Writes every API shape as JSON Schema to docs/handoff/schemas, so the backend
 * can generate Pydantic models (for example with datamodel-code-generator).
 *
 *   npm run export:schemas
 */
import { mkdirSync, writeFileSync } from "node:fs";
import * as path from "node:path";
import { z } from "zod";
import { allSchemas } from "../src/api/schemas";

const OUT = path.resolve(import.meta.dirname, "../../docs/handoff/schemas");
mkdirSync(OUT, { recursive: true });

for (const [name, schema] of Object.entries(allSchemas)) {
  const json = z.toJSONSchema(schema, { target: "draft-2020-12", unrepresentable: "any" });
  writeFileSync(path.join(OUT, `${name}.json`), JSON.stringify({ title: name, ...json }, null, 2) + "\n");
  console.log("schema", name);
}
