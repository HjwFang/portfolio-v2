import RevealImage from "@/components/RevealImage";

type RankBadgeProps = {
  accent: string;
  rankIcon: string;
  rank: string;
  gameTitle: string;
  sizeClass: string;
  imageSizes: string;
  priority?: boolean;
};

function rankIconGlow(accent: string): string {
  return [
    `drop-shadow(0 0 8px ${accent}55)`,
    `drop-shadow(0 0 20px ${accent}33)`,
    "drop-shadow(0 8px 14px rgba(0,0,0,0.18))",
  ].join(" ");
}

export default function RankBadge({
  accent,
  rankIcon,
  rank,
  gameTitle,
  sizeClass,
  imageSizes,
  priority = false,
}: RankBadgeProps) {
  return (
    <div
      className={`relative overflow-visible ${sizeClass}`}
      style={{ filter: rankIconGlow(accent) }}
    >
      <RevealImage
        src={rankIcon}
        alt={`${gameTitle} rank icon for ${rank}`}
        fill
        priority={priority}
        sizes={imageSizes}
        className="object-contain"
        wrapClassName="!overflow-visible"
        placeholder="empty"
      />
    </div>
  );
}
