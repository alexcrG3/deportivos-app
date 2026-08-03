import { createFileRoute } from "@tanstack/react-router";
import EntrenadoresPage from "./entrenadores.index";

export const Route = createFileRoute("/_app/personal")({
  component: EntrenadoresPage,
});
