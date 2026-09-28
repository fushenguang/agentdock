import { serve } from "srvx";
import server from "./dist/server/server.js";

const port = Number(process.env.PORT ?? 3000);
const hostname = process.env.HOST ?? "0.0.0.0";

serve({
  fetch: (request) => server.fetch(request),
  port,
  hostname,
});
