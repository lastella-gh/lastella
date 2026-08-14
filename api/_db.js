const { MongoClient } = require("mongodb");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://ikoteksolutions_db_user:xqO0gg9dM5cpIoL0@cluster0.fbfpsbf.mongodb.net/?retryWrites=true&w=majority";
const DB_NAME = "lastella";

let client = null;
let db = null;

async function getDb() {
  if (db) return db;
  client = new MongoClient(MONGODB_URI);
  await client.connect();
  db = client.db(DB_NAME);
  return db;
}

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

module.exports = { getDb, cors };
