import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  ArrowDown,
  ArrowRight,
  Check,
  CircleHelp,
  Clipboard,
  Download,
  FileText,
  Image as ImageIcon,
  Layers3,
  LoaderCircle,
  Megaphone,
  Play,
  Repeat2,
  Send,
  Share2,
  Sparkles,
  Video,
  WandSparkles,
  type LucideIcon,
} from 'lucide-react';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

type FormatId = 'meme' | 'thread' | 'video' | 'art';
type Cadence = 1 | 3 | 7 | 14;
type Result = {
  engagement: number;
  impressions: number;
  adRevenue: number;
  creatorShare: number;
  format: FormatId;
  cadence: Cadence;
};

const formatOptions: Array<{
  id: FormatId;
  name: string;
  detail: string;
  icon: LucideIcon;
  color: string;
}> = [
  { id: 'meme', name: 'Meme', detail: 'Fast + punchy', icon: WandSparkles, color: 'coral' },
  { id: 'thread', name: 'Thread', detail: 'Ideas that stick', icon: FileText, color: 'lilac' },
  { id: 'video', name: 'Short Video', detail: 'Scroll stopper', icon: Video, color: 'mint' },
  { id: 'art', name: 'Art / Animation', detail: 'Made to replay', icon: ImageIcon, color: 'sun' },
];

const cadenceOptions: Array<{ value: Cadence; label: string; note: string }> = [
  { value: 1, label: '1x', note: 'per week' },
  { value: 3, label: '3x', note: 'per week' },
  { value: 7, label: '7x', note: 'per week' },
  { value: 14, label: '14x', note: 'per week' },
];

const formatMeta: Record<FormatId, { label: string; base: number; cpm: number }> = {
  meme: { label: 'Meme', base: 7400, cpm: 1.22 },
  thread: { label: 'Thread', base: 5200, cpm: 2.08 },
  video: { label: 'Short Video', base: 11800, cpm: 2.86 },
  art: { label: 'Art / Animation', base: 8600, cpm: 3.42 },
};

function safeNumber(value: number, fallback = 0) {
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function formatCompact(value: number) {
  const safe = safeNumber(value);
  if (safe >= 1_000_000) return `${(safe / 1_000_000).toFixed(1)}M`;
  if (safe >= 1_000) return `${(safe / 1_000).toFixed(safe >= 10_000 ? 0 : 1)}K`;
  return Math.round(safe).toLocaleString();
}

function formatMoney(value: number) {
  return safeNumber(value).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function simulateResult(format: FormatId, cadence: Cadence): Result {
  const meta = formatMeta[format];
  const cadenceLift = 1 + cadence * 0.16 + Math.sqrt(cadence) * 0.1;
  const engagement = Math.round(safeNumber(meta.base * cadenceLift));
  const impressions = Math.round(safeNumber(engagement * (format === 'thread' ? 3.7 : 4.3)));
  const adRevenue = safeNumber((impressions / 1000) * meta.cpm);
  const creatorShare = safeNumber(adRevenue * 0.45);
  return { engagement, impressions, adRevenue, creatorShare, format, cadence };
}

function useCountUp(target: number, active: boolean, duration = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) {
      setValue(0);
      return;
    }
    const safeTarget = safeNumber(target);
    const startedAt = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(safeTarget * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, active, duration]);
  return safeNumber(value);
}

