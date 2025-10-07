import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import expressEjsLayouts from "express-ejs-layouts";

import indexRoutes from "./routes/index.js";
import userRoutes from "./routes/users.js";
import db from "./config/db.js";
import setCurrentPath from "./middleware.js";
import { authenticateJWT } from "./middleware/auth.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//  Serve static files directly from /public
app.use(express.static(path.join(__dirname, "public")));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// expose current path to views for active nav highlighting
app.use(setCurrentPath);

//  Views setup
app.use(expressEjsLayouts);
app.set("layout", "./layouts/main");
app.set("views", path.join(__dirname, "views")); // now views folder is directly inside root
app.set("view engine", "ejs");

//  Routes
app.use("/", indexRoutes);
app.use("/api/users", userRoutes);

//  Extra pages
app.get("/register", (req, res) => {
  res.render("register", { title: "Register" });
});

app.get("/login", (req, res) => {
  res.render("login", { title: "Login" });
});

// Services page
app.get("/services", (req, res) => {
  res.render("services", {
    title: "Services",
    layout: "./layouts/main",
  });
});

app.get("/about", (req, res) => {
  res.render("about", { title: "About Us" });
});

app.get("/contact", (req, res) => {
  res.render("contact", { title: "Contact Us" });
});

app.get("/dashboard-customer", authenticateJWT, async (req, res) => {
  try {
    // fetch vehicles for the dashboard
    const [vehicles] = await db.query("SELECT * FROM vehicles");

    const totalVehicles = Array.isArray(vehicles) ? vehicles.length : 0;

    res.render("dashboard-customer", {
      title: "Dashboard",
      layout: "./layouts/dashboard-layout",
      vehicles,
      totalVehicles,
      userRole: req.user.role,
    });
  } catch (err) {
    console.error("\u274c DB Error:", err);
    res.status(500).send("Server Error");
  }
});

app.get("/booking", authenticateJWT, async (req, res) => {
  try {
    // fetch vehicles for the booking page
    const [vehicles] = await db.query("SELECT * FROM vehicles");

    const totalVehicles = Array.isArray(vehicles) ? vehicles.length : 0;

    res.render("booking", {
      title: "Booking",
      layout: "./layouts/dashboard-layout",
      vehicles,
      totalVehicles,
      userRole: req.user.role,
      selectedCarId: req.query.carId || null,
    });
  } catch (err) {
    console.error("\u274c DB Error:", err);
    res.status(500).send("Server Error");
  }
});

app.get("/dashboard", authenticateJWT, (req, res) => {
  if (req.user && req.user.role === "admin") {
    return res.redirect("/dashboard");
  }
  return res.redirect("/dashboard-customer");
});

app.get("/dashboard", authenticateJWT, async (req, res) => {
  try {
    const [vehicles] = await db.query("SELECT * FROM vehicles");
    const totalVehicles = Array.isArray(vehicles) ? vehicles.length : 0;
    res.render("dashboard", {
      title: "Admin Dashboard",
      layout: "./layouts/dashboard-layout",
      vehicles,
      totalVehicles,
      userRole: req.user.role,
    });
  } catch (err) {
    console.error("\u274c DB Error:", err);
    res.status(500).send("Server Error");
  }
});

app.get("/car-create", authenticateJWT, async (req, res) => {
  try {
    const [vehicles] = await db.query("SELECT * FROM vehicles");
    const totalVehicles = Array.isArray(vehicles) ? vehicles.length : 0;
    res.render("car-create", {
      title: "Create Car",
      layout: "./layouts/dashboard-layout",
      vehicles,
      totalVehicles,
      userRole: req.user.role,
    });
  } catch (err) {
    console.error("\u274c DB Error:", err);
    res.status(500).send("Server Error");
  }
});

app.get("/profile", authenticateJWT, (req, res) => {
  res.render("profile", {
    title: "Profile",
    layout: "./layouts/dashboard-layout",
    user: req.user,
    userRole: req.user.role,
  });
});
app.get("/settings", authenticateJWT, (req, res) => {
  res.render("settings", {
    title: "Settings",
    layout: "./layouts/dashboard-layout",
    user: req.user,
    userRole: req.user.role,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
