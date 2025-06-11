const chalk = require("chalk");

const express = require("express");
const app = express();

const path = require("path");
const morgan = require("morgan");
const Feed = require("./models/feed");

const mongoose = require("mongoose");
mongoose
  .connect("mongodb://localhost:27017/mydb")
  .then(()=> console.log("MongoDB Connected"))
  .catch((err)=>console.error("MongoDb Conecction Erro",err));


app.set("view engine", "ejs"); // EJS setup
app.set("views", path.join(__dirname, "views")); // Set the views directory
// app.set("views", "./views");///

app.use(express.urlencoded({ extended: true }));
const session = require("express-session");
const { realpathSync } = require("fs");
app.use(
  session({
    secret: "mySecretKey",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 5,
    }, // 5 minutes
  })
);

app.use(morgan("common"));

app.use("/css", express.static(path.join(__dirname, "public", "css")));
app.use("/js", express.static(path.join(__dirname, "public", "js")));

app.get("/", (req, res) => {
  res.render("index", { username: req.session.username });
});

app.get("/write", (req, res) => {
  if (req.session.username) {
    res.render("write");
  } else {
    res.redirect("/");
  }
});

app.get("/posts", async (req, res) => {
  if (!req.session.username) {
    return res.redirect("/");
  }
  try {
    const posts = await Feed
      .find({ author: req.session.username })
      .sort({ createdAt: -1 });
    res.render("posts", { posts, username: req.session.username });
  } catch (err) {
    console.error("Error loading posts:", err);
    res.status(500).send("Error loading posts");
  }
});


app.post("/login", (req, res) => {
  const { username, password } = req.body;

  // Mock authentication logic
  const mockUsername = "Tom";
  const mockPassword = "123456";

  if (username === mockUsername && password === mockPassword) {
    req.session.username = username;
    res.redirect("/");
  } else {
    res.send("Login failed!");
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.send("Error logging out");
    }
    res.clearCookie("connect.sid");
    res.redirect("/");
  });
});


// POST /write — crea una nueva publicación
app.post("/write", async (req, res) => {
  const { content } = req.body;

  // Verifica sesión
  if (!req.session.username) {
    return res.redirect("/");
  }

  try {
    // Crea instancia de Feed usando tu modelo
    const newFeed = new Feed({
      content,
      author: req.session.username,
    });

    // Guarda en MongoDB
    await newFeed.save();
    console.log("Feed saved successfully");

    // Redirige al listado
    res.redirect("/posts");
  } catch (err) {
    console.error("Error saving feed:", err);
    res.status(500).send("Error saving feed");
  }
});

app.listen(3000, () => {
  console.log(
    chalk.bgHex("#ff69b4").white.bold(" 🎉 EXPRESS SERVER STARTED 🎉 ")
  );
  console.log(
    chalk.green("Running at: ") + chalk.cyan("http://localhost:3000")
  );
  console.log(chalk.gray("Press Ctrl+C to stop the server."));
});