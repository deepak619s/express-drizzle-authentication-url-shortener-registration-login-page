// import { readFile } from "fs/promises";
// import path from "path";
import crypto from "crypto";
// import { loadLinks, saveLinks } from "../models/shortener.model.js";
import {
  deleteShortCodeById,
  findShortLinkById,
  getAllShortLinks,
  getShortLinkByShortCode,
  insertShortLink,
  updateShortCode,
} from "../services/shortener.services.js";

import z from "zod";

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

    return res.render("index.ejs", {
      links,
      host: req.host,
      errors: req.flash("errors"),
    });
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
      // res.status(400).send("Short code already exists. Please choose another.");

      req.flash(
        "errors",
        "Uel with that shortcode already exists, please choose another."
      );
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

// getShortenerEditPage :-
export const getShortenerEditPage = async (req, res) => {
  if (!req.user) return res.redirect("/login");
  // const id = req.params;
  const { data: id, error } = z.coerce.number().int().safeParse(req.params.id);
  if (error) return res.redirect("/404");

  try {
    const shortLink = await findShortLinkById(id);
    if (!shortLink) return res.redirect("/404");

    res.render("edit-shortLink", {
      id: shortLink.id,
      url: shortLink.url,
      shortCode: shortLink.shortCode,
      errors: req.flash("errors") || [],
      links: [],
      host: req.get("host"),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal Server Error");
  }
};

// postShortenerEditPage :-
export const postShortenerEditPage = async (req, res) => {
  if (!req.user) return res.redirect("/login");
  // const id = req.params;
  const { data: id, error } = z.coerce.number().int().safeParse(req.params.id);
  if (error) return res.redirect("/404");

  try {
    const { url, shortCode } = req.body;
    const newUpdateShortCode = await updateShortCode({ id, url, shortCode });
    if (!newUpdateShortCode) return res.redirect("/404");
    res.redirect("/");
  } catch (error) {
    if (err.code === "ER_DUP_ENTRY") {
      req.flash("errors", "Shortcode already exists, please choose another");
      return res.redirect(`/edit/${id}`);
    }

    console.error(error);
    return res.status(500).send("Internal Server Error");
  }
};

// deleteShortCode :-
export const deleteShortCode = async (req, res) => {
  try {
    const { data: id, error } = z.coerce
      .number()
      .int()
      .safeParse(req.params.id);
    if (error) return res.redirect("/404");

    await deleteShortCodeById(id);
    return res.redirect("/");
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal Server Error");
  }
};
