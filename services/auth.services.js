import {
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY,
  MILLISECONDS_PER_SECOND,
} from "../config/constant.js";

import crypto from "crypto";

import { and, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "../config/db.js";
import {
  passwordResetTokensTable,
  sessionsTable,
  shortLink,
  usersTable,
  verifyEmailTokensTable,
} from "../drizzle/schema.js";
// import bcrypt from "bcrypt";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import path from "path";
import fs from "fs/promises";
import mjml2html from "mjml";
import ejs from "ejs";

// import { sendEmail } from "../lib/nodemailer.js";
import { sendEmail } from "../lib/send-email.js";

export const getUserByEmail = async (email) => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));

  return user;
};

export const createUser = async ({ name, email, password }) => {
  return await db
    .insert(usersTable)
    .values({ name, email, password })
    .$returningId();
};

export const hashPassword = async (password) => {
  // return await bcrypt.hash(password, 10);
  return await argon2.hash(password);
};

export const comparePassword = async (password, hash) => {
  // return await bcrypt.compare(password, hash);
  return await argon2.verify(hash, password);
};

// export const generateToken = ({ id, name, email }) => {
//   return jwt.sign({ id, name, email }, process.env.JWT_SECRET, {
//     expiresIn: "30d",
//   });
// };
export const createSession = async (userId, { ip, userAgent }) => {
  const [session] = await db
    .insert(sessionsTable)
    .values({ userId, ip, userAgent })
    .$returningId();

  return session;
};

// createAccessToken :-
export const createAccessToken = ({ id, name, email, sessionId }) => {
  return jwt.sign({ id, name, email, sessionId }, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY / MILLISECONDS_PER_SECOND,
  });
};

// createRefreshToken :-
export const createRefreshToken = (sessionId) => {
  return jwt.sign({ sessionId }, process.env.JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY / MILLISECONDS_PER_SECOND, //   expiresIn: "1w",
  });
};

// verifyJWTToken :-
export const verifyJWTToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

// findSessionById :-
export const findSessionById = async (sessionId) => {
  const [session] = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.id, sessionId));

  return session;
};

// findUserById :-
export const findUserById = async (userId) => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId));

  return user;
};

// refreshTokens :-
export const refreshTokens = async (refreshToken) => {
  try {
    const decodedToken = verifyJWTToken(refreshToken);
    const currentSession = await findSessionById(decodedToken.sessionId);

    if (!currentSession || !currentSession.valid) {
      throw new Error("Invalid Session");
    }

    const user = await findUserById(currentSession.userId);

    if (!user) throw new Error("Invalid User");

    const userInfo = {
      id: user.id,
      name: user.name,
      email: user.email,
      isEmailValid: user.isEmailValid,
      sessionId: currentSession.id,
    };

    const newAccessToken = createAccessToken(userInfo);
    const newRefreshToken = createRefreshToken(currentSession.id);

    return {
      newAccessToken,
      newRefreshToken,
      user: userInfo,
    };
  } catch (error) {
    console.log(error.message);
  }
};

// clearUserSession :-
export const clearUserSession = async (sessionId) => {
  return db.delete(sessionsTable).where(eq(sessionsTable.id, sessionId));
};

//
export const authenticateUser = async ({ req, res, user, name, email }) => {
  //? we need to create a session :-
  const session = await createSession(user.id, {
    ip: req.clientIp,
    userAgent: req.headers["user-agent"],
  });

  const accessToken = createAccessToken({
    id: user.id,
    name: user.name || name,
    email: user.email || email,
    isEmailValid: false,
    sessionId: session.id,
  });

  const refreshToken = createRefreshToken(session.id);

  const baseConfig = { httpOnly: true, secure: true };

  res.cookie("access_token", accessToken, {
    ...baseConfig,
    maxAge: ACCESS_TOKEN_EXPIRY,
  });

  res.cookie("refresh_token", refreshToken, {
    ...baseConfig,
    maxAge: REFRESH_TOKEN_EXPIRY,
  });
};

// getAllShortLinks :-
export const getAllShortLinks = async (userId) => {
  return await db.select().from(shortLink).where(eq(shortLink.userId, userId));
};

// generateRandomToken :-
export const generateRandomToken = (digit = 8) => {
  const min = 10 ** (digit - 1); // 10000000
  const max = 10 ** digit; // 100000000

  return crypto.randomInt(min, max).toString();
};

// insertVerifyEmailToken :-
export const insertVerifyEmailToken = async ({ userId, token }) => {
  return db.transaction(async (tx) => {
    try {
      await tx
        .delete(verifyEmailTokensTable)
        .where(lt(verifyEmailTokensTable.expiresAt, sql`CURRENT_TIMESTAMP`));

      // Delete any existing tokens for this specific user
      await tx
        .delete(verifyEmailTokensTable)
        .where(eq(verifyEmailTokensTable.userId, userId));

      // Insert the new token
      await tx.insert(verifyEmailTokensTable).values({ userId, token });
    } catch (error) {
      console.log(error);
    }
  });
};

// createVerifyEmailLink :-
// export const createVerifyEmailLink = async ({ email, token }) => {
//   const uriEncodedEmail = encodeURIComponent(email);
//   return `${process.env.FRONTEND_URL}/verify-email-token?token=${token}&email=${uriEncodedEmail}`;
// };

