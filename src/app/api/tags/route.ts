import { taxonomyHandlers } from "@/lib/taxonomy";

const { list, create } = taxonomyHandlers("tag");
export { list as GET, create as POST };
