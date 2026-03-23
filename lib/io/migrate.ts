import { db } from "@/lib/db";
import { createDiagram } from "@/lib/diagram";

const LEGACY_STORAGE_KEY = "yapdraw_elements";
const MIGRATION_DONE_KEY = "yapdraw_migrated_v1";

export async function migrateFromLocalStorage(): Promise<void> {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(MIGRATION_DONE_KEY)) return;

  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (raw) {
      const elements = JSON.parse(raw);
      if (Array.isArray(elements) && elements.length > 0) {
        await db.diagrams.add(
          createDiagram({ name: "My First Diagram", elements }),
        );
      }
    }
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    localStorage.setItem(MIGRATION_DONE_KEY, "1");
  }
}
