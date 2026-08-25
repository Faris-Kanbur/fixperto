import express from "express";
import cors from "cors";
import { seedIfEmpty } from "./db/seed.js";
import { makeCrudRouter } from "./routes/makeCrudRouter.js";
import adminRouter from "./routes/admin.js";

seedIfEmpty();

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));

app.get("/api/health", (req, res) => res.json({ ok: true, service: "fixperto-backend" }));

app.use("/api/mechanics", makeCrudRouter("mechanics"));
app.use("/api/owners", makeCrudRouter("owners"));
app.use("/api/vehicles", makeCrudRouter("vehicles"));
app.use("/api/appointments", makeCrudRouter("appointments"));
app.use("/api/listings", makeCrudRouter("listings"));
app.use("/api/jobs", makeCrudRouter("job_listings"));
app.use("/api/tickets", makeCrudRouter("support_tickets"));
app.use("/api/quote-requests", makeCrudRouter("quote_requests"));
app.use("/api/quote-offers", makeCrudRouter("quote_offers"));
app.use("/api/admin", adminRouter);

app.use((req, res) => res.status(404).json({ error: "Not found" }));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Fixperto backend listening on http://localhost:${PORT}`);
});
