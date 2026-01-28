import "dotenv/config";

import express from "express";
import cors from "cors";
import { getNow } from "./tester.js";
import {
  isExpired,
  hasViewsLeft,
  decrementViews,
  getExpiresAt,
} from "./timingLogic.js";

const app = express();
app.use(cors());
app.use(express.json());
let paste = {};
const PORT = 4000;
const initialise = async () => {
  try {
    app.listen(PORT, () => {
      console.log("backend start run on 4000");
    });
  } catch (e) {
    console.log(e);
  }
};

app.get("/api/healthz", (req, res) => {
  try {
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: "server error" });
  }
});

app.post("/api/pastes", (req, res) => {
  try {
    
    const { content, ttl_seconds, max_views } = req.body;
    if (!content) {
      return res.status(400).json({ ok: false, error: "content is required" });
    }
    let id = Math.random().toString(36).slice(2, 10);
    paste[id] = {
      content,
      remaining_views: max_views,
      time_limit: ttl_seconds,
      created_at: getNow(req),
    };
    res.status(201).json({
      ok: true,
      id,
      url: `http://localhost:4000/p/${id}`,
    });
  } catch (e) {
    console.error(e);
  }
});

app.get("/api/pastes/:id", (req, res) => {
  const { id } = req.params;
  const pasteVal = paste[id];
  if (!pasteVal) {
  
    return res.status(404).json({ ok: false, error: "paste not found" });
  }
  let now = getNow(req);
  if (isExpired(pasteVal, now) || !hasViewsLeft(pasteVal)) {
    
    delete paste[id];
    return res.status(404).json({ ok: false });
  }
  decrementViews(pasteVal);

  res.status(200).json({
    content: pasteVal.content,
    remaining_views: pasteVal.remaining_views,
    expires_at: getExpiresAt(pasteVal),
  });
});

app.get("/p/:id",(req,res)=>{
  const { id } = req.params;
  const pasteVal = paste[id];
  if (!pasteVal) {
   
    return res.status(404).json({ ok: false, error: "paste not found" });
  }
  let now = getNow(req);
  if (isExpired(pasteVal, now) || !hasViewsLeft(pasteVal)) {
   
    delete paste[id];
    return res.status(404).json({ ok: false });
  }
  decrementViews(pasteVal);
  
  res.status(200).type("text/html").send(
    `<DOCTYPE html>
    <html>
    <body>
    <pre>${pasteVal.content}</pre>
    </body>
    </html>`
  );
})
initialise();

export default app;
