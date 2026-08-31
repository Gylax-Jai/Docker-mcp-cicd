# 🤖 Favorites + Docker MCP Server

A custom Model Context Protocol (MCP) server that enables AI Assistants (Claude Desktop, Cursor, Antigravity) to directly query your MongoDB database and manage your Docker containers.

---

## 🛠️ Available AI Tools

### 🍃 MongoDB Tools
- `mongo_get_favorites`: AI retrieves all submissions from MongoDB.
- `mongo_add_favorite`: AI saves a new favorite entry to MongoDB.
- `mongo_get_stats`: AI computes total counts, top color breakdown, and top food breakdown.

### 🐳 Docker Tools
- `docker_list_containers`: AI lists running and stopped containers.
- `docker_get_logs`: AI reads live logs from `backend`, `frontend`, or `mongo`.
- `docker_system_health`: AI inspects Docker Engine status.

---

## 🚀 How to Test Visually (MCP Inspector)

Run the official MCP Inspector UI:
```bash
cd mcp-server
npm run inspect
```
This launches an interactive browser UI where you can test calling each tool directly!

---

## ⚙️ How to Add to Claude Desktop

Add this configuration to your Claude Desktop config file:
- **Windows Path:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "favorites-docker-manager": {
      "command": "node",
      "args": [
        "C:\\Users\\jaisi\\OneDrive\\Desktop\\DOCKER EXERCISE\\mcp-server\\index.js"
      ]
    }
  }
}
```

Restart Claude Desktop, and you can start asking:
- *"What is the most popular favorite food in our database?"*
- *"Are my backend and frontend Docker containers running properly?"*
- *"Show me the last 10 lines of the backend container logs."*
