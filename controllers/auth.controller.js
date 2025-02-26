import { createUser, getUserByEmail } from "../services/auth.services.js";

export const getRegisterPage = (req, res) => {
  return res.render("../views/auth/register.ejs");
};

export const postRegister = async (req, res) => {
  // console.log(req.body);
  const { name, email, password } = req.body;

  const userExists = await getUserByEmail(email);
  console.log("userExists", userExists);

  if (userExists) return res.redirect("/register");

  const [user] = await createUser({ name, email, password });
  console.log(user);

  res.redirect("/login");
};

export const getLoginPage = (req, res) => {
  return res.render("auth/login.ejs");
};

export const postLogin = async (req, res) => {
  const { email, password } = req.body;

  const user = await getUserByEmail(email);
  console.log("user", user);

  if (!user) return res.redirect("/login");

  if (user.password !== password) return res.redirect("/login");

  // res.setHeader("Set-Cookie", "isLoggedIn=true; path=/;");
  res.cookie("isLoggedIn", true);
  res.redirect("/");
};
