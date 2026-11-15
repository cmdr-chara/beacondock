// A throwaway MongoDB for local console work (mongodb-memory-server).
// `npm run mongo`, leave it running, then `npm run dev` in another shell.
// Data lives in memory only — restart it and the prefs/rules reset.
import { MongoMemoryServer } from "mongodb-memory-server";

const mongod = await MongoMemoryServer.create({
  instance: { port: 27017, dbName: "beacondock_console" },
});

console.log(`MongoDB (in-memory) at ${mongod.getUri()}`);
console.log("Ctrl+C stops it and drops the data.");

const stop = async () => {
  await mongod.stop();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
