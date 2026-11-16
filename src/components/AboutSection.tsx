import {useMemo, useState} from 'react';
import {ArrowRight, Clock, Home, MapPin, ShieldCheck} from 'lucide-react';
import {
  GENERATED_IMAGES,
  OPERATING_HOURS,
  PRIVATE_ACCOUNT_FEE_PKR,
  VRZONE_LOCATION,
} from '../data/vrzoneData';
import type {PageView, ScheduleClosure} from '../types';

interface AboutSectionProps {
  closures: ScheduleClosure[];
  onNavigate: (view: PageView) => void;
}

function getIslamabadScheduleStatus(closures: ScheduleClosure[]) {
  const now = new Date();
  const pktParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);

  const lookup: Record<string, string> = {};
  for (const part of pktParts) {
    lookup[part.type] = part.value;
  }

  const todayStr = `${lookup.year}-${lookup.month}-${lookup.day}`;
  const weekday = lookup.weekday || 'Mon';
  const hour = Number(lookup.hour || 0);
  const minute = Number(lookup.minute || 0);
  const currentMins = hour * 60 + minute;

  const closureToday = closures.find((c) => c.dateStr === todayStr);
  if (closureToday) {
    return {
      isOpen: false,
      label: `Closed today (${closureToday.reason})`,
      todayHours: 'Closed',
    };
  }

  const isWeekendBlock = weekday === 'Fri' || weekday === 'Sat' || weekday === 'Sun';
  const openMins = isWeekendBlock ? 14 * 60 : 15 * 60;
  const closeMins = isWeekendBlock ? 20 * 60 : 19 * 60;
  const todayHours = isWeekendBlock ? '2:00 PM – 8:00 PM' : '3:00 PM – 7:00 PM';
  const isOpen = currentMins >= openMins && currentMins < closeMins;

  return {
    isOpen,
    label: isOpen
      ? `Open now in Islamabad (${todayHours} PKT)`
      : `Currently closed · Today's hours: ${todayHours} PKT`,
    todayHours,
  };
}

export default function AboutSection({closures, onNavigate}: AboutSectionProps) {
  const [imgFailed, setImgFailed] = useState(false);

  const scheduleStatus = useMemo(
    () => getIslamabadScheduleStatus(closures),
    [closures]
  );

  return (
    <section className="mx-auto w-full max-w-6xl px-6 pb-20 pt-10 sm:px-10">
      <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12">
        <div className="flex flex-col justify-between lg:col-span-6">
          <div>
            <p className="text-[13px] font-medium text-blue-600">
              About VRzone · Islamabad Only
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl [text-wrap:balance]">
              A private VR gaming house in Sector G-10/1, built for focused play.
            </h1>
            <p className="mt-5 text-[15px] leading-relaxed text-gray-600">
              VRzone is a private-house VR gaming studio operating exclusively in{' '}
              <span className="font-medium text-gray-900">
                Islamabad, Pakistan
              </span>
              . Located at{' '}
              <span className="font-medium text-gray-900">
                House 113, Street 16, Bella Road
              </span>{' '}
              right near the petrol pump, sessions take place in a calm,
              controlled home setup rather than a crowded mall arcade.
            </p>
            <p className="mt-4 text-[15px] leading-relaxed text-gray-600">
              Whether you are diving into excessive VR sessions, teaming up in
              Roblox and Minecraft VR, or grabbing snacks between rounds, every
              visit is scheduled around your own time block.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('packages')}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-[13px] font-medium text-white transition-colors duration-200 hover:bg-blue-700 whitespace-nowrap"
            >
              <span>View packages &amp; book</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('reachout')}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-black/15 bg-white px-5 py-2.5 text-[13px] font-medium text-gray-800 transition-colors duration-200 hover:border-gray-900 whitespace-nowrap"
            >
              <span>Find House 113 on Maps</span>
            </button>
          </div>
        </div>

        <div className="lg:col-span-6">
          <div className="h-full overflow-hidden rounded-2xl border border-black/10 bg-[#EDEDED]">
            {!imgFailed ? (
              <img
                src={GENERATED_IMAGES.vrLounge}
                alt="VRzone private home VR gaming room in Sector G-10/1 Islamabad"
                referrerPolicy="no-referrer"
                onError={() => setImgFailed(true)}
                className="h-full min-h-[280px] w-full object-cover"
              />
            ) : (
              <div className="flex h-full min-h-[280px] flex-col items-center justify-center bg-gradient-to-br from-[#e7e6e2] to-[#d9d8d3] p-8 text-center">
                <Home className="h-8 w-8 text-gray-600" />
                <p className="mt-3 text-sm font-medium text-gray-800">
                  VRzone Private House Studio · House 113
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Street 16, Bella Road, Sector G-10/1, Islamabad
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-6 border-t border-black/10 pt-10 md:grid-cols-3">
        <div className="rounded-2xl border border-black/10 bg-white p-6">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
            <Clock className="h-4 w-4 text-blue-600" />
            <span>Studio Timings</span>
          </div>
          <p className="mt-3 text-sm font-semibold text-gray-900">
            {scheduleStatus.label}
          </p>
          <div className="mt-4 space-y-2 border-t border-black/5 pt-4 text-sm">
            {OPERATING_HOURS.map((block) => (
              <div
                key={block.days}
                className="flex items-center justify-between gap-4"
              >
                <span className="text-gray-600">{block.days}</span>
                <span className="font-mono text-xs font-medium tabular-nums text-gray-900">
                  {block.hours}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-gray-500">
            Open during listed hours unless closed on select off-days.
          </p>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-6">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
            <MapPin className="h-4 w-4 text-blue-600" />
            <span>Islamabad Only</span>
          </div>
          <h2 className="mt-3 text-lg font-semibold text-gray-900">
            {VRZONE_LOCATION.house}, {VRZONE_LOCATION.street}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            {VRZONE_LOCATION.sector}, {VRZONE_LOCATION.city},{' '}
            {VRZONE_LOCATION.country} — {VRZONE_LOCATION.landmark}.
          </p>
          <p className="mt-4 text-xs text-gray-500">
            Operated inside a private residence exclusively for Islamabad
            players. Please book before arriving.
          </p>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-6">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
            <ShieldCheck className="h-4 w-4 text-blue-600" />
            <span>Private Account</span>
          </div>
          <h2 className="mt-3 text-lg font-semibold tabular-nums text-gray-900">
            PKR {PRIVATE_ACCOUNT_FEE_PKR.toLocaleString()} Registration
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Register a private VRzone member account to book time slots, save
            your Roblox or PKR payment preference, and track upcoming sessions.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('packages')}
            className="mt-4 inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            <span>Register in Packages &amp; Booking</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {closures.length > 0 && (
        <div className="mt-8 rounded-2xl border border-black/10 bg-[#EDEDED] p-6">
          <h3 className="text-sm font-semibold text-gray-900">
            Upcoming Closed Days
          </h3>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {closures.map((c) => (
              <div
                key={c.dateStr}
                className="flex items-center justify-between rounded-xl border border-black/10 bg-white px-4 py-3 text-sm"
              >
                <span className="font-mono text-xs font-medium tabular-nums text-gray-900">
                  {c.dateStr}
                </span>
                <span className="truncate pl-3 text-xs text-gray-600">
                  {c.reason}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
