const mongoose = require("mongoose");
require("dotenv").config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("Connected to DB, dropping all collections...");
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    for (let collection of collections) {
      await db.dropCollection(collection.name);
      console.log(`Dropped collection: ${collection.name}`);
    }
    console.log("DB reset complete.");
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
