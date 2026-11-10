import React, { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Button,
  Card,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "../../../shared/components/ui";
import { Area, AreaChart, XAxis, YAxis } from "recharts";
import { cn } from "../../../shared/utils/cn";
import {
  IconPlaneTilt,
  IconBuildingSkyscraper,
  IconReceiptTax,
  IconCar,
} from "@tabler/icons-react";
import {
  ArrowUpRight,
  Asterisk,
  CheckCircle2,
  ChevronRight,
  Plane,
  Building2,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  col: number;
  row: number;
}

interface CustomXAxisTickProps {
  x?: number;
  y?: number;
  payload?: {
    value?: string;
  };
}

const GOVERNANCE_ACTORS: readonly TeamMember[] = [
  {
    id: "arun",
    name: "Arun Kumar",
    role: "Lead Systems Architect (Employee)",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
    col: 2,
    row: 0,
  },
  {
    id: "marcus",
    name: "Marcus Brody",
    role: "Director of Engineering (Manager)",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
    col: 0,
    row: 1,
  },
  {
    id: "alexander",
    name: "Alexander Vance",
    role: "VP Finance & Operations (Admin)",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
    col: 2,
    row: 1,
  },
  {
    id: "meera",
    name: "Meera Patel",
    role: "Staff Product Manager (Employee)",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
    col: 1,
    row: 2,
  },
];

const MATRIX_CELLS = Array.from({ length: 9 }, (_, idx) => {
  const row = Math.floor(idx / 3);
  const col = idx % 3;
  return GOVERNANCE_ACTORS.find((m) => m.row === row && m.col === col) ?? null;
});

const TRAVEL_PARTNERS = [
  { name: "Air India", icon: IconPlaneTilt },
  { name: "Taj Hotels", icon: IconBuildingSkyscraper },
  { name: "Uber Corp", icon: IconCar },
  { name: "GST Portal", icon: IconReceiptTax },
] as const;

const ACTIVE_REQUESTS = [
  {
    id: "sin-summit",
    title: "Client Summit - Singapore",
    date: "Nov 20 - 24, 2026",
    amount: "₹1,02,500.00",
    status: "Pending Manager Review",
    statusClass: "border-[#8A582B]/40 bg-[#8A582B]/10 text-[#8A582B]",
    icon: Plane,
  },
  {
    id: "tokyo-exchange",
    title: "APAC Tech Exchange - Tokyo",
    date: "Nov 12 - 16, 2026",
    amount: "₹68,400.00",
    status: "Settled & Paid",
    statusClass: "border-[#2E7D32]/40 bg-[#2E7D32]/10 text-[#2E7D32]",
    icon: Building2,
  },
  {
    id: "blr-workshop",
    title: "Platform Workshop - Bangalore",
    date: "Dec 05 - 07, 2026",
    amount: "₹24,000.00",
    status: "Pending Admin Clearance",
    statusClass: "border-[#B9770E]/40 bg-[#B9770E]/10 text-[#B9770E]",
    icon: TrendingUp,
  },
] as const;

const BUDGET_CHART_DATA = [
  { month: "Aug", value: 4.2 },
  { month: "Sep", value: 7.8 },
  { month: "Oct", value: 10.5 },
  { month: "Nov", value: 14.2 },
  { month: "Dec", value: 18.0 },
];

const chartConfig = {
  value: {
    label: "Utilized Spend (₹ Lakhs)",
    color: "#8A582B",
  },
} satisfies ChartConfig;

const GOVERNANCE_ACTIONS = [
  { id: "employee-portal", label: "Employee Self-Service", href: "/signin", icon: ArrowUpRight },
  { id: "manager-queue", label: "Tier 1 Manager Queue", href: "/signin", icon: ArrowUpRight },
  { id: "admin-governance", label: "Tier 2 Admin Clearance", href: "/signin", icon: ArrowUpRight },
  { id: "budget-guard", label: "₹35L Headroom Guard", href: "#budgets", icon: Asterisk },
  { id: "reverification", label: "100% Manager Re-Verification", href: "#governance", icon: null },
] as const;

function TeamMatrix() {
  return (
    <div className="relative flex w-full flex-col items-center justify-center py-2">
      <div className="relative mx-auto grid w-full max-w-[245px] grid-cols-3 gap-2.5 sm:max-w-[260px]">
        {MATRIX_CELLS.map((member, idx) =>
          member ? (
            <div
              key={member.id}
              title={`${member.name} — ${member.role}`}
              className="relative aspect-square w-full overflow-hidden rounded-2xl border-2 border-white bg-[#FAF8F5] shadow-sm ring-1 ring-[#E8DFD3]"
            >
              <img
                src={member.avatar}
                alt={member.name}
                className="h-full w-full object-cover object-center"
              />
            </div>
          ) : (
            <div
              key={`empty-cell-${idx}`}
              className="aspect-square w-full rounded-2xl border border-[#E8DFD3] bg-[#FAF8F5]/80 shadow-[inset_0_1px_2px_rgba(43,35,29,0.03)]"
            />
          )
        )}
      </div>
    </div>
  );
}

function CustomXAxisTick({ x, y, payload }: CustomXAxisTickProps) {
  if (!payload || x === undefined || y === undefined) return null;
  const isNov = payload.value === "Nov";
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={12}
        textAnchor="middle"
        className={cn(
          "text-[11px]",
          isNov ? "fill-[#2B231D] font-bold" : "fill-[#756F68]"
        )}
      >
        {payload.value}
      </text>
    </g>
  );
}

