import cookieParser from "cookie-parser";
import express from "express";
import flash from "connect-flash";
import requesIp from "request-ip";
import session from "express-session";

// import router from "./routes/shortener.routes.js";                 // ? Default Router
import { shortnerRoutes } from "./routes/shortener.routes.js"; //? Named Exports
import { authRoutes } from "./routes/auth.routes.js";
import { verifyAuthentication } from "./middlewares/verify-auth-middleware.js";

const app = express();

const PORT = 3000;

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs"); //? Template Engine
// app.set("views", "./views");         //? No need to write like this

app.use(cookieParser());

app.use(
  session({ secret: "my-secret", resave: true, saveUninitialized: false })
);

app.use(flash());

app.use(requesIp.mw());

app.use(verifyAuthentication);

app.use((req, res, next) => {
  res.locals.user = req.user;
  return next();
});

// How It Works:
// This middleware runs on every request before reaching the route handlers.
//? res.locals is an object that persists throughout the request-response cycle.
//? If req.user exists (typically from authentication, like Passport.js), it's stored in res.locals.user.
//? Views (like EJS, Pug, or Handlebars) can directly access user without manually passing it in every route.

//? Express Router :-
// app.use(router);              // ? Default Router
app.use(authRoutes); //? Named Exports
app.use(shortnerRoutes); //? Named Exports

app.listen(PORT, () => {
  console.log(`Connected to PORT ${PORT}`);
});
