import { taxonomyHandlers } from "@/lib/taxonomy";

const { update, remove } = taxonomyHandlers("category");
export { update as PATCH, remove as DELETE };