interface GovernanceDeskButtonProps {
  copied: boolean;
  onClick: () => void;
  className?: string;
}

function GovernanceDeskButton({
  copied,
  onClick,
  className,
}: GovernanceDeskButtonProps) {
  return (
    <Button
      type="button"
      onClick={onClick}
      aria-live="polite"
      className={cn(
        "group/btn relative inline-flex items-center gap-2 rounded-xl bg-[#2B231D] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#3D332B] cursor-pointer",
        className
      )}
    >
      {copied ? (
        <CheckCircle2 className="size-4 shrink-0 text-[#FAF8F5]" />
      ) : (
        <ShieldCheck className="size-4 shrink-0 text-[#8A582B]" />
      )}
      <span className="text-white">
        {copied ? "Navigating to Hierarchy..." : "Explore Review Hierarchy"}
      </span>
    </Button>
  );
}

export const EditorialPreview: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gradientId = useId();

  const handleAction = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setCopied(true);
    timeoutRef.current = setTimeout(() => {
      setCopied(false);
      const el = document.getElementById("workflows");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <section id="workflows" className="relative overflow-hidden bg-[#F7F4EE] py-16 text-[#2B231D] transition-colors duration-300 sm:py-24">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="mb-10 sm:mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-[#2B231D] sm:text-4xl lg:text-5xl">
            Two-Tier Travel Governance & Real-Time Fiscal Control
          </h2>
          <p className="mt-3 text-base sm:text-lg text-[#756F68] max-w-3xl leading-relaxed">
            Eliminate reimbursement friction with upfront itemized quote approvals, post-trip tax proof settlement, and continuous ₹35,00,000 departmental budget headroom enforcement.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-stretch">
          {/* Left Column: Governance Hierarchy & Actors */}
          <div className="col-span-1 flex flex-col lg:col-span-4">
            <Card className="group relative flex h-full flex-1 flex-col justify-between overflow-hidden rounded-2xl border border-[#E8DFD3] bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md sm:p-6">
              <div className="flex h-full flex-col justify-between gap-5 md:flex-row md:items-center md:gap-8 lg:flex-col lg:justify-between lg:gap-0">
                <div className="relative z-10 flex flex-1 flex-col justify-between space-y-4 md:space-y-6 lg:space-y-2">
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold tracking-tight text-[#2B231D] sm:text-xl">
                      Two-Tier Review Chain
                    </h3>
                    <p className="text-sm leading-relaxed text-[#756F68]">
                      Line managers audit travel necessity and quotation proofs first, then executive admins authorize ₹35L budget headroom or disbursement.
                    </p>
                  </div>

                  <div className="hidden pt-2 md:block lg:hidden">
                    <GovernanceDeskButton copied={copied} onClick={handleAction} />
                  </div>
                </div>

                <div className="relative z-10 my-auto flex shrink-0 items-center justify-center py-2 md:w-[260px] lg:w-full">
                  <TeamMatrix />
                </div>

                <div className="relative z-10 pt-2 md:hidden lg:block">
                  <GovernanceDeskButton copied={copied} onClick={handleAction} />
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Active Claims, Ecosystem, Budget Headroom & Quick Actions */}
          <div className="col-span-1 flex flex-col justify-between gap-4 lg:col-span-8">
            <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
              {/* Active Claims & Requests */}
              <Card className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[#E8DFD3] bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md sm:p-5">
                <div className="space-y-1">
                  <h3 className="text-base font-bold tracking-tight text-[#2B231D] sm:text-lg">
                    Live Travel Requests & Claims
                  </h3>
                  <p className="text-xs leading-relaxed text-[#756F68] sm:text-[13px]">
                    Continuous tracking of pre-trip quotations and post-trip tax invoices.
                  </p>
                </div>

                <div className="my-auto flex w-full flex-col gap-2.5 sm:gap-4 pt-3">
                  {ACTIVE_REQUESTS.map(({ id, title, date, amount, status, statusClass, icon: Icon }) => (
                    <div
                      key={id}
                      className="group/item flex flex-col gap-3 rounded-xl border border-[#E8DFD3] bg-[#FAF8F5] p-3 transition-all duration-200 hover:border-[#8A582B]/60 hover:bg-white sm:gap-3.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-[#E8DFD3] bg-white text-[#2B231D] shadow-xs">
                            <Icon className="size-4 shrink-0 text-[#8A582B]" />
                          </div>
                          <div>
                            <h4 className="text-xs sm:text-sm font-bold tracking-tight text-[#2B231D]">
                              {title}
                            </h4>
                            <p className="text-[11px] font-normal text-[#756F68]">
                              {date}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="size-4 text-[#756F68]/60 transition-transform duration-200 group-hover/item:translate-x-0.5" />
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-[#E8DFD3]/60">
                        <span className="font-mono tabular-nums text-xs sm:text-sm font-bold text-[#2B231D]">
                          {amount}
                        </span>
                        <span className={cn("rounded-md border px-2 py-0.5 text-[10.5px] font-semibold", statusClass)}>
                          {status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Ecosystem & Budget Utilization Chart */}
              <div className="flex h-full flex-col gap-4">
                {/* Corporate Travel Ecosystem */}
                <Card className="group relative mb-0 flex h-[76px] shrink-0 items-center justify-between overflow-hidden rounded-2xl border border-[#E8DFD3] bg-white p-2 shadow-sm transition-all duration-300 hover:shadow-md sm:p-2.5">
                  <div className="grid h-full w-full grid-cols-4 gap-2">
                    {TRAVEL_PARTNERS.map(({ name, icon: Icon }) => (
                      <div
                        key={name}
                        className="group/partner flex flex-col items-center justify-center gap-1 rounded-xl border border-[#E8DFD3] bg-[#FAF8F5] px-2 py-1.5 transition-all duration-200 hover:border-[#8A582B]/50 hover:bg-white"
                      >
                        <Icon
                          className="size-4 shrink-0 text-[#2B231D] transition-transform duration-300 group-hover/partner:scale-110"
                          stroke={1.8}
                        />
                        <span className="text-[10px] font-bold tracking-tight whitespace-nowrap text-[#2B231D]">
                          {name}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Headroom & Spend Chart */}
                <Card id="budgets" className="group relative mb-0 flex flex-1 flex-col justify-between overflow-hidden rounded-2xl border border-[#E8DFD3] bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md sm:p-5">
                  <div className="relative z-10 flex items-start justify-between">
                    <div>
                      <div className="font-mono tabular-nums text-2xl sm:text-3xl font-extrabold tracking-tight text-[#2B231D]">
                        ₹35,00,000.00
                      </div>
                      <p className="mt-1 text-xs font-semibold tracking-tight text-[#756F68]">
                        Engineering Q4 Budget Allocation (₹20.80L Headroom)
                      </p>
                    </div>
                  </div>

                  <div className="relative z-10 mt-2 flex flex-1 flex-col justify-end">
                    <div className="pr-1 text-right text-[10px] font-mono tabular-nums text-[#756F68]">
                      (in ₹ Lakhs)
                    </div>

                    <ChartContainer
                      config={chartConfig}
                      className="h-[165px] w-full flex-1 text-[#2B231D]"
                    >
                      <AreaChart
                        accessibilityLayer
                        data={BUDGET_CHART_DATA}
                        margin={{ top: 10, right: 8, left: 8, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id={gradientId}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#8A582B"
                              stopOpacity={0.28}
                            />
                            <stop
                              offset="60%"
                              stopColor="#8A582B"
                              stopOpacity={0.06}
                            />
                            <stop
                              offset="100%"
                              stopColor="#8A582B"
                              stopOpacity={0.0}
                            />
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="month"
                          interval={0}
                          tickLine={false}
                          axisLine={false}
                          tickMargin={6}
                          tick={<CustomXAxisTick />}
                        />
                        <YAxis
                          orientation="right"
                          domain={[0, 20]}
                          ticks={[0, 5, 10, 15, 20]}
                          tickFormatter={(v) => (v === 0 ? "0" : `₹${v}L`)}
                          tickLine={false}
                          axisLine={false}
                          tickMargin={4}
                          width={32}
                          className="fill-[#756F68] text-[10px] font-mono tabular-nums"
                        />
                        <ChartTooltip
                          cursor={{
                            stroke: "#8A582B",
                            strokeWidth: 1,
                            strokeDasharray: "3 3",
                          }}
                          content={
                            <ChartTooltipContent
                              indicator="line"
                              formatter={(value) => `₹${value} Lakhs`}
                            />
                          }
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#8A582B"
                          strokeWidth={2.5}
                          fill={`url(#${gradientId})`}
                          isAnimationActive={false}
                        />
                      </AreaChart>
                    </ChartContainer>
                  </div>
                </Card>
              </div>
            </div>

            {/* Financial Actions Footer Card */}
            <Card className="group relative flex min-h-16 shrink-0 items-center justify-between overflow-hidden rounded-2xl border border-[#E8DFD3] bg-white p-3.5 shadow-sm transition-all duration-300 hover:shadow-md sm:h-18 sm:px-6">
              <div className="flex h-full w-full flex-wrap items-center justify-between gap-3 sm:flex-nowrap sm:gap-4">
                {GOVERNANCE_ACTIONS.map(({ id, label, href, icon: ActionIcon }) => (
                  <Link
                    key={id}
                    to={href}
                    className="group flex h-auto cursor-pointer items-center gap-1.5 text-xs font-bold tracking-tight text-[#2B231D] transition-colors hover:text-[#8A582B]"
                  >
                    <span>{label}</span>
                    {ActionIcon && (
                      <span className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                        <ActionIcon className="size-3.5 stroke-[2] text-[#8A582B]" />
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export const Bento5 = EditorialPreview;
export default EditorialPreview;