export const createVerifyEmailLink = async ({ email, token }) => {
  const url = new URL(`${process.env.FRONTEND_URL}/verify-email-token`);

  url.searchParams.append("token", token);
  url.searchParams.append("email", email);

  return url.toString();
};

// findVerificationEmailToken :-
// export const findVerificationEmailToken = async ({ token, email }) => {
//   const tokenData = await db
//     // .select({ key: table.column })
//     .select({
//       userId: verifyEmailTokensTable.userId,
//       token: verifyEmailTokensTable.token,
//       expiresAt: verifyEmailTokensTable.expiresAt,
//     })
//     .from(verifyEmailTokensTable)
//     .where(
//       and(
//         eq(verifyEmailTokensTable.token, token),
//         gte(verifyEmailTokensTable.expiresAt, sql`CURRENT_TIMESTAMP`)
//       )
//     );

//   // If no token found, return null
//   if (!tokenData.length) {
//     return null;
//   }

//   // const userId = tokenData[0].userId;
//   const { userId } = tokenData[0];

//   const userData = await db
//     .select({
//       userId: usersTable.id,
//       email: usersTable.email,
//     })
//     .from(usersTable)
//     .where(eq(usersTable.id, userId));

//   // If user not found, return null
//   if (!userData.length) {
//     return null;
//   }

//   return {
//     userId: userData[0].userId,
//     email: userData[0].email,
//     token: userData[0].token,
//     expiresAt: userData[0].expiresAt,
//   };
// };

export const findVerificationEmailToken = async ({ token, email }) => {
  return db
    .select({
      userId: usersTable.id,
      email: usersTable.email,
      token: verifyEmailTokensTable.token,
      expiresAt: verifyEmailTokensTable.expiresAt,
    })
    .from(verifyEmailTokensTable)
    .where(
      and(
        eq(verifyEmailTokensTable.token, token),
        eq(usersTable.email, email),
        gte(verifyEmailTokensTable.expiresAt, sql`CURRENT_TIMESTAMP`)
      )
    )
    .innerJoin(usersTable, eq(verifyEmailTokensTable.userId, usersTable.id));
};

// verifyUserEmailAndUpdate :-
export const verifyUserEmailAndUpdate = async (email) => {
  return db
    .update(usersTable)
    .set({ isEmailValid: true })
    .where(eq(usersTable.email, email));
};

// clearVerifyEmailTokens :-
export const clearVerifyEmailTokens = async (userId) => {
  // export const clearVerifyEmailTokens = async (email) => {
  // const [user] = await db
  //   .select()
  //   .from(usersTable)
  //   .where(eq(usersTable.email, email));

  return await db
    .delete(verifyEmailTokensTable)
    // .where(eq(verifyEmailTokensTable.userId, user.id));
    .where(eq(verifyEmailTokensTable.userId, userId));
};

export const sendNewVerifyEmailLink = async ({ userId, email }) => {
  const randomToken = generateRandomToken();

  await insertVerifyEmailToken({ userId, token: randomToken });

  const verifyEmailLink = await createVerifyEmailLink({
    email,
    token: randomToken,
  });

  // 1. To get the file data :-
  const mjmlTemplate = await fs.readFile(
    path.join(import.meta.dirname, "..", "emails", "verify-email.mjml"),
    "utf-8"
  );

  // 2. To replace the placeholders with the actual values :-
  const filledTemplate = ejs.render(mjmlTemplate, {
    code: randomToken,
    link: verifyEmailLink,
  });

  // 3. To convert mjml to html :-
  const htmlOutput = mjml2html(filledTemplate).html;

  sendEmail({
    to: email,
    subject: "Verify your email",
    // html: `
    //       <h1>Click the link below to verify your email</h1>
    //       <p>You can use this token: <code>${randomToken}</code></p>
    //       <a href="${verifyEmailLink}">Verify Email</a>
    //     `,
    html: htmlOutput,
  }).catch(console.error);
};

// updateUserByName :-
export const updateUserByName = async ({ userId, name }) => {
  return await db
    .update(usersTable)
    .set({ name: name })
    .where(eq(usersTable.id, userId));
};

//updateUserPassword :-
export const updateUserPassword = async ({ userId, newPassword }) => {
  const newHashPassword = await hashPassword(newPassword);

  return await db
    .update(usersTable)
    .set({ password: newHashPassword })
    .where(eq(usersTable.id, userId));
};

// findUserByEmail :-
export const findUserByEmail = async (email) => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(usersTable)
    .where(eq(usersTable.email, email));

  return user;
};

// createResetPasswordLink :-
export const createResetPasswordLink = async ({ userId }) => {
  const randomToken = crypto.randomBytes(32).toString("hex");

  const tokenHash = crypto
    .createHash("sha256")
    .update(randomToken)
    .digest("hex");

  await db
    .delete(passwordResetTokensTable)
    .where(eq(passwordResetTokensTable.userId, userId));

  await db.insert(passwordResetTokensTable).values({ userId, tokenHash });

  return `${process.env.FRONTEND_URL}/reset-password/${randomToken}`;
};

// getResetPasswordToken :-
export const getResetPasswordToken = async (token) => {
  const tokenHash = crypto
    .createHash("sha256")
    .update(token)
    .update.digest("hex");

  const [data] = await db
    .select()
    .from(passwordResetTokensTable)
    .where(
      and(
        eq(passwordResetTokensTable.tokenHash, tokenHash),
        gte(passwordResetTokensTable.expiresAt, sql`CURRENT_TIMESTAMP`)
      )
    );

  return data;
};
