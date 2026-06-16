const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;
const dataDir = path.join(__dirname, "data");
const requestsFile = path.join(dataDir, "requests.json");

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
if (!fs.existsSync(requestsFile)) fs.writeFileSync(requestsFile, "[]");

app.use(express.json());
app.use(express.static(__dirname));

app.get("/api/requests", (req, res) => {
  const requests = JSON.parse(fs.readFileSync(requestsFile, "utf8"));
  res.json(requests.reverse());
});

app.post("/api/requests", (req, res) => {
  const requests = JSON.parse(fs.readFileSync(requestsFile, "utf8"));

  const request = {
    id: Date.now(),
    ...req.body,
    status: "Open",
    createdAt: new Date().toISOString()
  };

  requests.push(request);
  fs.writeFileSync(requestsFile, JSON.stringify(requests, null, 2));

  res.status(201).json(request);
});

app.listen(PORT, () => {
  console.log(`Friend In Need running at http://localhost:${PORT}`);
});
