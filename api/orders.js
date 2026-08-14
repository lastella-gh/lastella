const { getDb, cors } = require("./_db");
const { ObjectId } = require("mongodb");

module.exports = async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const db = await getDb();
    const orders = db.collection("orders");
    const items = db.collection("order_items");

    // GET orders - admin gets all, user gets by user_id
    if (req.method === "GET") {
      const { user_id, all, status } = req.query;
      let query = {};
      if (user_id) query = { user_id };
      if (status && status !== "all") query.status = status;

      const data = await orders.find(query).sort({ createdAt: -1 }).toArray();
      return res.json(data.map((o) => ({ ...o, id: o._id.toString(), _id: undefined })));
    }

    // GET order items
    if (req.method === "GET" && req.query.items_for) {
      const data = await items.find({ order_id: req.query.items_for }).toArray();
      return res.json(data.map((i) => ({ ...i, id: i._id.toString(), _id: undefined })));
    }

    // CREATE order
    if (req.method === "POST") {
      const { items: orderItems, ...orderData } = req.body;
      orderData.createdAt = new Date();
      orderData.status = "pending";

      const result = await orders.insertOne(orderData);
      const orderId = result.insertedId.toString();

      if (orderItems && orderItems.length > 0) {
        await items.insertMany(orderItems.map((i) => ({ ...i, order_id: orderId })));
      }

      return res.json({ id: orderId, order_number: orderData.order_number });
    }

    // UPDATE order status
    if (req.method === "PUT") {
      const { id, status } = req.body;
      if (!id) return res.status(400).json({ error: "Missing id" });
      await orders.updateOne({ _id: new ObjectId(id) }, { $set: { status } });
      return res.json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Orders API error:", err);
    return res.status(500).json({ error: err.message });
  }
};
