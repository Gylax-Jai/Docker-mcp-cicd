import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import mongoose from "mongoose";
import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

// ── MongoDB Setup ─────────────────────────────────────────────────────────────
const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017/favorites_db";

const favoriteSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    favColor: { type: String, required: true, trim: true },
    favFood: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

const Favorite = mongoose.model("Favorite", favoriteSchema);

async function connectMongo() {
  if (mongoose.connection.readyState === 0) {
    try {
      await mongoose.connect(MONGO_URL);
    } catch (err) {
      console.error("MongoDB connection failed:", err.message);
    }
  }
}

// ── Initialize MCP Server ─────────────────────────────────────────────────────
const server = new Server(
  {
    name: "favorites-docker-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ── Define Available Tools ────────────────────────────────────────────────────
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // ── MongoDB Tools ──
      {
        name: "mongo_get_favorites",
        description: "Fetch all user favorite submissions stored in the MongoDB database.",
        inputSchema: {
          type: "object",
          properties: {
            limit: {
              type: "number",
              description: "Maximum number of records to return (defaults to 50)",
            },
          },
        },
      },
      {
        name: "mongo_add_favorite",
        description: "Insert a new favorite submission (name, color, food) directly into MongoDB.",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Name of the person" },
            favColor: { type: "string", description: "Their favorite color" },
            favFood: { type: "string", description: "Their favorite food" },
          },
          required: ["name", "favColor", "favFood"],
        },
      },
      {
        name: "mongo_get_stats",
        description: "Analyze MongoDB data and return statistics: total count, most popular color, and top favorite foods.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },

      // ── Docker Tools ──
      {
        name: "docker_list_containers",
        description: "List all Docker containers with their status, ports, and image names.",
        inputSchema: {
          type: "object",
          properties: {
            all: {
              type: "boolean",
              description: "If true, shows both running and stopped containers (docker ps -a)",
            },
          },
        },
      },
      {
        name: "docker_get_logs",
        description: "Fetch recent terminal logs of a specific Docker container (e.g. 'backend', 'frontend', 'mongo').",
        inputSchema: {
          type: "object",
          properties: {
            containerName: {
              type: "string",
              description: "Name of the container (e.g., 'backend', 'frontend', 'mongo')",
            },
            lines: {
              type: "number",
              description: "Number of recent log lines to retrieve (default: 30)",
            },
          },
          required: ["containerName"],
        },
      },
      {
        name: "docker_system_health",
        description: "Check if Docker Engine is responding and inspect Docker version and disk usage.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});

// ── Handle Tool Calls ─────────────────────────────────────────────────────────
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    await connectMongo();

    switch (name) {
      // 1. Get All Favorites
      case "mongo_get_favorites": {
        const limit = args?.limit || 50;
        const items = await Favorite.find().sort({ createdAt: -1 }).limit(limit);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { count: items.length, favorites: items },
                null,
                2
              ),
            },
          ],
        };
      }

      // 2. Add New Favorite
      case "mongo_add_favorite": {
        const { name: personName, favColor, favFood } = args;
        const created = await Favorite.create({
          name: personName,
          favColor,
          favFood,
        });
        return {
          content: [
            {
              type: "text",
              text: `✅ Successfully saved to MongoDB!\nEntry ID: ${created._id}\nName: ${created.name}\nColor: ${created.favColor}\nFood: ${created.favFood}`,
            },
          ],
        };
      }

      // 3. Get Stats
      case "mongo_get_stats": {
        const total = await Favorite.countDocuments();
        const colorAggregation = await Favorite.aggregate([
          { $group: { _id: "$favColor", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]);
        const foodAggregation = await Favorite.aggregate([
          { $group: { _id: "$favFood", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  totalSubmissions: total,
                  colorBreakdown: colorAggregation,
                  foodBreakdown: foodAggregation,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      // 4. List Docker Containers
      case "docker_list_containers": {
        const flag = args?.all ? "-a" : "";
        const { stdout, stderr } = await execPromise(`docker ps ${flag} --format "{{json .}}"`);
        if (stderr && !stdout) {
          throw new Error(stderr);
        }

        const lines = stdout.trim().split("\n").filter(Boolean);
        const parsed = lines.map((l) => JSON.parse(l));

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ count: parsed.length, containers: parsed }, null, 2),
            },
          ],
        };
      }

      // 5. Get Docker Logs
      case "docker_get_logs": {
        const { containerName, lines = 30 } = args;
        const { stdout, stderr } = await execPromise(
          `docker logs --tail ${lines} ${containerName}`
        );
        const output = stdout || stderr || "No logs available.";
        return {
          content: [
            {
              type: "text",
              text: `Logs for [${containerName}] (last ${lines} lines):\n\n${output}`,
            },
          ],
        };
      }

      // 6. Docker System Health
      case "docker_system_health": {
        const { stdout: versionOut } = await execPromise("docker --version");
        const { stdout: psOut } = await execPromise("docker ps -q");
        const runningCount = psOut.trim().split("\n").filter(Boolean).length;

        return {
          content: [
            {
              type: "text",
              text: `Docker Engine Status: ONLINE ✅\n${versionOut.trim()}\nCurrently Running Containers: ${runningCount}`,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: `❌ Error executing tool '${name}': ${error.message}`,
        },
      ],
    };
  }
});

// ── Start Server via STDIO ────────────────────────────────────────────────────
async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("🚀 Favorites + Docker MCP Server running on STDIO");
}

run().catch((err) => {
  console.error("Fatal error starting MCP server:", err);
  process.exit(1);
});
