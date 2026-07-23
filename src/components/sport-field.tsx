// ─── SPORT FIELD SVG RENDERER ─────────────────────────────────────────────────
// Renderiza la cancha deportiva correcta para cada disciplina como SVG escalable.
// Las coordenadas internas son 100x65 (proporciones estándar de campo de fútbol).

import { SportType } from "@/lib/tactical-store";

interface SportFieldProps {
  sport: SportType;
  className?: string;
  width?: number;
  height?: number;
}

// Color palette for fields
const FIELD_COLORS = {
  grass: "#1a5c2a",
  grassAlt: "#196028",
  line: "rgba(255,255,255,0.85)",
  lineThick: "rgba(255,255,255,0.9)",
  court: "#c8860a",
  courtAlt: "#b87a09",
  courtLine: "rgba(255,255,255,0.9)",
  hardCourt: "#2563eb",
  hardCourtLine: "rgba(255,255,255,0.9)",
  pool: "#0369a1",
  poolLine: "rgba(255,255,255,0.7)",
  tatami: "#92400e",
  tatamiLine: "rgba(255,255,255,0.7)",
  track: "#b45309",
  trackLine: "rgba(255,255,255,0.8)",
};

// ─── FOOTBALL FIELD (100x65 viewBox) ─────────────────────────────────────────
function FootballField() {
  return (
    <g>
      {/* Striped grass */}
      {Array.from({ length: 10 }).map((_, i) => (
        <rect key={i} x={i * 10} y={0} width={10} height={65}
          fill={i % 2 === 0 ? FIELD_COLORS.grass : FIELD_COLORS.grassAlt} />
      ))}
      {/* Outer boundary */}
      <rect x={2} y={2} width={96} height={61} fill="none" stroke={FIELD_COLORS.line} strokeWidth={0.4} />
      {/* Center line */}
      <line x1={50} y1={2} x2={50} y2={63} stroke={FIELD_COLORS.line} strokeWidth={0.3} />
      {/* Center circle */}
      <circle cx={50} cy={32.5} r={9.15} fill="none" stroke={FIELD_COLORS.line} strokeWidth={0.3} />
      {/* Center spot */}
      <circle cx={50} cy={32.5} r={0.5} fill={FIELD_COLORS.line} />
      {/* Penalty areas */}
      <rect x={2} y={16.5} width={16.5} height={32} fill="none" stroke={FIELD_COLORS.line} strokeWidth={0.3} />
      <rect x={81.5} y={16.5} width={16.5} height={32} fill="none" stroke={FIELD_COLORS.line} strokeWidth={0.3} />
      {/* Goal areas */}
      <rect x={2} y={24.5} width={5.5} height={16} fill="none" stroke={FIELD_COLORS.line} strokeWidth={0.3} />
      <rect x={92.5} y={24.5} width={5.5} height={16} fill="none" stroke={FIELD_COLORS.line} strokeWidth={0.3} />
      {/* Goals */}
      <rect x={0} y={28.5} width={2} height={8} fill="none" stroke={FIELD_COLORS.lineThick} strokeWidth={0.5} />
      <rect x={98} y={28.5} width={2} height={8} fill="none" stroke={FIELD_COLORS.lineThick} strokeWidth={0.5} />
      {/* Penalty spots */}
      <circle cx={11} cy={32.5} r={0.4} fill={FIELD_COLORS.line} />
      <circle cx={89} cy={32.5} r={0.4} fill={FIELD_COLORS.line} />
      {/* Penalty arcs */}
      <path d={`M 18.5,24 A 9.15,9.15 0 0,0 18.5,41`} fill="none" stroke={FIELD_COLORS.line} strokeWidth={0.3} />
      <path d={`M 81.5,24 A 9.15,9.15 0 0,1 81.5,41`} fill="none" stroke={FIELD_COLORS.line} strokeWidth={0.3} />
      {/* Corner arcs */}
      <path d={`M 2,3.5 A 1.5,1.5 0 0,1 3.5,2`} fill="none" stroke={FIELD_COLORS.line} strokeWidth={0.3} />
      <path d={`M 96.5,2 A 1.5,1.5 0 0,1 98,3.5`} fill="none" stroke={FIELD_COLORS.line} strokeWidth={0.3} />
      <path d={`M 2,61.5 A 1.5,1.5 0 0,0 3.5,63`} fill="none" stroke={FIELD_COLORS.line} strokeWidth={0.3} />
      <path d={`M 96.5,63 A 1.5,1.5 0 0,0 98,61.5`} fill="none" stroke={FIELD_COLORS.line} strokeWidth={0.3} />
    </g>
  );
}

