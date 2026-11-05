"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { database } from "../lib/db";
import {
  addFact,
  transition,
  revise,
  auditRevision,
  approve,
} from "../lib/review";
export async function act(path: string, data: FormData) {
  const get = (k: string) => z.string().parse(data.get(k));
  const number = (k: string) =>
    z.coerce.number().int().positive().parse(get(k));
  if (!/^\/campaigns\/[\w-]+(?:\/[\w-]+)?$/.test(path))
    throw Error("Invalid workspace path.");
  let message = "";
  try {
    const db = database();
    switch (get("action")) {
      case "fact":
        addFact(db, get("variant"), get("label"), get("word"), get("start"));
        break;
      case "version":
        transition(
          db,
          get("id"),
          number("expected"),
          get("word"),
          get("start"),
        );
        break;
      case "revise":
        revise(db, get("id"), number("expected"), get("body"));
        break;
      case "audit":
        auditRevision(db, number("revision"), get("day"));
        break;
      case "approve":
        approve(db, number("audit"));
        break;
      default:
        throw Error("Unknown action.");
    }
  } catch (e) {
    message =
      e instanceof z.ZodError
        ? e.issues[0].message
        : e instanceof Error
          ? e.message
          : "Could not save.";
  }
  revalidatePath("/", "layout");
  redirect(path + (message ? "?error=" + encodeURIComponent(message) : ""));
}
