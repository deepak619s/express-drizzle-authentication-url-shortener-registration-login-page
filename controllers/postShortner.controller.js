// import { readFile } from "fs/promises";
// import path from "path";
import crypto from "crypto";
// import { loadLinks, saveLinks } from "../models/shortener.model.js";
import {
  getAllShortLinks,
  getShortLinkByShortCode,
  insertShortLink,
} from "../services/shortener.services.js";

export const getShortnerPage = async (req, res) => {
  try {
    // const file = await readFile(path.join("views", "index.html"));
    // const links = await loadLinks();

    if (!req.user) return res.redirect("/login");

    const links = await getAllShortLinks(req.user.id);

    // let isLoggedIn = req.headers.cookie;
    // isLoggedIn = Boolean(
    //   isLoggedIn
    //     ?.split(";")
    //     ?.find((cookie) => cookie.trim().startsWith("isLoggedIn"))
    //     ?.split("=")[1]
    // );
    // console.log("🚀 ~ getShortenerPage ~ isLoggedIn:", isLoggedIn);

    // let isLoggedIn = req.cookies.isLoggedIn;

    return res.render("index.ejs", { links, host: req.host });
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal server error");
  }
};

export const postURLShortner = async (req, res) => {
  try {
    if (!req.user) return res.redirect("/login");

    const { url, shortcode } = req.body;
    const finalShortCode = shortcode || crypto.randomBytes(4).toString("hex");

    // const links = await loadLinks();

    const link = await getShortLinkByShortCode(finalShortCode);

    if (link) {
      res.status(400).send("Short code already exists. Please choose another.");
    }

    // link[finalShortCode] = url;

    // await saveLinks(link);

    await insertShortLink({ url, finalShortCode, userId: req.user.id });

    return res.redirect("/");
  } catch (error) {
    console.log(error);
    res.status(200).send("Server error: " + error.message);
  }
};

export const redirectToShort = async (req, res) => {
  try {
    const { shortCode } = req.params;
    // const links = await loadLinks();
    const link = await getShortLinkByShortCode(shortCode);
    // console.log("🚀 ~ redirectToShortLink ~ link:", link);

    if (!link) {
      return res.status(400).send("404 error occured");
    }

    return res.redirect(link.url);
  } catch (error) {
    return res.status(500).send("Internal server error");
  }
};