// ─── FUTSAL FIELD ─────────────────────────────────────────────────────────────
function FutsalField() {
  return (
    <g>
      <rect x={0} y={0} width={100} height={65} fill={FIELD_COLORS.hardCourt} />
      <rect x={2} y={2} width={96} height={61} fill="none" stroke={FIELD_COLORS.hardCourtLine} strokeWidth={0.4} />
      <line x1={50} y1={2} x2={50} y2={63} stroke={FIELD_COLORS.hardCourtLine} strokeWidth={0.3} />
      <circle cx={50} cy={32.5} r={6} fill="none" stroke={FIELD_COLORS.hardCourtLine} strokeWidth={0.3} />
      <circle cx={50} cy={32.5} r={0.5} fill={FIELD_COLORS.hardCourtLine} />
      {/* D areas */}
      <path d={`M 2,22 A 10,10 0 0,1 2,43`} fill="none" stroke={FIELD_COLORS.hardCourtLine} strokeWidth={0.4} />
      <path d={`M 98,22 A 10,10 0 0,0 98,43`} fill="none" stroke={FIELD_COLORS.hardCourtLine} strokeWidth={0.4} />
      <rect x={0} y={27.5} width={2} height={10} fill="none" stroke={FIELD_COLORS.hardCourtLine} strokeWidth={0.5} />
      <rect x={98} y={27.5} width={2} height={10} fill="none" stroke={FIELD_COLORS.hardCourtLine} strokeWidth={0.5} />
    </g>
  );
}

// ─── BASKETBALL COURT ─────────────────────────────────────────────────────────
function BasketballCourt() {
  return (
    <g>
      <rect x={0} y={0} width={100} height={65} fill={FIELD_COLORS.court} />
      {Array.from({ length: 10 }).map((_, i) => (
        <rect key={i} x={i * 10} y={0} width={10} height={65}
          fill={i % 2 === 0 ? FIELD_COLORS.court : FIELD_COLORS.courtAlt} opacity={0.5} />
      ))}
      <rect x={2} y={2} width={96} height={61} fill="none" stroke={FIELD_COLORS.courtLine} strokeWidth={0.5} />
      <line x1={50} y1={2} x2={50} y2={63} stroke={FIELD_COLORS.courtLine} strokeWidth={0.3} />
      <circle cx={50} cy={32.5} r={5.8} fill="none" stroke={FIELD_COLORS.courtLine} strokeWidth={0.3} />
      {/* Paint areas */}
      <rect x={2} y={22} width={19} height={21} fill="rgba(180,80,0,0.3)" stroke={FIELD_COLORS.courtLine} strokeWidth={0.3} />
      <rect x={79} y={22} width={19} height={21} fill="rgba(180,80,0,0.3)" stroke={FIELD_COLORS.courtLine} strokeWidth={0.3} />
      {/* Free throw lines */}
      <path d={`M 21,22 A 5.8,5.8 0 0,0 21,43`} fill="none" stroke={FIELD_COLORS.courtLine} strokeWidth={0.3} />
      <path d={`M 79,22 A 5.8,5.8 0 0,1 79,43`} fill="none" stroke={FIELD_COLORS.courtLine} strokeWidth={0.3} />
      {/* 3-point arcs */}
      <path d={`M 2,15 A 22,22 0 0,1 2,50`} fill="none" stroke={FIELD_COLORS.courtLine} strokeWidth={0.3} />
      <path d={`M 98,15 A 22,22 0 0,0 98,50`} fill="none" stroke={FIELD_COLORS.courtLine} strokeWidth={0.3} />
      {/* Baskets */}
      <circle cx={5} cy={32.5} r={1.5} fill="none" stroke="rgba(255,120,0,0.9)" strokeWidth={0.5} />
      <circle cx={95} cy={32.5} r={1.5} fill="none" stroke="rgba(255,120,0,0.9)" strokeWidth={0.5} />
      <line x1={3.5} y1={32.5} x2={2} y2={32.5} stroke="rgba(255,120,0,0.9)" strokeWidth={0.4} />
      <line x1={96.5} y1={32.5} x2={98} y2={32.5} stroke="rgba(255,120,0,0.9)" strokeWidth={0.4} />
    </g>
  );
}

