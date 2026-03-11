const osc = require("osc");
const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");
const WebSocket = require("ws");

const HTTP_PORT = 3006;
const OSC_PORT = 3333;

// --- HTTP Server ---
function getLanIP() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === "IPv4" && !net.internal) return net.address;
    }
  }
  return "127.0.0.1";
}

const server = http.createServer((req, res) => {
  if (req.url === "/api/ip") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ip: getLanIP(), oscPort: OSC_PORT }));
    return;
  }
  let filePath = req.url === "/" ? "/index.html" : req.url;
  const ext = path.extname(filePath);
  const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };
  const full = path.join(__dirname, filePath);
  if (!fs.existsSync(full)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "Content-Type": types[ext] || "application/octet-stream" });
  fs.createReadStream(full).pipe(res);
});

// --- WebSocket ---
const wss = new WebSocket.Server({ server });
const broadcast = (data) => {
  const msg = JSON.stringify(data);
  wss.clients.forEach((c) => { if (c.readyState === WebSocket.OPEN) c.send(msg); });
};

// --- OSC UDP listener ---
const udpPort = new osc.UDPPort({ localAddress: "0.0.0.0", localPort: OSC_PORT, metadata: true });

udpPort.on("message", (msg) => {
  const addr = msg.address;
  const args = msg.args.map((a) => a.value);
  console.log(`\x1b[35m[OSC IN]\x1b[0m ${addr} → ${args.join(', ')}`);

  // Normalize common ARKit OSC address patterns
  const lower = addr.toLowerCase();

  if (lower.includes("pos") || lower.includes("translation") || lower.includes("location")) {
    broadcast({ type: "position", values: args.slice(0, 3) });
  } else if (lower.includes("quat") || lower.includes("rot") || lower.includes("orient") || lower.includes("attitude")) {
    broadcast({ type: "rotation", values: args.slice(0, 4) });
  } else if (lower.includes("touch") || lower.includes("tap") || lower.includes("point")) {
    // Could be [x, y] or [x, y, radius]
    broadcast({ type: "touch", values: args.slice(0, 3) });
  } else {
    // Forward unknown addresses for debugging
    broadcast({ type: "raw", address: addr, values: args });
  }
});

udpPort.on("ready", () => {
  console.log(`\x1b[36m[OSC]\x1b[0m Listening on UDP :${OSC_PORT}`);
});

udpPort.on("error", (err) => {
  console.error("[OSC] Error:", err.message);
});

udpPort.open();

server.listen(HTTP_PORT, () => {
  console.log(`\x1b[32m[HTTP]\x1b[0m http://localhost:${HTTP_PORT}`);
  console.log(`\x1b[33m[WS]\x1b[0m   WebSocket on same port`);
});
