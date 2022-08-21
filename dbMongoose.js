import mongoose from "mongoose";

const whatsappSchema = new mongoose.Schema({
  message: String,
  name: String,
  timeStamp: String,
});

export default mongoose.model("messagecontent", whatsappSchema);
