"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { database } from "../lib/db";
import { seed } from "../lib/seed";
import {
  impactPreview,
  newFactPreview,
  publishPreview,
  auditSelected,
} from "../lib/workflow";
import {
  revisePoster,
  acceptSuggestion,
  overrideFinding,
  revise,
  approve,
} from "../lib/review";
async function perform(path: string, data: FormData) {
  const get = (k: string) => z.string().parse(data.get(k));
  const number = (k: string) =>
    z.coerce.number().int().positive().parse(get(k));
  if (path !== "/" && !/^\/campaigns\/[\w-]+(?:\/[\w-]+)?$/.test(path))
    throw Error("Invalid workspace path.");
  let preview = "";
  const request = () => get("request");
  const db = database();
  switch (get("action")) {
    case "start":
      seed(db);
      return "/campaigns/aster";
    case "contrast":
      revisePoster(
        db,
        get("id"),
        number("expected"),
        {
          foreground: get("foreground"),
          background: get("background"),
          kind: z.enum(["solid", "unsupported"]).parse(get("kind")),
        },
        request(),
      );
      break;
    case "fact":
      preview = newFactPreview(
        db,
        get("variant"),
        get("label"),
        get("word"),
        get("start"),
        get("quote"),
        get("reason"),
      );
      break;
    case "preview":
      preview = impactPreview(
        db,
        get("id"),
        number("expected"),
        get("word"),
        get("start"),
        get("quote"),
        get("reason"),
      );
      break;
    case "publish":
      publishPreview(db, get("preview"));
      break;
    case "accept":
      acceptSuggestion(db, number("finding"), number("expected"), request());
      break;
    case "override":
      overrideFinding(db, number("finding"), get("reason"), request());
      break;
    case "revise":
      revise(db, get("id"), number("expected"), get("body"), request());
      break;
    case "audit":
      auditSelected(db, get("id"), number("revision"), get("day"), request());
      break;
    case "approve":
      approve(db, number("audit"));
      break;
    default:
      throw Error("Unknown action.");
  }
  revalidatePath("/", "layout");
  return path + (preview ? "?preview=" + encodeURIComponent(preview) : "");
}
export async function submitAction(
  path: string,
  _previous: { error: string; values: Record<string, string> },
  data: FormData,
) {
  let destination: string;
  try {
    destination = await perform(path, data);
  } catch (e) {
    return {
      error:
        e instanceof z.ZodError
          ? e.issues.map((i) => i.message).join(" ")
          : e instanceof Error
            ? e.message
            : "Could not save.",
      values: Object.fromEntries(
        [...data.entries()].filter(
          (entry): entry is [string, string] => typeof entry[1] === "string",
        ),
      ),
    };
  }
  redirect(destination);
}
export async function act(path: string, data: FormData) {
  let destination: string;
  try {
    destination = await perform(path, data);
  } catch (e) {
    redirect(
      path +
        "?error=" +
        encodeURIComponent(e instanceof Error ? e.message : "Could not save."),
    );
  }
  redirect(destination);
}
