# AgenticAI-DeckMCP

**AgenticAI-DeckMCP** is an **Agentic AI tool** with **Deck MCP Server support**, allowing you to interact with Kong Gateway via Deck commands or directly via the Admin API. The server exposes tools to dump, sync, diff, and convert Kong configurations, as well as add **basic-auth** and **key-auth** plugins to services or routes.

---

## Features

- Run **Deck commands** via MCP server
- Add **basic-auth** or **key-auth** plugin to **services** or **routes**
- Compatible with **Kong 3.x**
- Works with **Cursor** or any MCP-compatible client

---

## Installation

### Prerequisites

- **Node.js >= 18** (supports native `fetch`)
- **npm**
- **Deck CLI** installed globally
- **Kong Admin API** running (default: `http://localhost:8001`)

---

### Steps

1. Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/AgenticAI-DeckMCP.git
cd AgenticAI-DeckMCP
```
2.Install dependencies:
```bash
npm install
```
3.Start the MCP server:
```bash
node index.js
```
The server will run on http://127.0.0.1:3000/mcp

### Configure Cursor
 1.Open Cursor and create a file in `.cursor\mcp.json`
 2.Add a new server with the following configuration:
 ```bash
 {
  "mcpServers": {
    "deck_mcp_server": {
      "type": "http",
      "url": "http://127.0.0.1:3000/mcp",
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```
Save and start a Cursor session with this MCP server.

### Verify Tools

Once the MCP server is running in Cursor:

  1.Open a new session

  2.Check the available tools (deck_dump, deck_sync, deck_diff, deck_openapi_convert, deck_add_basic_auth, deck_add_key_auth)
