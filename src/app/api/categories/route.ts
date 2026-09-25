import { taxonomyHandlers } from "@/lib/taxonomy";

const { list, create } = taxonomyHandlers("category");
export { list as GET, create as POST };
