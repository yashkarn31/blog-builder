import Image from "next/image";

const GRADIENTS = [
  "from-sky-500 via-blue-600 to-indigo-700",
  "from-emerald-500 via-teal-600 to-cyan-700",
  "from-rose-500 via-fuchsia-600 to-purple-700",
  "from-amber-500 via-orange-600 to-red-600",
];

/** Cover with a graceful gradient fallback for posts without an image. */
export function CoverImage({
  src,
  alt,
  sizes,
  priority,
  className = "",
}: {
  src: string | null;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  if (src) {
    const external = src.startsWith("http");
    return (
      <div className={`relative overflow-hidden bg-muted ${className}`}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          unoptimized={external}
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
        />
      </div>
    );
  }
  const g = GRADIENTS[alt.length % GRADIENTS.length];
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${g} ${className}`} aria-hidden>
      <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_20%_20%,white_0,transparent_40%),radial-gradient(circle_at_80%_70%,white_0,transparent_35%)]" />
      <span className="absolute bottom-3 left-4 font-serif text-5xl font-semibold text-white/80">
        {alt.charAt(0)}
      </span>
    </div>
  );
}