// ─── VOLLEYBALL COURT ─────────────────────────────────────────────────────────
function VolleyballCourt() {
  return (
    <g>
      <rect x={0} y={0} width={100} height={65} fill="#7c3aed" opacity={0.4} />
      <rect x={0} y={0} width={100} height={65} fill={FIELD_COLORS.hardCourt} />
      <rect x={5} y={5} width={90} height={55} fill="none" stroke={FIELD_COLORS.courtLine} strokeWidth={0.5} />
      {/* Net */}
      <line x1={50} y1={5} x2={50} y2={60} stroke={FIELD_COLORS.courtLine} strokeWidth={0.8} />
      {/* Attack lines (3m) */}
      <line x1={30} y1={5} x2={30} y2={60} stroke={FIELD_COLORS.courtLine} strokeWidth={0.3} strokeDasharray="1,1" />
      <line x1={70} y1={5} x2={70} y2={60} stroke={FIELD_COLORS.courtLine} strokeWidth={0.3} strokeDasharray="1,1" />
      {/* Service zones */}
      <line x1={5} y1={22} x2={5} y2={43} stroke={FIELD_COLORS.courtLine} strokeWidth={0.3} />
      <line x1={95} y1={22} x2={95} y2={43} stroke={FIELD_COLORS.courtLine} strokeWidth={0.3} />
    </g>
  );
}

// ─── RUGBY FIELD ──────────────────────────────────────────────────────────────
function RugbyField() {
  return (
    <g>
      {Array.from({ length: 10 }).map((_, i) => (
        <rect key={i} x={i * 10} y={0} width={10} height={65}
          fill={i % 2 === 0 ? FIELD_COLORS.grass : FIELD_COLORS.grassAlt} />
      ))}
      <rect x={2} y={2} width={96} height={61} fill="none" stroke={FIELD_COLORS.line} strokeWidth={0.4} />
      {/* In-goal areas */}
      <rect x={2} y={2} width={10} height={61} fill="rgba(255,255,255,0.05)" stroke={FIELD_COLORS.line} strokeWidth={0.3} />
      <rect x={88} y={2} width={10} height={61} fill="rgba(255,255,255,0.05)" stroke={FIELD_COLORS.line} strokeWidth={0.3} />
      {/* Halfway */}
      <line x1={50} y1={2} x2={50} y2={63} stroke={FIELD_COLORS.line} strokeWidth={0.3} />
      {/* Yardage lines every 10m */}
      {[20, 30, 40, 50, 60, 70, 80].map((x) => (
        <line key={x} x1={x} y1={2} x2={x} y2={63} stroke={FIELD_COLORS.line} strokeWidth={0.2} strokeDasharray="0.5,0.5" />
      ))}
      {/* Posts */}
      <line x1={5.5} y1={30} x2={5.5} y2={35} stroke="rgba(255,200,0,0.8)" strokeWidth={0.6} />
      <line x1={94.5} y1={30} x2={94.5} y2={35} stroke="rgba(255,200,0,0.8)" strokeWidth={0.6} />
    </g>
  );
}

