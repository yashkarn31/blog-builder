import { taxonomyHandlers } from "@/lib/taxonomy";

const { update, remove } = taxonomyHandlers("tag");
export { update as PATCH, remove as DELETE };
