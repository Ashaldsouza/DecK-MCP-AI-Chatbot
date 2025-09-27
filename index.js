import express from "express";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import fs from "fs";
import os from "os";
import path from "path";
import { exec } from "child_process";
import yaml from "js-yaml";


const app = express();
app.use(express.json());

// Store transports by session ID
const transports = {};

// Helper: run Deck commands asynchronously and quietly
const runDeck = (args) =>
  new Promise((resolve, reject) => {
    const cmd = `deck ${args.join(" ")}`;
    const child = exec(cmd, { shell: true });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => { stdout += data; });
    child.stderr.on("data", (data) => { stderr += data; });

    child.on("close", (code) => {
      if (code !== 0) return reject(stderr || `deck exited with code ${code}`);
      resolve(stdout);
    });
  });

// POST endpoint for MCP requests
app.post("/mcp", async (req, res) => {
  try {
    console.log("[MCP REQUEST]", req.body);

    let sessionId = req.headers["mcp-session-id"]?.trim();
    let transport = sessionId ? transports[sessionId] : null;

    if (!transport) {
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sid) => { transports[sid] = transport; },
      });

      transport.onclose = () => {
        if (transport.sessionId) delete transports[transport.sessionId];
      };

      const server = new McpServer({ name: "deck-mcp-server", version: "1.0.0" });

      // Helper to register tools with logging
      function registerToolWithLogging(name, config, handler) {
        server.registerTool(
          name,
          config,
          async (input) => {
            console.log(`[MCP TOOL] ${name} called`);
            console.log("[Input]:", JSON.stringify(input, null, 2));
            let output;
            try {
              output = await handler(input);
              console.log("[Output]:", JSON.stringify(output, null, 2));
            } catch (err) {
              console.log("[Error]:", err);
              output = { content: [{ type: "text", text: `Error: ${err}` }] };
            }
            return output;
          }
        );
      }

      // ----- Register deck:dump -----
      registerToolWithLogging(
        "deck_dump",
        {
          title: "Dump Kong Configuration",
          description: "Runs `deck gateway dump` on Kong",
          inputSchema: { kong_addr: z.string(), format: z.string().optional() },
        },
        async ({ kong_addr, format }) => {
          const fmt = format || "json";
          const out = await runDeck(["gateway", "dump", "--kong-addr", kong_addr, "--format", fmt]);
          return { content: [{ type: "text", text: JSON.stringify(JSON.parse(out), null, 2) }] };
        }
      );

      // ----- Register deck:sync -----
      registerToolWithLogging(
        "deck_sync",
        {
          title: "Sync Kong Configuration",
          description: "Runs `deck gateway sync` using a JSON configuration",
          inputSchema: { kong_addr: z.string(), config_json: z.any() },
        },
        async ({ kong_addr, config_json }) => {
          const tmpPath = path.join(os.tmpdir(), `deck_gateway_sync_${Date.now()}.json`);
          fs.writeFileSync(tmpPath, JSON.stringify(config_json, null, 2));
          const out = await runDeck(["gateway", "sync", tmpPath, "--yes", "--kong-addr", kong_addr]);
          fs.unlinkSync(tmpPath);
          return { content: [{ type: "text", text: out }] };
        }
      );

      // ----- Register deck:diff -----
      registerToolWithLogging(
        "deck_diff",
        {
          title: "Diff Kong Configuration",
          description: "Runs `deck gateway diff` to show differences between provided JSON config and live Kong config",
          inputSchema: { kong_addr: z.string(), config_json: z.any() },
        },
        async ({ kong_addr, config_json }) => {
          const tmpPath = path.join(os.tmpdir(), `deck_gateway_diff_${Date.now()}.json`);
          fs.writeFileSync(tmpPath, JSON.stringify(config_json, null, 2));
          const out = await runDeck(["gateway", "diff", tmpPath, "--kong-addr", kong_addr]);
          fs.unlinkSync(tmpPath);
          return { content: [{ type: "text", text: out }] };
        }
      );


// ----- Add Basic Auth Plugin -----
registerToolWithLogging(
  "deck_add_basic_auth",
  {
    title: "Add Basic Auth Plugin to Service",
    description: "Adds the basic-auth plugin to a specified Kong service using Admin API",
    inputSchema: {
      kong_addr: z.string(),
      service_name: z.string()
    },
  },
  async ({ kong_addr, service_name }) => {
    try {
      const url = `${kong_addr}/services/${service_name}/plugins`;
      const body = new URLSearchParams({
        name: "basic-auth",
        "config.hide_credentials": "true"
      });

      const response = await fetch(url, { method: "POST", body });
      const result = await response.json();

      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${err}` }] };
    }
  }
);

registerToolWithLogging(
  "deck_add_basic_auth_route",
  {
    title: "Add Basic Auth to Route",
    description: "Adds the basic-auth plugin to a specified Kong route",
    inputSchema: {
      kong_addr: z.string(),
      route_name: z.string()
    },
  },
  async ({ kong_addr, route_name }) => {
    try {
      const url = `${kong_addr}/routes/${route_name}/plugins`;
      const body = new URLSearchParams({
        name: "basic-auth",
        "config.hide_credentials": "true"
      });

      const response = await fetch(url, { method: "POST", body });
      const result = await response.json();

      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${err}` }] };
    }
  }
);
registerToolWithLogging(
  "deck_add_key_auth_service",
  {
    title: "Add Key Auth to Service",
    description: "Adds the key-auth plugin to a specified Kong service",
    inputSchema: {
      kong_addr: z.string(),
      service_name: z.string()
    },
  },
  async ({ kong_addr, service_name }) => {
    try {
      const url = `${kong_addr}/services/${service_name}/plugins`;
      const body = new URLSearchParams({
        name: "key-auth",
        "config.key_names[]": "apikey"
      });

      const response = await fetch(url, { method: "POST", body });
      const result = await response.json();

      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${err}` }] };
    }
  }
);
registerToolWithLogging(
  "deck_add_key_auth_route",
  {
    title: "Add Key Auth to Route",
    description: "Adds the key-auth plugin to a specified Kong route",
    inputSchema: {
      kong_addr: z.string(),
      route_name: z.string()
    },
  },
  async ({ kong_addr, route_name }) => {
    try {
      const url = `${kong_addr}/routes/${route_name}/plugins`;
      const body = new URLSearchParams({
        name: "key-auth",
        "config.key_names[]": "apikey"
      });

      const response = await fetch(url, { method: "POST", body });
      const result = await response.json();

      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (err) {
      return { content: [{ type: "text", text: `Error: ${err}` }] };
    }
  }
);

      // ----- Register deck:convert -----
      registerToolWithLogging(
        "deck_openapi_convert",
        {
          title: "Convert OpenAPI Spec to Deck",
          description: "Converts an OpenAPI spec file to Deck format (YAML or JSON)",
          inputSchema: {
            spec_file_path: z.string(),
            output_file_path: z.string().optional(),
            output_format: z.enum(["yaml", "json"]).optional().default("yaml"),
          },
        },
        async ({ spec_file_path, output_file_path, output_format }) => {
          const ext = output_format === "json" ? "json" : "yaml";
          const outPath = output_file_path || path.join(os.tmpdir(), `deck_convert_${Date.now()}.${ext}`);
          const tmpYaml = output_format === "json" && outPath.endsWith(".json")
            ? outPath.replace(".json", ".yaml")
            : outPath;

          await runDeck(["file", "openapi2kong", "--spec", spec_file_path, "--output-file", tmpYaml]);

          let result;
          if (output_format === "json") {
            const yamlContent = fs.readFileSync(tmpYaml, "utf-8");
            const obj = yaml.load(yamlContent);
            result = JSON.stringify(obj, null, 2);
            fs.writeFileSync(outPath, result, "utf-8");
          } else {
            result = fs.readFileSync(tmpYaml, "utf-8");
          }

          return { content: [{ type: "text", text: result }] };
        }
      );

      // Connect server to transport
      await server.connect(transport);
      sessionId = transport.sessionId;
    }

    // Handle initialize requests first
    if (isInitializeRequest(req.body)) {
      await transport.handleRequest(req, res, req.body);
      return;
    }

    // Handle normal MCP requests
    await transport.handleRequest(req, res, req.body);

  } catch (err) {
    console.error("[MCP ERROR]", err);
    res.status(500).send(`Server error: ${err}`);
  }
});

// GET / DELETE for session notifications
const handleSessionRequest = async (req, res) => {
  const sessionId = req.headers["mcp-session-id"]?.trim();
  if (!sessionId || !transports[sessionId]) return res.status(400).send("Invalid session ID");
  await transports[sessionId].handleRequest(req, res);
};

app.get("/mcp", handleSessionRequest);
app.delete("/mcp", handleSessionRequest);

// Start server
app.listen(3000, "0.0.0.0", () => {
  console.error("Deck MCP Server running on Streamable HTTP at http://127.0.0.1:3000/mcp");
});
