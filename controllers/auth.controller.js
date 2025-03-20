import {
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY,
} from "../config/constant.js";
import {
  authenticateUser,
  clearUserSession,
  comparePassword,
  createAccessToken,
  createRefreshToken,
  createSession,
  createUser,
  findUserById,
  getAllShortLinks,
  // generateToken,
  getUserByEmail,
  hashPassword,
} from "../services/auth.services.js";
import {
  loginUserSchema,
  registerUserSchema,
} from "../validators/auth-validator.js";

export const getRegisterPage = (req, res) => {
  if (req.user) return res.redirect("/");

  return res.render("../views/auth/register.ejs", {
    errors: req.flash("errors"),
  });
};

export const postRegister = async (req, res) => {
  if (req.user) return res.redirect("/");

  // console.log(req.body);
  // const { name, email, password } = req.body;

  const { data, error } = registerUserSchema.safeParse(req.body);
  console.log(data);

  if (error) {
    const errors = error.errors[0].message;
    req.flash("errors", errors);
    return res.redirect("/register");
  }

  const { name, email, password } = data;

  const userExists = await getUserByEmail(email);
  console.log("userExists", userExists);

  // if (userExists) return res.redirect("/register");
  if (userExists) {
    req.flash("errors", "User already exists");
    return res.redirect("/register");
  }

  const hashedPassword = await hashPassword(password);

  const [user] = await createUser({ name, email, password: hashedPassword });
  console.log(user);

  // res.redirect("/login");

  await authenticateUser({ req, res, user, name, email });

  res.redirect("/");
};

export const getLoginPage = (req, res) => {
  if (req.user) return res.redirect("/");

  return res.render("auth/login.ejs", { errors: req.flash("errors") });
};

export const getAboutPage = (req, res) => {
  return res.render("auth/about.ejs");
};

export const getContactPage = (req, res) => {
  return res.render("auth/contact.ejs");
};

export const postLogin = async (req, res) => {
  if (req.user) return res.redirect("/");

  // const { email, password } = req.body;

  const { data, error } = loginUserSchema.safeParse(req.body);
  console.log(data);

  if (error) {
    const errors = error.errors[0].message;
    req.flash("errors", errors);
    return res.redirect("/login");
  }

  const { email, password } = data;

  const user = await getUserByEmail(email);
  console.log("user", user);

  // if (!user) return res.redirect("/login");
  if (!user) {
    req.flash("errors", "Invalid Email or Password");
    return res.redirect("/login");
  }

  //todo bscrypt.compare(plainTextPassword, hashedPassword);
  const isPasswordValid = await comparePassword(password, user.password);

  // if (user.password !== password) return res.redirect("/login");
  // if (!isPasswordValid) return res.redirect("/login");

  if (!isPasswordValid) {
    req.flash("errors", "Invalid Email or Password");
    return res.redirect("/login");
  }

  // res.setHeader("Set-Cookie", "isLoggedIn=true; path=/;");
  // res.cookie("isLoggedIn", true);

  // const token = generateToken({
  //   id: user.id,
  //   name: user.name,
  //   email: user.email,
  // });

  // res.cookie("access_token", token);

  await authenticateUser({ req, res, user });

  res.redirect("/");
};

export const getMe = (req, res) => {
  if (!req.user) return res.send("Not logged in");
  return res.send(`<h1>Hey ${req.user.name} - ${req.user.email}</h1>`);
};

export const logoutUser = async (req, res) => {
  await clearUserSession(req.user.sessionId);

  res.clearCookie("access_token");
  res.clearCookie("refresh_token");
  res.redirect("/login");
};

// getProfilePage :-
export const getProfilePage = async (req, res) => {
  if (!req.user) return res.send("Not Logged In");

  const user = await findUserById(req.user.id);
  if (!user) return res.redirect("/login");

  const userShortLinks = await getAllShortLinks(user.id);

  return res.render("auth/profile", {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      isEmailValid: user.isEmailValid,
      createdAt: user.createdAt,
      links: userShortLinks,
    },
  });
};
