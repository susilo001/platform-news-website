type Props = {
  src: string;
  alt: string;
  hero?: boolean;
  compact?: boolean;
  className?: string;
};
export function Photo({
  src,
  alt,
  hero = false,
  compact = false,
  className,
}: Props) {
  const responsive = src.startsWith("https://images.unsplash.com/");
  const sized = (w: number) => src.replace(/([?&])w=\d+/, `$1w=${w}`);
  return (
    <img
      src={responsive ? sized(hero ? 1600 : 800) : src}
      srcSet={
        responsive
          ? `${sized(400)} 400w, ${sized(800)} 800w, ${sized(1600)} 1600w`
          : undefined
      }
      sizes={
        compact
          ? "(max-width: 650px) 110px, (max-width: 950px) 30vw, 100px"
          : hero
            ? "(max-width: 950px) 100vw, 70vw"
            : "(max-width: 650px) 100vw, 33vw"
      }
      alt={alt}
      loading={hero ? "eager" : "lazy"}
      fetchPriority={hero ? "high" : undefined}
      width={1600}
      height={900}
      className={className}
    />
  );
}
