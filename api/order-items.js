const { getDb, cors } = require("./_db");

module.exports = async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const db = await getDb();
    const items = db.collection("order_items");
    const { order_id } = req.query;

    if (req.method === "GET" && order_id) {
      const data = await items.find({ order_id }).toArray();
      return res.json(data.map((i) => ({ ...i, id: i._id.toString(), _id: undefined })));
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Order items API error:", err);
    return res.status(500).json({ error: err.message });
  }
};
