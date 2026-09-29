import { cn } from "@/lib/utils";

/**
 * ShadowOps official logo — animated organizational network with flowing
 * particles and the glowing intelligence ring around the "O".
 *
 * Variants:
 *  - "full":    network + wordmark + tagline (wide lockup, auth/landing)
 *  - "compact": network + wordmark (header/footer)
 *  - "mark":    network glyph only (buttons, cards, small spaces)
 */

type LogoVariant = "full" | "compact" | "mark";

function Gradients() {
  return (
    <defs>
      <linearGradient id="soBrandGradient" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#38BDF8" />
        <stop offset="45%" stopColor="#6366F1" />
        <stop offset="100%" stopColor="#8B5CF6" />
      </linearGradient>
      <linearGradient id="soTextGradient" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#F8FAFC" />
        <stop offset="48%" stopColor="#E0F2FE" />
        <stop offset="100%" stopColor="#A5B4FC" />
      </linearGradient>
      <linearGradient id="soOpsGradient" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#38BDF8" />
        <stop offset="50%" stopColor="#6366F1" />
        <stop offset="100%" stopColor="#A855F7" />
      </linearGradient>
      <radialGradient id="soParticleGradient">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="30%" stopColor="#67E8F9" />
        <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="soNodeGradient">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="25%" stopColor="#67E8F9" />
        <stop offset="65%" stopColor="#38BDF8" />
        <stop offset="100%" stopColor="#4F46E5" />
      </radialGradient>
      <filter id="soSoftGlow" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="soStrongGlow" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur stdDeviation="8" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="soTextGlow" x="-30%" y="-100%" width="160%" height="300%">
        <feGaussianBlur stdDeviation="5" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}

function NetworkGlyph() {
  return (
    <g filter="url(#soSoftGlow)">
      {/* main S-shaped organizational path */}
      <path
        d="M190 35 C135 35 72 52 72 88 C72 122 125 126 158 137 C192 148 205 169 205 190 C205 211 165 218 115 218"
        fill="none"
        stroke="url(#soBrandGradient)"
        strokeWidth="12"
        strokeLinecap="round"
      />
      {/* inner energy line */}
      <path
        className="so-energy"
        d="M190 35 C135 35 72 52 72 88 C72 122 125 126 158 137 C192 148 205 169 205 190 C205 211 165 218 115 218"
        fill="none"
        stroke="#67E8F9"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* organizational connections */}
      <g fill="none" stroke="url(#soBrandGradient)" strokeLinecap="round">
        <path d="M72 88 C110 68 150 55 190 35" strokeWidth="2" strokeDasharray="2 8" className="so-conn" />
        <path d="M72 88 C115 95 160 100 195 78" strokeWidth="2" strokeDasharray="3 9" className="so-conn so-conn-2" />
        <path d="M115 218 C145 180 170 125 195 78" strokeWidth="2" strokeDasharray="2 9" className="so-conn so-conn-3" />
        <path d="M195 78 C230 100 270 105 310 105" strokeWidth="2" strokeDasharray="3 8" className="so-conn so-conn-4" />
        <path d="M310 105 C345 80 375 70 405 72" strokeWidth="2" strokeDasharray="2 9" className="so-conn so-conn-5" />
      </g>
      {/* nodes */}
      <g>
        <g className="so-node" style={{ animationDelay: "0s" }}>
          <circle cx="190" cy="35" r="11" fill="url(#soNodeGradient)" />
          <circle cx="190" cy="35" r="18" fill="none" stroke="#38BDF8" strokeWidth="1" opacity="0.5" />
        </g>
        <g className="so-node" style={{ animationDelay: "0.3s" }}>
          <circle cx="72" cy="88" r="11" fill="url(#soNodeGradient)" />
          <circle cx="72" cy="88" r="18" fill="none" stroke="#6366F1" strokeWidth="1" opacity="0.5" />
        </g>
        <g className="so-node" style={{ animationDelay: "0.6s" }}>
          <circle cx="195" cy="78" r="14" fill="url(#soNodeGradient)" />
          <circle cx="195" cy="78" r="24" fill="none" stroke="#22D3EE" strokeWidth="1" strokeDasharray="2 5" />
          <circle cx="195" cy="78" r="31" fill="none" stroke="#6366F1" strokeWidth="1" opacity="0.35" />
        </g>
        <g className="so-node" style={{ animationDelay: "0.9s" }}>
          <circle cx="115" cy="218" r="11" fill="url(#soNodeGradient)" />
          <circle cx="115" cy="218" r="18" fill="none" stroke="#6366F1" strokeWidth="1" opacity="0.5" />
        </g>
        <g className="so-node" style={{ animationDelay: "1.2s" }}>
          <circle cx="310" cy="105" r="9" fill="url(#soNodeGradient)" />
          <circle cx="310" cy="105" r="16" fill="none" stroke="#22D3EE" strokeWidth="1" opacity="0.5" />
        </g>
        <g className="so-node" style={{ animationDelay: "1.5s" }}>
          <circle cx="405" cy="72" r="7" fill="#22D3EE" />
          <circle cx="405" cy="72" r="14" fill="none" stroke="#22D3EE" strokeWidth="1" opacity="0.45" />
        </g>
      </g>
      {/* flowing particles */}
      <g>
        <circle r="5" fill="url(#soParticleGradient)">
          <animateMotion dur="2.8s" repeatCount="indefinite">
            <mpath href="#soParticlePath1" />
          </animateMotion>
        </circle>
        <circle r="4" fill="url(#soParticleGradient)">
          <animateMotion dur="2.1s" begin="0.4s" repeatCount="indefinite">
            <mpath href="#soParticlePath2" />
          </animateMotion>
        </circle>
        <circle r="4" fill="url(#soParticleGradient)">
          <animateMotion dur="3.2s" begin="0.8s" repeatCount="indefinite">
            <mpath href="#soParticlePath3" />
          </animateMotion>
        </circle>
        <circle r="5" fill="url(#soParticleGradient)">
          <animateMotion dur="2.5s" begin="1.1s" repeatCount="indefinite">
            <mpath href="#soParticlePath4" />
          </animateMotion>
        </circle>
        <circle cx="45" cy="45" r="2" fill="#38BDF8">
          <animate attributeName="opacity" values=".2;1;.2" dur="1.8s" repeatCount="indefinite" />
        </circle>
        <circle cx="250" cy="30" r="2" fill="#8B5CF6">
          <animate attributeName="opacity" values=".1;1;.1" dur="2.2s" repeatCount="indefinite" />
        </circle>
        <circle cx="350" cy="135" r="2" fill="#22D3EE">
          <animate attributeName="opacity" values=".2;1;.2" dur="1.5s" repeatCount="indefinite" />
        </circle>
      </g>
    </g>
  );
}