function BlobMascot({ loading = false, compact = false }: { loading?: boolean; compact?: boolean }) {
  return (
    <div
      className={`${compact ? 'h-16 w-16' : 'h-32 w-32 sm:h-40 sm:w-40'} relative ${loading ? 'animate-blob' : 'animate-float'}`}
      data-testid="mascot-blob"
      aria-label="Dlicom blob mascot"
      role="img"
    >
      <svg viewBox="0 0 180 180" className="h-full w-full overflow-visible" aria-hidden="true">
        <path
          d="M91 13c22-3 48 7 62 27 14 19 18 44 10 67-8 25-28 43-53 53-24 9-52 8-70-8-18-16-25-44-22-68 2-22 15-44 33-57 11-8 25-12 40-14Z"
          fill="#7667D8"
          stroke="#29253F"
          strokeWidth="6"
          strokeLinejoin="round"
        />
        <path d="M48 73c3-8 11-13 19-13" fill="none" stroke="#A9F0D0" strokeWidth="6" strokeLinecap="round" />
        <circle cx="65" cy="83" r="6" fill="#29253F" />
        <circle cx="116" cy="78" r="6" fill="#29253F" />
        <path d="M72 108c9 8 23 9 34 0" fill="none" stroke="#29253F" strokeWidth="5" strokeLinecap="round" />
        <path d="M81 24c-6 8-7 17-4 25" fill="none" stroke="#A9F0D0" strokeWidth="5" strokeLinecap="round" opacity=".75" />
        <circle cx="137" cy="53" r="5" fill="#FF956F" />
      </svg>
    </div>
  );
}