// ─── TENNIS COURT ─────────────────────────────────────────────────────────────
function TennisCourt() {
  return (
    <g>
      <rect x={0} y={0} width={100} height={65} fill="#166534" />
      <rect x={5} y={3} width={90} height={59} fill="none" stroke={FIELD_COLORS.line} strokeWidth={0.5} />
      {/* Net */}
      <line x1={5} y1={32.5} x2={95} y2={32.5} stroke={FIELD_COLORS.line} strokeWidth={0.7} />
      {/* Singles sidelines */}
      <line x1={15} y1={3} x2={15} y2={62} stroke={FIELD_COLORS.line} strokeWidth={0.3} />
      <line x1={85} y1={3} x2={85} y2={62} stroke={FIELD_COLORS.line} strokeWidth={0.3} />
      {/* Service lines */}
      <line x1={15} y1={16} x2={85} y2={16} stroke={FIELD_COLORS.line} strokeWidth={0.3} />
      <line x1={15} y1={49} x2={85} y2={49} stroke={FIELD_COLORS.line} strokeWidth={0.3} />
      {/* Centre service marks */}
      <line x1={50} y1={16} x2={50} y2={49} stroke={FIELD_COLORS.line} strokeWidth={0.3} />
    </g>
  );
}

// ─── SWIMMING POOL ─────────────────────────────────────────────────────────────
function SwimmingPool() {
  const numLanes = 8;
  const laneWidth = 90 / numLanes;
  return (
    <g>
      <rect x={0} y={0} width={100} height={65} fill={FIELD_COLORS.pool} />
      <rect x={5} y={5} width={90} height={55} fill="rgba(14,165,233,0.3)" stroke={FIELD_COLORS.poolLine} strokeWidth={0.4} />
      {Array.from({ length: numLanes - 1 }).map((_, i) => (
        <line key={i}
          x1={5 + (i + 1) * laneWidth} y1={5}
          x2={5 + (i + 1) * laneWidth} y2={60}
          stroke={FIELD_COLORS.poolLine} strokeWidth={0.3} strokeDasharray="1,1"
        />
      ))}
      {/* Lane numbers */}
      {Array.from({ length: numLanes }).map((_, i) => (
        <text key={i}
          x={5 + i * laneWidth + laneWidth / 2} y={62}
          textAnchor="middle" fontSize={2.5} fill={FIELD_COLORS.poolLine} fontFamily="sans-serif"
        >{i + 1}</text>
      ))}
      {/* Start and turn markers */}
      <line x1={5} y1={12.5} x2={95} y2={12.5} stroke="rgba(255,0,0,0.5)" strokeWidth={0.3} strokeDasharray="1,0.5" />
      <line x1={5} y1={52.5} x2={95} y2={52.5} stroke="rgba(255,0,0,0.5)" strokeWidth={0.3} strokeDasharray="1,0.5" />
    </g>
  );
}

