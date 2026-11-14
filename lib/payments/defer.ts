import { after } from "next/server";

/**
 * Exécute `task` après l'envoi de la réponse HTTP (webhook rapide), sans jamais lever d'erreur.
 * Hors contexte de requête (tests, scripts), la tâche est exécutée tout de suite.
 */
export function defer(task: () => Promise<unknown>): Promise<void> | void {
  const run = () =>
    task().then(
      () => undefined,
      (e) => console.error("[payments.defer]", e instanceof Error ? e.message : e),
    );
  try {
    after(run);
  } catch {
    return run();
  }
}
