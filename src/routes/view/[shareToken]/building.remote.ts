import { query } from "$app/server";
import { PUBLIC_CONVEX_URL } from "$env/static/public";
import { ConvexHttpClient } from "convex/browser";
import { api } from "$convex/_generated/api";
import * as v from "valibot";

export const getSharedBuilding = query(
  v.pipe(v.string(), v.trim(), v.nonEmpty()),
  async (shareToken) => {
    const client = new ConvexHttpClient(PUBLIC_CONVEX_URL);
    return client.query(api.buildings.getByShareToken, { shareToken });
  },
);