function ChoiceCard({
  option,
  selected,
  onSelect,
}: {
  option: (typeof formatOptions)[number];
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = option.icon;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      data-testid={`button-format-${option.id}`}
      className={`focus-ring group relative min-h-[112px] overflow-hidden rounded-[1.35rem] border-2 p-4 text-left transition-transform duration-200 active:translate-y-1 ${
        selected
          ? 'border-[#29253F] bg-[#A9F0D0] shadow-[4px_5px_0_#29253F]'
          : 'border-[#D7D2DF] bg-[#FBF8F0] hover:-translate-y-1 hover:border-[#7667D8] hover:shadow-[0_10px_20px_rgba(62,57,112,.10)]'
      }`}
    >
      <span className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${selected ? 'bg-[#29253F] text-[#A9F0D0]' : option.color === 'coral' ? 'bg-[#FFD0C0] text-[#29253F]' : option.color === 'lilac' ? 'bg-[#DED9FF] text-[#29253F]' : option.color === 'mint' ? 'bg-[#C6F4DF] text-[#29253F]' : 'bg-[#FFE59A] text-[#29253F]'}`}>
        <Icon size={18} strokeWidth={2.2} />
      </span>
      <span className="block font-display text-[15px] font-bold tracking-[-.02em] text-[#29253F]">{option.name}</span>
      <span className="mt-1 block text-[11px] font-medium text-[#716D7D]">{option.detail}</span>
      {selected && <Check size={16} className="absolute right-4 top-4 text-[#29253F]" strokeWidth={3} />}
    </button>
  );
}

function StatRow({
  icon: Icon,
  label,
  value,
  detail,
  delay,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  delay: string;
}) {
  return (
    <div className={`animate-rise ${delay} flex items-center gap-3 border-b border-[#E7E1D8] py-4 last:border-b-0`} data-testid={`stat-${label.toLowerCase().replaceAll(' ', '-')}`}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F2ECDF] text-[#7667D8]">
        <Icon size={18} strokeWidth={2.4} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase tracking-[.09em] text-[#7D7886]">{label}</p>
        <p className="mt-0.5 font-display text-xl font-bold tracking-[-.04em] text-[#29253F]">{value}</p>
      </div>
      <span className="text-right text-[11px] font-medium leading-tight text-[#908A98]">{detail}</span>
    </div>
  );
}

function ShareCard({ result, creatorValue }: { result: Result; creatorValue: number }) {
  const meta = formatMeta[result.format];
  return (
    <div
      id="share-card"
      data-testid="share-card"
      className="relative isolate overflow-hidden rounded-[1.75rem] border-2 border-[#29253F] bg-[#7667D8] p-5 text-[#FBF8F0] shadow-[6px_7px_0_#29253F] sm:p-6"
    >
      <div className="absolute -right-10 -top-12 -z-10 h-36 w-36 rounded-full border-[18px] border-[#FF956F] opacity-90" />
      <div className="absolute -bottom-12 -left-8 -z-10 h-28 w-28 rounded-full bg-[#A9F0D0] opacity-90" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] font-medium uppercase tracking-[.18em] text-[#DCD8FF]">Dlicom / revenue pulse</p>
          <h3 className="mt-2 font-display text-2xl font-bold leading-[.96] tracking-[-.06em]">Your content<br />has a pulse.</h3>
        </div>
        <BlobMascot compact />
      </div>
      <div className="mt-5 rounded-2xl border border-[#A49BE9] bg-[#6558C4] p-4">
        <p className="text-xs font-semibold text-[#DCD8FF]">Creator share</p>
        <p className="mt-1 font-display text-5xl font-bold tracking-[-.08em] text-[#FBF8F0]" data-testid="result-creator-share">
          {formatMoney(creatorValue)}
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-[.08em]">
          <span className="rounded-full bg-[#A9F0D0] px-2.5 py-1 text-[#29253F]">45% creator share</span>
          <span className="rounded-full border border-[#A49BE9] px-2.5 py-1 text-[#E7E3FF]">{meta.label}</span>
        </div>
      </div>
      <div className="mt-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#DCD8FF]">Posting rhythm</p>
          <p className="mt-1 font-display text-xl font-bold">{result.cadence}x <span className="text-sm font-medium text-[#DCD8FF]">weekly</span></p>
        </div>
        <p className="max-w-[126px] text-right text-[11px] font-medium leading-[1.35] text-[#DCD8FF]">A tiny simulation. A very real reason to keep making.</p>
      </div>
    </div>
  );
}

function AppShell() {
  const [format, setFormat] = useState<FormatId | null>(null);
  const [cadence, setCadence] = useState<Cadence | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);
  const runTimerRef = useRef<number | null>(null);
  const runningRef = useRef(false);

  useEffect(() => () => {
    if (runTimerRef.current !== null) window.clearTimeout(runTimerRef.current);
  }, []);

  const canSimulate = Boolean(format && cadence && !isSimulating);
  const creatorValue = useCountUp(result?.creatorShare ?? 0, Boolean(result), 1000);
  const selectedFormat = useMemo(() => formatOptions.find((option) => option.id === format), [format]);

  const runSimulation = () => {
    if (!format || !cadence || runningRef.current) return;
    runningRef.current = true;
    setIsSimulating(true);
    setCopied(false);
    runTimerRef.current = window.setTimeout(() => {
      setResult(simulateResult(format, cadence));
      setIsSimulating(false);
      runningRef.current = false;
      runTimerRef.current = null;
      window.setTimeout(() => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }, 1800);
  };

  const copyShareText = async () => {
    if (!result) return;
    const text = `I simulated ${formatMoney(result.creatorShare)} in creator earnings on Dlicom. ${formatMeta[result.format].label} at ${result.cadence}x weekly.`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        const fallbackWorked = document.execCommand('copy');
        setCopied(fallbackWorked);
        if (fallbackWorked) window.setTimeout(() => setCopied(false), 2200);
      } catch {
        setCopied(false);
      } finally {
        textarea.remove();
      }
    }
  };

  const downloadCard = () => {
    if (!result) return;
    const creator = formatMoney(result.creatorShare);
    const formatLabel = formatMeta[result.format].label;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="760" viewBox="0 0 1200 760"><rect width="1200" height="760" rx="52" fill="#7667D8"/><circle cx="1080" cy="70" r="150" fill="#FF956F"/><circle cx="100" cy="720" r="130" fill="#A9F0D0"/><text x="84" y="104" fill="#DCD8FF" font-family="monospace" font-size="22" letter-spacing="5">DLICOM / REVENUE PULSE</text><text x="84" y="220" fill="#FBF8F0" font-family="sans-serif" font-weight="800" font-size="70">Your content</text><text x="84" y="298" fill="#FBF8F0" font-family="sans-serif" font-weight="800" font-size="70">has a pulse.</text><rect x="84" y="360" width="1032" height="230" rx="30" fill="#6558C4"/><text x="124" y="430" fill="#DCD8FF" font-family="sans-serif" font-size="24">Creator share</text><text x="124" y="525" fill="#FBF8F0" font-family="sans-serif" font-weight="800" font-size="84">${creator}</text><text x="124" y="568" fill="#A9F0D0" font-family="sans-serif" font-weight="700" font-size="20">45% CREATOR SHARE  ·  ${formatLabel.toUpperCase()}</text><text x="84" y="678" fill="#DCD8FF" font-family="sans-serif" font-size="22">${result.cadence}x weekly posting rhythm</text></svg>`;
    const anchor = document.createElement('a');
    anchor.href = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    anchor.download = 'dlicom-revenue-pulse.svg';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  return (
    <main className="grain min-h-[100dvh] overflow-x-hidden">
      <div className="relative mx-auto max-w-[1180px] px-5 pb-14 pt-5 sm:px-8 sm:pt-8">
        <div className="pointer-events-none absolute -left-24 top-44 h-64 w-64 rounded-full bg-[#C6F4DF] opacity-70 blur-[1px]" />
        <div className="pointer-events-none absolute -right-28 top-16 h-80 w-80 rounded-full bg-[#FFE59A] opacity-70" />

        <header className="animate-rise relative z-10 flex items-center justify-between" data-testid="header">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-[#29253F] bg-[#FF956F] shadow-[3px_3px_0_#29253F]">
              <BlobMascot compact />
            </div>
            <div>
              <p className="font-display text-base font-bold tracking-[-.04em] text-[#29253F]">dlicom</p>
              <p className="font-mono text-[9px] uppercase tracking-[.14em] text-[#817B8B]">ad revenue simulator</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-[#D7D2DF] bg-[#FBF8F0] px-3 py-2 text-[10px] font-bold uppercase tracking-[.12em] text-[#716D7D] sm:flex">
            <Sparkles size={13} className="text-[#F07B58]" />
            Made for the timeline
          </div>
        </header>

        <section className="relative z-10 mx-auto max-w-[760px] pb-10 pt-16 text-center sm:pb-14 sm:pt-24">
          <div className="animate-rise stagger-1 mx-auto mb-5 flex w-fit items-center gap-2 rounded-full border border-[#D7D2DF] bg-[#FBF8F0]/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.14em] text-[#716D7D] backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-[#FF956F]" />
            A playful forecast for your next post
          </div>
          <h1 className="animate-rise stagger-2 font-display text-[clamp(3.2rem,11vw,7.4rem)] font-bold leading-[.88] tracking-[-.095em] text-[#29253F]">
            Make your<br /><span className="text-[#7667D8]">content pay.</span>
          </h1>
          <p className="animate-rise stagger-3 mx-auto mt-7 max-w-[520px] text-sm font-medium leading-7 text-[#716D7D] sm:text-base">
            Pick a format, set your rhythm, and get a tiny glimpse at what your content could earn from platform ads.
          </p>
        </section>

        <section className="relative z-10 mx-auto max-w-[900px]">
          <div className="relative rounded-[2rem] border-2 border-[#29253F] bg-[#FBF8F0] p-5 soft-shadow sm:p-8">
            <div className="mb-7 flex items-center justify-between">
              <div>
                <p className="font-mono text-[10px] font-medium uppercase tracking-[.16em] text-[#8D8795]">01 / choose your lane</p>
                <h2 className="mt-1 font-display text-2xl font-bold tracking-[-.06em] text-[#29253F]">What are you making?</h2>
              </div>
              <div className="hidden -rotate-6 rounded-xl bg-[#FFE59A] px-3 py-2 text-[10px] font-bold text-[#29253F] sm:block">Keep it weird.</div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {formatOptions.map((option) => (
                <ChoiceCard key={option.id} option={option} selected={format === option.id} onSelect={() => setFormat(option.id)} />
              ))}
            </div>

            <div className="my-8 h-px bg-[#E7E1D8]" />

            <div className="mb-5">
              <p className="font-mono text-[10px] font-medium uppercase tracking-[.16em] text-[#8D8795]">02 / choose your rhythm</p>
              <h2 className="mt-1 font-display text-2xl font-bold tracking-[-.06em] text-[#29253F]">How often do you show up?</h2>
            </div>
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {cadenceOptions.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  onClick={() => setCadence(option.value)}
                  aria-pressed={cadence === option.value}
                  data-testid={`button-cadence-${option.value}`}
                  className={`focus-ring rounded-2xl border-2 px-2 py-3 text-center transition-transform active:translate-y-1 sm:py-4 ${
                    cadence === option.value
                      ? 'border-[#29253F] bg-[#29253F] text-[#FBF8F0] shadow-[3px_4px_0_#FF956F]'
                      : 'border-[#D7D2DF] bg-[#FBF8F0] text-[#29253F] hover:-translate-y-0.5 hover:border-[#7667D8]'
                  }`}
                >
                  <span className="block font-display text-xl font-bold tracking-[-.05em]">{option.label}</span>
                  <span className={`mt-0.5 block text-[10px] font-semibold ${cadence === option.value ? 'text-[#DCD8FF]' : 'text-[#8D8795]'}`}>{option.note}</span>
                </button>
              ))}
            </div>

            <div className="mt-8 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-2 text-xs font-medium text-[#817B8B]">
                <CircleHelp size={15} className="text-[#7667D8]" />
                No account. No data saved. Just a good estimate.
              </p>
              <button
                type="button"
                onClick={runSimulation}
                disabled={!canSimulate}
                data-testid="button-simulate"
                className={`focus-ring group flex min-h-14 items-center justify-center gap-3 rounded-2xl border-2 border-[#29253F] px-6 font-display text-base font-bold transition-all ${
                  canSimulate
                    ? 'bg-[#FF956F] text-[#29253F] shadow-[4px_5px_0_#29253F] hover:-translate-y-1 hover:bg-[#FFA989] active:translate-y-1 active:shadow-[1px_2px_0_#29253F]'
                    : 'bg-[#E7E1D8] text-[#9A94A0] shadow-none'
                }`}
              >
                {isSimulating ? <><LoaderCircle size={20} className="animate-spin" /> Reading the room...</> : <><Play size={18} fill="currentColor" /> Simulate my share</>}
                {!isSimulating && <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />}
              </button>
            </div>
          </div>
        </section>

        {isSimulating && (
          <section className="animate-pop relative z-10 mx-auto flex max-w-[900px] flex-col items-center justify-center py-20 text-center sm:py-24" data-testid="simulation-loading">
            <BlobMascot loading />
            <p className="mt-5 font-display text-xl font-bold tracking-[-.04em] text-[#29253F]">Teaching the blob about your audience.</p>
            <p className="mt-2 text-xs font-medium text-[#817B8B]">Crunching a few friendly assumptions.</p>
            <div className="mt-6 h-1.5 w-44 overflow-hidden rounded-full bg-[#DDD7EC]">
              <div className="h-full w-1/2 animate-[shimmer_1.15s_ease-in-out_infinite] rounded-full bg-[#7667D8]" />
            </div>
          </section>
        )}

        {result && !isSimulating && (
          <section id="results" className="relative z-10 mx-auto max-w-[900px] scroll-mt-5 pt-14" data-testid="results-section">
            <div className="animate-rise mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] font-medium uppercase tracking-[.16em] text-[#8D8795]">03 / the forecast</p>
                <h2 className="mt-1 font-display text-4xl font-bold leading-none tracking-[-.07em] text-[#29253F] sm:text-5xl">Look at that pulse.</h2>
              </div>
              <div className="hidden items-center gap-2 rounded-full bg-[#A9F0D0] px-3 py-2 text-[10px] font-bold uppercase tracking-[.12em] text-[#29253F] sm:flex">
                <Repeat2 size={13} /> Fresh run
              </div>
            </div>
            <div className="grid items-start gap-6 lg:grid-cols-[1fr_1.04fr]">
              <div className="animate-rise stagger-2 rounded-[1.75rem] border-2 border-[#D7D2DF] bg-[#FBF8F0] p-5 sm:p-6">
                <div className="flex items-center justify-between border-b border-[#E7E1D8] pb-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[.1em] text-[#8D8795]">Estimated weekly outcome</p>
                    <p className="mt-1 font-display text-lg font-bold tracking-[-.04em] text-[#29253F]">{selectedFormat?.name ?? formatMeta[result.format].label} at {result.cadence}x</p>
                  </div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DED9FF] text-[#7667D8]"><Layers3 size={19} /></span>
                </div>
                <div className="pt-1">
                  <StatRow icon={Megaphone} label="Engagement" value={formatCompact(result.engagement)} detail="likes, replies + saves" delay="stagger-3" />
                  <StatRow icon={ArrowDown} label="Impressions" value={formatCompact(result.impressions)} detail="potential timeline views" delay="stagger-4" />
                  <StatRow icon={Share2} label="Platform ad revenue" value={formatMoney(result.adRevenue)} detail="before creator share" delay="stagger-5" />
                </div>
                <div className="mt-5 rounded-2xl bg-[#F2ECDF] p-4 text-xs font-medium leading-5 text-[#716D7D]">
                  <span className="font-bold text-[#29253F]">The friendly fine print:</span> this is a directional estimate, not a promise. We factor in format, frequency, and typical ad yield.
                </div>
                 <p className="mt-4 flex items-start gap-2 text-xs font-semibold leading-5 text-[#7667D8]" data-testid="comparison-line">
                   <Sparkles size={15} className="mt-0.5 shrink-0" />
                   On a traditional platform, creators typically get 0–20%. On Dlicom, you got 45%.
                 </p>
              </div>

              <div className="animate-rise stagger-3">
                <ShareCard result={result} creatorValue={creatorValue} />
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <button type="button" onClick={copyShareText} data-testid="button-copy-share" className="focus-ring flex min-h-12 items-center justify-center gap-2 rounded-2xl border-2 border-[#29253F] bg-[#FBF8F0] text-xs font-bold text-[#29253F] transition-transform hover:-translate-y-0.5 active:translate-y-1">
                    {copied ? <Check size={16} /> : <Clipboard size={16} />}
                    {copied ? 'Copied' : 'Copy result'}
                  </button>
                  <button type="button" onClick={downloadCard} data-testid="button-download-card" className="focus-ring flex min-h-12 items-center justify-center gap-2 rounded-2xl border-2 border-[#29253F] bg-[#29253F] text-xs font-bold text-[#FBF8F0] transition-transform hover:-translate-y-0.5 active:translate-y-1">
                    <Download size={16} /> Download card
                  </button>
                </div>
                <button type="button" onClick={runSimulation} disabled={!canSimulate} data-testid="button-rerun" className="focus-ring mt-3 flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-xs font-bold text-[#7667D8] transition-colors hover:bg-[#EDE9FF] disabled:opacity-40">
                  <Repeat2 size={15} /> Run it again
                </button>
              </div>
            </div>
          </section>
        )}

        <footer className="relative z-10 mx-auto mt-20 flex max-w-[900px] flex-col gap-4 border-t border-[#D7D2DF] pt-5 text-[11px] font-medium text-[#8D8795] sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#FF956F]" /> Built for people who post before they overthink.</p>
          <p className="flex items-center gap-2"><Send size={13} /> Share the pulse with a friend</p>
        </footer>
      </div>
    </main>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={AppShell} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;