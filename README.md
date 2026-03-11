# arkit-viz

Real-time 3D visualizer for ARKit device tracking data. Receives position, quaternion rotation, and touch data over OSC/UDP and renders it in the browser with Three.js.

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-r162-000000?logo=three.js)
![License](https://img.shields.io/badge/license-MIT-blue)

## What it does

- Listens for **OSC messages** on UDP port 3333 (position, rotation, touch)
- Forwards data to the browser over **WebSocket**
- Renders a 3D phone model that mirrors your device's real-world orientation and position
- Draws a motion trail, touch indicators, and live telemetry HUD
- Includes a **manual axis alignment tool** with presets for ARKit Y-Up, Z-Up, and Unity conventions
- Displays your **LAN IP** on screen so you can quickly configure your sending app

## Quick start

```bash
git clone https://github.com/glaseagle/arkit-viz.git
cd arkit-viz
npm install
npm start
```

Open **http://localhost:3006** in your browser.

Point your OSC sender (e.g. [ZIG SIM](https://zig-project.com/), [GyrOSC](https://apps.apple.com/app/gyrosc/id418751595), or a custom ARKit app) at your computer's IP on port **3333**.

## OSC address patterns

The server auto-detects common ARKit OSC address patterns:

| Data | Matched keywords | Values |
|------|-----------------|--------|
| Position | `pos`, `translation`, `location` | `[x, y, z]` floats |
| Rotation | `quat`, `rot`, `orient`, `attitude` | `[w, x, y, z]` or `[x, y, z, w]` floats |
| Touch | `touch`, `tap`, `point` | `[x, y]` or `[x, y, radius]` floats |

Unrecognized addresses are forwarded as raw messages and displayed in the debug log.

## Axis alignment

Different apps send ARKit data in different coordinate conventions. The built-in alignment panel lets you:

- Swap quaternion component order (WXYZ vs XYZW)
- Remap and negate rotation axes (Qx/Qy/Qz)
- Remap and negate position axes (Px/Py/Pz)
- Apply presets: **Default**, **ARKit Y-Up**, **ARKit Z-Up**, **Unity**

Settings persist in `localStorage`.

## Architecture

```
iPhone/iPad                    Server (Node.js)              Browser
───────────                    ────────────────              ───────
ARKit + OSC app  ──UDP:3333──▶  osc (UDP listener)
                                    │
                                    ▼
                               WebSocket server  ──WS──▶  Three.js renderer
                                    │                      + HUD overlay
                               HTTP static server ──▶  index.html
```

Single file frontend (`index.html`), single file backend (`server.js`). No build step.

## Configuration

Edit the top of `server.js`:

```js
const HTTP_PORT = 3006;  // Web UI port
const OSC_PORT = 3333;   // UDP listener port
```

## Requirements

- Node.js 18+
- A device sending OSC data on the same network
