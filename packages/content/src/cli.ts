import { loadRawContent } from "./load.js";
import { validateContent } from "./validate.js";

const { errors, counts } = validateContent(loadRawContent(), {
  expectedAnchors: 17,
  expectedOrigins: 6,
  minEvents: 28,
});

if (errors.length > 0) {
  console.error(`Content invalid (${errors.length} problems):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(
  `Content ok: ${counts.anchors} anchors, ${counts.events} events, ${counts.origins} origins, ${counts.parties} parties in ${counts.blocs} blocs`,
);
