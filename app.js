import express from "express";

// import router from "./routes/shortener.routes.js";                 // ? Default Router
import { shortnerRoutes } from "./routes/shortener.routes.js"; //? Named Exports
import { authRoutes } from "./routes/auth.routes.js";
import cookieParser from "cookie-parser";

const app = express();

const PORT = 3000;

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs"); //? Template Engine
// app.set("views", "./views");         //? No need to write like this

app.use(cookieParser());

//? Express Router :-
// app.use(router);              // ? Default Router
app.use(authRoutes); //? Named Exports
app.use(shortnerRoutes); //? Named Exports

app.listen(PORT, () => {
  console.log(`Connected to PORT ${PORT}`);
});
