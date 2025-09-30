# AgenticAI-DeckMCP

**AgenticAI-DeckMCP** is a powerful Agentic AI tool with integrated **Deck MCP Server** support that streamlines Kong Gateway management. It can take an API specification file, convert it into Deck format, and seamlessly sync routes, services, and upstreams—all without the need for manual curl commands. With **natural language prompts** and integration with Cursor, it makes configuring and managing Kong smoother, faster, and more intuitive than ever.

---

## Features

- Convert **spec files** directly into **Deck** configurations and Run **Deck commands** via MCP server
- Seamlessly sync **routes**, **services**, and **upstreams**
- Apply **plugins** with a single natural language prompt
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
 1.Open Cursor and create a file in `.cursor\mcp.json`.
 
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

  2.Check the available tools (deck_dump, deck_sync, deck_diff, deck_openapi_convert, deck_add_basic_auth, deck_add_key_auth).

### Notes 

1.Ensure Deck CLI is compatible with your Kong version (3.x or above)

2.When adding plugins, either service_name or route_name must be provided

3.For Cursor, always start the MCP server first before launching a session

---
## Contributors
Developed By : AshalP@verifone.com , AkashA@verifone.com<br>
Designed By  : SatyajitS3@verifone.com, Prema.Namasivayam@verifone.com , RitikB1@verifone.com
