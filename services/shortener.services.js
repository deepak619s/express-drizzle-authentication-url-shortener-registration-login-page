import { eq } from "drizzle-orm";
import { db } from "../config/db.js";
import { shortLink } from "../drizzle/schema.js";

export const getAllShortLinks = async (userId) => {
  return await db.select().from(shortLink).where(eq(shortLink.userId, userId));
};

export const getShortLinkByShortCode = async (shortCode) => {
  const [result] = await db
    .select()
    .from(shortLink)
    .where(eq(shortLink.shortCode, shortCode));

  return result;
};

export const insertShortLink = async ({ url, finalShortCode, userId }) => {
  await db.insert(shortLink).values({ url, shortCode: finalShortCode, userId });
};

// findShortLinkById :-
export const findShortLinkById = async (id) => {
  const [result] = await db
    .select()
    .from(shortLink)
    .where(eq(shortLink.id, id));

  return result;
};
