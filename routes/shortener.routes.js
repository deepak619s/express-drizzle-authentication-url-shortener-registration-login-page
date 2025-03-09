import {
  postURLShortner,
  getShortnerPage,
  redirectToShort,
  getShortenerEditPage,
  postShortenerEditPage,
  deleteShortCode,
} from "../controllers/postShortner.controller.js";

// import express from "express";
// const router = express.Router();

import { Router } from "express";
const router = Router();

// router.get("/report", (req, res) => {
//     const student = {
//         name: "abc",
//         age: 21,
//         roll: 100
//     };
//     return res.render("report.ejs", {student});
// });

router.get("/", getShortnerPage);

router.post("/", postURLShortner);

router.get("/:shortCode", redirectToShort);

router.route("/edit/:id").get(getShortenerEditPage).post(postShortenerEditPage);

router.route("/delete/:id").post(deleteShortCode);

// ? Default Router :-
// export default router;

//? Named Exports :-
export const shortnerRoutes = router;