// ─── MARTIAL ARTS MAT ─────────────────────────────────────────────────────────
function MartialArtsMat() {
  return (
    <g>
      <rect x={0} y={0} width={100} height={65} fill="#1c1917" />
      <rect x={5} y={2.5} width={90} height={60} fill={FIELD_COLORS.tatami} />
      {/* Outer safety zone */}
      <rect x={5} y={2.5} width={90} height={60} fill="none" stroke={FIELD_COLORS.tatamiLine} strokeWidth={0.5} />
      {/* Contest area */}
      <rect x={15} y={10} width={70} height={45} fill="rgba(255,255,255,0.05)" stroke={FIELD_COLORS.tatamiLine} strokeWidth={0.4} />
      {/* Center zone */}
      <rect x={35} y={22.5} width={30} height={20} fill="rgba(14,165,233,0.15)" stroke={FIELD_COLORS.tatamiLine} strokeWidth={0.3} />
      {/* Center mark */}
      <circle cx={50} cy={32.5} r={2} fill="none" stroke={FIELD_COLORS.tatamiLine} strokeWidth={0.4} />
      {/* Referee marks */}
      <line x1={47} y1={32.5} x2={53} y2={32.5} stroke={FIELD_COLORS.tatamiLine} strokeWidth={0.3} />
      <line x1={50} y1={29.5} x2={50} y2={35.5} stroke={FIELD_COLORS.tatamiLine} strokeWidth={0.3} />
    </g>
  );
}

// ─── ATHLETICS TRACK ──────────────────────────────────────────────────────────
function AthleticsTrack() {
  return (
    <g>
      <rect x={0} y={0} width={100} height={65} fill="#16a34a" opacity={0.5} />
      <rect x={0} y={0} width={100} height={65} fill={FIELD_COLORS.track} />
      {/* Infield grass */}
      <ellipse cx={50} cy={32.5} rx={33} ry={22} fill={FIELD_COLORS.grass} />
      {/* Track lanes (8 lanes) */}
      {Array.from({ length: 8 }).map((_, i) => (
        <ellipse key={i} cx={50} cy={32.5}
          rx={33 + (i + 1) * 3.5} ry={22 + (i + 1) * 3.5}
          fill="none" stroke={FIELD_COLORS.trackLine}
          strokeWidth={i === 7 ? 0.5 : 0.25}
        />
      ))}
      {/* Start/finish straight */}
      <line x1={17} y1={32.5} x2={83} y2={32.5} stroke={FIELD_COLORS.trackLine} strokeWidth={0.3} strokeDasharray="1,1" />
      {/* Finish line */}
      <line x1={82} y1={10} x2={82} y2={55} stroke="rgba(255,255,255,0.9)" strokeWidth={0.6} />
    </g>
  );
}

// ─── HOCKEY FIELD ─────────────────────────────────────────────────────────────
function HockeyField() {
  return (
    <g>
      {Array.from({ length: 10 }).map((_, i) => (
        <rect key={i} x={i * 10} y={0} width={10} height={65}
          fill={i % 2 === 0 ? "#15803d" : "#166534"} />
      ))}
      <rect x={2} y={2} width={96} height={61} fill="none" stroke={FIELD_COLORS.line} strokeWidth={0.4} />
      <line x1={50} y1={2} x2={50} y2={63} stroke={FIELD_COLORS.line} strokeWidth={0.3} />
      {/* 22m lines */}
      <line x1={22} y1={2} x2={22} y2={63} stroke={FIELD_COLORS.line} strokeWidth={0.3} strokeDasharray="1,1" />
      <line x1={78} y1={2} x2={78} y2={63} stroke={FIELD_COLORS.line} strokeWidth={0.3} strokeDasharray="1,1" />
      {/* Shooting circles */}
      <path d={`M 2,22 A 14.63,14.63 0 0,1 2,43`} fill="rgba(255,255,255,0.05)" stroke={FIELD_COLORS.line} strokeWidth={0.3} />
      <path d={`M 98,22 A 14.63,14.63 0 0,0 98,43`} fill="rgba(255,255,255,0.05)" stroke={FIELD_COLORS.line} strokeWidth={0.3} />
      {/* Penalty spots */}
      <circle cx={8} cy={32.5} r={0.4} fill={FIELD_COLORS.line} />
      <circle cx={92} cy={32.5} r={0.4} fill={FIELD_COLORS.line} />
      {/* Goals */}
      <rect x={0} y={29} width={2} height={7} fill="none" stroke={FIELD_COLORS.lineThick} strokeWidth={0.5} />
      <rect x={98} y={29} width={2} height={7} fill="none" stroke={FIELD_COLORS.lineThick} strokeWidth={0.5} />
    </g>
  );
}

