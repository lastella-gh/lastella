const { getDb, cors } = require("./_db");
const { ObjectId } = require("mongodb");

module.exports = async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const db = await getDb();
    const col = db.collection("products");

    // GET all products or single by slug
    if (req.method === "GET") {
      const { slug, all } = req.query;
      let query = {};
      if (slug) query = { slug, active: true };
      else if (all !== "true") query = { active: true };

      const data = await col.find(query).sort({ createdAt: -1 }).toArray();
      return res.json(data.map((p) => ({ ...p, id: p._id.toString(), _id: undefined })));
    }

    // CREATE product
    if (req.method === "POST") {
      const body = { ...req.body, createdAt: new Date(), active: req.body.active ?? true };
      const result = await col.insertOne(body);
      return res.json({ ...body, id: result.insertedId.toString(), _id: undefined });
    }

    // UPDATE product
    if (req.method === "PUT") {
      const { id, ...body } = req.body;
      if (!id) return res.status(400).json({ error: "Missing id" });
      await col.updateOne({ _id: new ObjectId(id) }, { $set: body });
      return res.json({ success: true });
    }

    // DELETE product
    if (req.method === "DELETE") {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: "Missing id" });
      await col.deleteOne({ _id: new ObjectId(id) });
      return res.json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Products API error:", err);
    return res.status(500).json({ error: err.message });
  }
};
