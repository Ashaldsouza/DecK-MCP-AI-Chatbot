# AgenticAI-DeckMCP

**AgenticAI-DeckMCP** is an **Agentic AI tool** with **Deck MCP Server support**, allowing you to interact with Kong Gateway via Deck commands or directly via the Admin API. The server exposes tools to dump, sync, diff, and convert Kong configurations, as well as add **basic-auth** and **key-auth** plugins to services or routes.

---

## Features

- Run **Deck commands** via MCP server: `dump`, `sync`, `diff`, `openapi convert`
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

2.Install dependencies:
```bash
npm install

3.Start the MCP server:
```bash
node index.js

The server will run on http://127.0.0.1:3000/mcp

