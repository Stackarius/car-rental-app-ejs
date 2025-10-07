import express from "express";
import db from "../config/db.js";

const router = express.Router();

// Homepage route
router.get("/", async (req, res) => {
  try {
    // fetch 6 vehicles max for homepage
    const [vehicles] = await db.query("SELECT * FROM vehicles LIMIT 6");

    res.render("index", {
      title: "Car Rental System",
      vehicles,
    });
  } catch (err) {
    console.error("❌ DB Error:", err);
    res.status(500).send("Server Error");
  }
});

export default router;
