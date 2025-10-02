const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());

// test route
app.get("/api/", (req, res) => {
  res.send("Car Rental API is running...");
});

app.listen(PORT, () => console.log(`Server is running onn port ${PORT}`));
