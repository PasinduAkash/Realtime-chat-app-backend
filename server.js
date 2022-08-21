import express from "express";
import mongoose from "mongoose";
import Messages from "./dbMongoose.js";
import Pusher from "pusher";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 9000;

app.use(express.json());
app.use(cors());

const timeStamp = () => {
  const date = new Date().toLocaleDateString();
  const hours = new Date().getHours();
  const minutes = new Date().getMinutes();

  const timeStamp = `${date}, ${hours}:${minutes}`;
  return timeStamp;
};

const pusher = new Pusher({
  appId: process.env.APP_ID,
  key: process.env.APP_KEY,
  secret: process.env.APP_SECRET,
  cluster: process.env.APP_CLUSTER,
  useTLS: true,
});

const db = mongoose.connection;

db.once("open", () => {
  console.log("connected to db");

  const msgCollection = db.collection("messagecontents");
  const changeStream = msgCollection.watch();

  changeStream.on("change", (change) => {
    if (change.operationType === "insert") {
      const messageDetails = change.fullDocument;
      pusher.trigger("messages", "inserted", {
        message: messageDetails.message,
        name: messageDetails.name,
        timeStamp: timeStamp(),
      });
    } else {
      console.log("Error! couldn't trigger pusher");
    }
  });
});

const url = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@cluster0.${process.env.MONGO_NUMBER}.mongodb.net/?retryWrites=true&w=majority`;

mongoose.connect(url);

app.get("/", (req, res) => {
  res.send("hello world");
});

app.get("/api/messages/sync", (req, res) => {
  Messages.find((err, foundItems) => {
    if (err) {
      res.send(err);
    } else {
      res.send(foundItems);
    }
  });
});

app.post("/api/messages/new", (req, res) => {
  const newMessage = req.body;

  Messages.create(newMessage, (err, data) => {
    if (err) {
      res.send(err);
    } else {
      res.send(data);
    }
  });
});

app.listen(PORT, () => console.log(`listening on PORT ${PORT}`));