// ─── BASEBALL DIAMOND ─────────────────────────────────────────────────────────
function BaseballField() {
  return (
    <g>
      <rect x={0} y={0} width={100} height={65} fill={FIELD_COLORS.grass} />
      {/* Outfield arc */}
      <path d={`M 10,63 A 65,65 0 0,1 90,63`} fill={FIELD_COLORS.grassAlt} stroke={FIELD_COLORS.line} strokeWidth={0.4} />
      {/* Infield dirt */}
      <path d={`M 35,63 L 50,35 L 65,63`} fill="rgba(180,120,50,0.4)" />
      <circle cx={50} cy={52} r={12} fill="rgba(180,120,50,0.25)" />
      {/* Diamond */}
      <polygon points="50,37 65,52 50,63 35,52"
        fill="rgba(180,120,50,0.15)" stroke={FIELD_COLORS.line} strokeWidth={0.4} />
      {/* Bases */}
      {[[50, 37], [65, 52], [50, 63], [35, 52]].map(([x, y], i) => (
        <rect key={i} x={x - 1.2} y={y - 1.2} width={2.4} height={2.4}
          fill="white" stroke="#ccc" strokeWidth={0.2} transform={`rotate(45,${x},${y})`} />
      ))}
      {/* Pitcher's mound */}
      <circle cx={50} cy={52} r={1.5} fill="rgba(180,120,50,0.8)" stroke={FIELD_COLORS.line} strokeWidth={0.2} />
      {/* Foul lines */}
      <line x1={50} y1={63} x2={10} y2={63} stroke={FIELD_COLORS.line} strokeWidth={0.3} />
      <line x1={50} y1={63} x2={90} y2={63} stroke={FIELD_COLORS.line} strokeWidth={0.3} />
    </g>
  );
}

// ─── GENERIC FALLBACK ─────────────────────────────────────────────────────────
function GenericField({ label }: { label: string }) {
  return (
    <g>
      <rect x={0} y={0} width={100} height={65} fill="#1e293b" />
      <rect x={3} y={3} width={94} height={59} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={0.5} strokeDasharray="2,2" />
      <text x={50} y={33} textAnchor="middle" fontSize={5} fill="rgba(255,255,255,0.4)" fontFamily="sans-serif">{label}</text>
    </g>
  );
}

// ─── INNER FIELD (embed inside another SVG — returns only <g> elements) ──────
// Use this when placing the field inside a parent <svg> to avoid nested SVG
// viewport issues that break coordinate systems and proportions.
export function SportFieldInner({ sport }: { sport: SportType }) {
  switch (sport) {
    case "football":    return <FootballField />;
    case "futsal":      return <FutsalField />;
    case "basketball":  return <BasketballCourt />;
    case "volleyball":  return <VolleyballCourt />;
    case "rugby":       return <RugbyField />;
    case "hockey":      return <HockeyField />;
    case "baseball":
    case "softball":    return <BaseballField />;
    case "tennis":      return <TennisCourt />;
    case "swimming":    return <SwimmingPool />;
    case "martial-arts":return <MartialArtsMat />;
    case "athletics":   return <AthleticsTrack />;
    default:            return <GenericField label={sport} />;
  }
}

// ─── STANDALONE EXPORT (full <svg> wrapper for use outside a canvas) ──────────
export function SportField({ sport, className = "", width = 800, height = 520 }: SportFieldProps) {
  return (
    <svg
      viewBox="0 0 100 65"
      className={`w-full h-auto ${className}`}
      style={{ borderRadius: "12px", boxShadow: "0 4px 32px rgba(0,0,0,0.5)" }}
    >
      <SportFieldInner sport={sport} />
    </svg>
  );
}

export default SportField;