export function ShadowLogo({
  variant = "compact",
  className,
  style,
}: {
  variant?: LogoVariant;
  className?: string;
  style?: React.CSSProperties;
}) {
  const isMark = variant === "mark";
  const isFull = variant === "full";
  const viewBox = isMark ? "40 10 400 230" : isFull ? "0 0 900 240" : "40 10 440 230";

  return (
    <svg
      viewBox={viewBox}
      className={cn("so-logo", className)}
      style={style}
      role="img"
      aria-label="ShadowOps — Organizational Intelligence"
    >
      <Gradients />
      <path
        id="soParticlePath1"
        d="M72 50 C120 25 170 42 195 78 C220 115 165 150 115 175"
        fill="none"
        stroke="none"
      />
      <path
        id="soParticlePath2"
        d="M72 50 C115 85 150 110 195 78 C240 45 270 72 310 105"
        fill="none"
        stroke="none"
      />
      <path
        id="soParticlePath3"
        d="M115 175 C155 155 165 120 195 78 C220 48 255 55 290 76"
        fill="none"
        stroke="none"
      />
      <path
        id="soParticlePath4"
        d="M195 78 C230 105 265 115 310 105 C345 95 370 70 405 72"
        fill="none"
        stroke="none"
      />
      <NetworkGlyph />
      {!isMark && (
        <g filter="url(#soTextGlow)">
          <text
            x="350"
            y="105"
            fontFamily="Inter, Arial, sans-serif"
            fontSize="67"
            fontWeight="800"
            letterSpacing="-3"
            fill="url(#soTextGradient)"
          >
            Shadow
          </text>
          <text
            x="610"
            y="105"
            fontFamily="Inter, Arial, sans-serif"
            fontSize="67"
            fontWeight="800"
            letterSpacing="-3"
            fill="url(#soOpsGradient)"
          >
            O
          </text>
          <text
            x="668"
            y="105"
            fontFamily="Inter, Arial, sans-serif"
            fontSize="67"
            fontWeight="800"
            letterSpacing="-3"
            fill="url(#soOpsGradient)"
          >
            ps
          </text>
        </g>
      )}
      {isFull && (
        <g>
          <line x1="355" y1="132" x2="405" y2="132" stroke="url(#soBrandGradient)" strokeWidth="2" />
          <text
            x="420"
            y="137"
            fontFamily="Inter, Arial, sans-serif"
            fontSize="15"
            fontWeight="500"
            letterSpacing="4"
            fill="#94A3B8"
          >
            ORGANIZATIONAL INTELLIGENCE
          </text>
          <line x1="760" y1="132" x2="815" y2="132" stroke="url(#soBrandGradient)" strokeWidth="2" />
        </g>
      )}
    </svg>
  );
}
