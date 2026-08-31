import { GoogleGenerativeAI } from "@google/generative-ai";
import readline from "readline";
import dotenv from "dotenv";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

dotenv.config();

async function startChat() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log("⚠️ GEMINI_API_KEY is missing in .env!");
    process.exit(1);
  }

  console.log("🔄 Starting True MCP Architecture...");
  
  // ── 1. Start the MCP Client & Connect to our Server (index.js) ──
  const transport = new StdioClientTransport({
    command: "node",
    args: ["index.js"] // Spawns our MCP Server in the background!
  });

  const mcpClient = new Client(
    { name: "ai-chat-client", version: "1.0.0" },
    { capabilities: {} }
  );

  console.log("🔌 Connecting MCP Client to MCP Server...");
  await mcpClient.connect(transport);
  
  // ── 2. Dynamically fetch tools from the MCP Server ──
  console.log("📜 Fetching tools from server...");
  const serverTools = await mcpClient.listTools();
  
  // Convert MCP tools format to Gemini's expected format
  const functionDeclarations = serverTools.tools.map(tool => ({
    name: tool.name,
    description: tool.description,
    parameters: {
      type: "OBJECT",
      properties: Object.fromEntries(
        Object.entries(tool.inputSchema?.properties || {}).map(([key, val]) => [
          key,
          { 
            type: val.type === "string" ? "STRING" : val.type === "number" ? "NUMBER" : "BOOLEAN", 
            description: val.description 
          }
        ])
      ),
      required: tool.inputSchema?.required || [],
    }
  }));

  // ── 3. Initialize Gemini AI ──
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-3.5-flash",
    tools: [{ functionDeclarations }],
  });

  const chat = model.startChat();

  console.log("\n╔══════════════════════════════════════════════════════════════════╗");
  console.log("║     🤖 TRUE MCP AI CLIENT CONNECTED TO SERVER ONLINE            ║");
  console.log("╚══════════════════════════════════════════════════════════════════╝");
  
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  const ask = () => {
    rl.question("\x1b[36mYou ➔ \x1b[0m", async (userInput) => {
      if (userInput.trim().toLowerCase() === "exit") {
        console.log("👋 Goodbye!");
        process.exit(0);
      }
      if (!userInput.trim()) return ask();

      try {
        process.stdout.write("\x1b[33m🤖 AI Thinking...\x1b[0m\r");
        let result = await chat.sendMessage(userInput);
        let response = result.response;

        // Handle Function Calls requested by Gemini
        while (response.functionCalls() && response.functionCalls().length > 0) {
          const call = response.functionCalls()[0];
          console.log(`\n\x1b[35m⚡ [Routing to MCP Server]\x1b[0m Calling Tool: ${call.name}`);

          // ── 4. The Client asks the Server to execute the tool! ──
          const mcpResult = await mcpClient.callTool({
            name: call.name,
            arguments: call.args
          });

          // Extract text from the MCP Server response
          const toolTextOutput = mcpResult.content[0].text;

          // Send the server's output back to the AI
          result = await chat.sendMessage([
            {
              functionResponse: {
                name: call.name,
                response: { data: toolTextOutput },
              },
            },
          ]);
          response = result.response;
        }

        // Print final text
        let replyText = "";
        try { replyText = response.text(); } catch (e) {
          if (response.candidates && response.candidates[0].content.parts.length > 0) {
            replyText = response.candidates[0].content.parts.map(p => p.text).join("");
          }
        }
        console.log(`\x1b[32mAI ➔ \x1b[0m${replyText || "Done!"}\n`);
      } catch (err) {
        console.error(`\x1b[31m❌ Error: ${err.message}\x1b[0m\n`);
      }
      ask();
    });
  };
  ask();
}

startChat().catch(console.error);
