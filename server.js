const express = require("express");
const path = require("path");
const { MongoClient } = require("mongodb");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const DB_NAME = "smart_campus_complaints";

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

let complaints;

const categories = [
  "Electrical", "Plumbing", "Wi-Fi / Network",
  "Classroom", "Cleanliness", "Furniture", "Other"
];
const priorities = ["Low", "Medium", "High"];
const statuses = ["Open", "In Progress", "Resolved"];

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function makeTicketId() {
  const date = new Date();
  const day = date.toISOString().slice(0, 10).replaceAll("-", "");
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `CAMP-${day}-${suffix}`;
}

function validateComplaint(body) {
  const studentName = clean(body.studentName);
  const studentEmail = clean(body.studentEmail).toLowerCase();
  const location = clean(body.location);
  const category = clean(body.category);
  const title = clean(body.title);
  const description = clean(body.description);
  const priority = clean(body.priority || "Medium");

  if (!studentName || !studentEmail || !location || !category || !title || !description) {
    return { error: "Please complete all required fields." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(studentEmail)) {
    return { error: "Enter a valid email address." };
  }
  if (!categories.includes(category)) return { error: "Choose a valid category." };
  if (!priorities.includes(priority)) return { error: "Choose a valid priority." };
  if (title.length > 100) return { error: "Title must be 100 characters or fewer." };
  if (description.length > 1000) return { error: "Description must be 1000 characters or fewer." };

  return { value: { studentName, studentEmail, location, category, title, description, priority } };
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "Smart Campus Complaint Tracker" });
});

app.get("/api/complaints", async (req, res) => {
  try {
    const { search = "", status = "All", category = "All" } = req.query;
    const filter = {};
    if (status !== "All" && statuses.includes(status)) filter.status = status;
    if (category !== "All" && categories.includes(category)) filter.category = category;

    const query = clean(search);
    if (query) {
      const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      filter.$or = [
        { ticketId: regex }, { title: regex }, { location: regex },
        { studentName: regex }, { category: regex }, { description: regex }
      ];
    }

    const results = await complaints.find(filter).sort({ createdAt: -1 }).limit(200).toArray();
    res.json(results);
  } catch (error) {
    console.error("List complaints error:", error);
    res.status(500).json({ error: "Could not load complaints." });
  }
});

app.get("/api/stats", async (_req, res) => {
  try {
    const rows = await complaints.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]).toArray();
    const stats = { total: 0, open: 0, inProgress: 0, resolved: 0 };
    for (const row of rows) {
      stats.total += row.count;
      if (row._id === "Open") stats.open = row.count;
      if (row._id === "In Progress") stats.inProgress = row.count;
      if (row._id === "Resolved") stats.resolved = row.count;
    }
    res.json(stats);
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({ error: "Could not load dashboard statistics." });
  }
});

app.get("/api/analytics", async (_req, res) => {
  try {
    const [categoryRows, monthlyRows, resolvedRows] = await Promise.all([
      complaints.aggregate([
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } }
      ]).toArray(),
      complaints.aggregate([
        { $match: { createdAt: { $type: "date" } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, count: { $sum: 1 } } },
        { $sort: { _id: -1 } },
        { $limit: 6 }
      ]).toArray(),
      complaints.find({ status: "Resolved", createdAt: { $type: "date" }, updatedAt: { $type: "date" } }, {
        projection: { createdAt: 1, updatedAt: 1 }
      }).toArray()
    ]);
    const durations = resolvedRows
      .map(item => (new Date(item.updatedAt) - new Date(item.createdAt)) / 3600000)
      .filter(hours => Number.isFinite(hours) && hours >= 0);
    const averageResolutionHours = durations.length
      ? Math.round((durations.reduce((sum, hours) => sum + hours, 0) / durations.length) * 10) / 10
      : null;
    res.json({
      categories: categoryRows.map(row => ({ name: row._id || "Uncategorised", count: row.count })),
      monthly: monthlyRows.reverse().map(row => ({ month: row._id, count: row.count })),
      averageResolutionHours,
      resolvedMeasured: durations.length
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({ error: "Could not load complaint analytics." });
  }
});

app.post("/api/complaints", async (req, res) => {
  try {
    const validation = validateComplaint(req.body);
    if (validation.error) return res.status(400).json({ error: validation.error });

    const now = new Date();
    const document = {
      ...validation.value,
      ticketId: makeTicketId(),
      status: "Open",
      adminNote: "",
      statusHistory: [{ status: "Open", note: "Complaint submitted", changedAt: now }],
      createdAt: now,
      updatedAt: now
    };
    await complaints.insertOne(document);
    res.status(201).json(document);
  } catch (error) {
    console.error("Create complaint error:", error);
    res.status(500).json({ error: "Could not submit complaint." });
  }
});

app.patch("/api/complaints/:id/status", async (req, res) => {
  try {
    const status = clean(req.body.status);
    const adminNote = clean(req.body.adminNote);
    if (!statuses.includes(status)) return res.status(400).json({ error: "Invalid status." });
    if (adminNote.length > 500) return res.status(400).json({ error: "Admin note must be 500 characters or fewer." });

    const { ObjectId } = require("mongodb");
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ error: "Invalid complaint ID." });

    const changedAt = new Date();
    const result = await complaints.findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      {
        $set: { status, adminNote, updatedAt: changedAt },
        $push: { statusHistory: { status, note: adminNote || `Status changed to ${status}`, changedAt } }
      },
      { returnDocument: "after" }
    );
    if (!result) return res.status(404).json({ error: "Complaint not found." });
    res.json(result);
  } catch (error) {
    console.error("Update complaint error:", error);
    res.status(500).json({ error: "Could not update complaint." });
  }
});

app.delete("/api/complaints/:id", async (req, res) => {
  try {
    const { ObjectId } = require("mongodb");
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ error: "Invalid complaint ID." });
    const result = await complaints.deleteOne({ _id: new ObjectId(req.params.id) });
    if (!result.deletedCount) return res.status(404).json({ error: "Complaint not found." });
    res.json({ message: "Complaint deleted." });
  } catch (error) {
    console.error("Delete complaint error:", error);
    res.status(500).json({ error: "Could not delete complaint." });
  }
});

async function start() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    complaints = db.collection("complaints");
    await complaints.createIndex({ ticketId: 1 }, { unique: true });
    await complaints.createIndex({ status: 1, createdAt: -1 });
    await complaints.createIndex({ category: 1 });
    await complaints.createIndex({ title: "text", description: "text", location: "text" });
    app.listen(PORT, () => {
      console.log(`Smart Campus Complaint Tracker running at http://localhost:${PORT}`);
      console.log(`MongoDB database: ${DB_NAME}`);
    });
  } catch (error) {
    console.error("Could not connect to MongoDB. Check that MongoDB is running and MONGODB_URI is correct.");
    console.error(error.message);
    process.exit(1);
  }
}

start();
