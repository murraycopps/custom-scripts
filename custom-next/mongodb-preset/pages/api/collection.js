//posts.js

import { ObjectId } from "mongodb";
import clientPromise from "../../lib/mongodb";

const database = "db";
const collection = "collection";

export default async function handler(req, res) {
  const client = await clientPromise;
  const db = client.db(database);

  const bodyObject = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

  switch (req.method) {
    case "POST":
      await db.collection(collection).insertOne(bodyObject);
      res.json({ status: 200, data: "posted" });
      break;
    case "GET":
      const allPosts = await db.collection(collection).find({}).toArray();
      res.json({ status: 200, data: allPosts });
      break;
    case "DELETE":
      await db.collection(collection).deleteOne({ "_id": new ObjectId(bodyObject._id) });
      res.json({ status: 200, data: "deleted" });
      break;
    case "PUT":
      const { _id, ...rest } = bodyObject;
      await db.collection(collection).updateOne({ "_id": new ObjectId(_id) }, { $set: { ...rest } });
      res.json({ status: 200, data: "updated" });
      break;
  }
}
