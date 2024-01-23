import { createServer } from "http";
import type { IncomingMessage, ServerResponse } from "http";
import { fileChangeEmitter } from "./watchfiles";
import type { FileEvents } from "./watchfiles";

type SseEventType = "message" | "error";

type Connection = {
  request: IncomingMessage;
  response: ServerResponse;
};

// Array to store the active connections
const activeConnections: Connection[] = [];

// Function to send SSE to connected clients
function sendSse(response: ServerResponse, data: string, event?: SseEventType) {
  response.write(`event:${event ? event : "message"}\ndata: ${data}\n\n`);
}

// Function to handle file events emitted by `fileChangeEmitter`
function eventHandler(event: FileEvents, errorMessage?: string) {
  const sseConnection = activeConnections.find(
    (connection) => connection.request.url === "/events",
  );

  let data = "";
  let clientEvent: SseEventType = "message";

  if (event === "change" || event === "unlink") {
    data = "reload";
  }
  if (event === "error") {
    data = errorMessage ?? "Unknown Error";
    clientEvent = "error";
  }

  if (event === "close") {
    // End the response
    sseConnection?.response.end();
  }
  if (sseConnection) {
    sendSse(sseConnection.response, data, clientEvent);
    activeConnections.splice(activeConnections.indexOf(sseConnection), 1);
  }
}

// Respond to the client based on event emitted by `fileChangeEmitter`
fileChangeEmitter
  .on("change", () => {
    eventHandler("change");
  })
  .on("unlink", () => eventHandler("unlink"))
  .on("close", () => eventHandler("close"))
  .on("error", ({ errMsg }) => eventHandler("close", errMsg));

// script to send to client to listen to SSE
const clientEventScript = `
  const eventSource = new EventSource("http://localhost:8000/events");
  eventSource.addEventListener("message", (e)=>{
    if (event.data === "reload") {
      console.log("Reloading page...");
      location.reload();
    }
  })
  eventSource.addEventListener("error", (e)=>{
    console.error("Error occurred", e)
  })
  eventSource.addEventListener("close", (e)=>{
    console.log("Connection closed")
    eventSource.close();
  })
`;

const server = createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  // serve liveReloadScript in the path `/livereload.js`
  if (req.url === "/livereload.js" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/javascript" });
    res.end(clientEventScript);
  } else if (req.url === "/events") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      // biome-ignore lint/style/useNamingConvention: <explanation>
      Connection: "keep-alive",
    });

    sendSse(res, "Server Connected");
    activeConnections.push({ request: req, response: res });
  } else {
    res.writeHead(404, { "Content-Type": "text-plain" });
    res.end("404 Not Found");
  }
});

server.listen(8000);
