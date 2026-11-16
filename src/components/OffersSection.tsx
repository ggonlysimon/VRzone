import {useState} from 'react';
import {
  ArrowRight,
  Check,
  Coffee,
  ExternalLink,
  Gamepad2,
  Headset,
  UserCheck,
} from 'lucide-react';
import {
  GENERATED_IMAGES,
  ROBLOX_PAYMENT_ACCOUNTS,
  SNACK_MENU,
} from '../data/vrzoneData';
import type {PageView} from '../types';

interface OffersSectionProps {
  selectedRobuxAccount: string;
  onSelectRobuxAccount: (username: string) => void;
  onNavigate: (view: PageView) => void;
}

export default function OffersSection({
  selectedRobuxAccount,
  onSelectRobuxAccount,
  onNavigate,
}: OffersSectionProps) {
  const [ps5ImgError, setPs5ImgError] = useState(false);
  const [snackImgError, setSnackImgError] = useState(false);
  const [snackPrices, setSnackPrices] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const item of SNACK_MENU) {
      initial[item.id] = item.defaultPricePkr;
    }
    return initial;
  });
  const [selectedSnacks, setSelectedSnacks] = useState<string[]>(['fries', 'soda']);

  const toggleSnackPreview = (id: string) => {
    setSelectedSnacks((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const snackTotal = selectedSnacks.reduce(
    (sum, id) => sum + (snackPrices[id] || 0),
    0
  );

  return (
    <section className="mx-auto w-full max-w-6xl px-6 pb-20 pt-10 sm:px-10">
      <div className="max-w-2xl">
        <p className="text-[13px] font-medium text-blue-600">
          What I Offer · Templates, Gaming &amp; Snacks
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl [text-wrap:balance]">
          Excessive VR gaming, popular templates, and snacks at your seat.
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-gray-600">
          Every session at VRzone includes full VR hardware setup, curated game
          templates, custom snack options, and support for PKR or Robux
          payments.
        </p>
      </div>

      {/* 01. Gaming Templates */}
      <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="rounded-2xl border border-black/10 bg-white p-7 lg:col-span-7">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
            <Headset className="h-4 w-4 text-blue-600" />
            <span>01. Active VR Templates</span>
          </div>

          <div className="mt-6 space-y-6 divide-y divide-black/10">
            <div className="pt-1">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Excessive VR Gaming
                </h2>
                <span className="text-xs font-medium text-blue-600">
                  Available Now
                </span>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
                High-immersion room-scale VR sessions designed for long,
                uninterrupted gameplay in a private residential setup.
              </p>
            </div>

            <div className="pt-5">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Roblox VR &amp; Rivals
                </h2>
                <span className="text-xs font-medium text-blue-600">
                  PKR or Robux
                </span>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
                Play Roblox experiences and competitive Rivals matches in VR.
                Session and snack payments can also be settled in Robux.
              </p>
            </div>

            <div className="pt-5">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Minecraft VR
                </h2>
                <span className="text-xs font-medium text-blue-600">
                  Available Now
                </span>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
                Build, explore, and survive inside Minecraft VR with full motion
                controls and custom session durations up to 5 hours.
              </p>
            </div>
          </div>
        </div>

        {/* PS5 December Template Card */}
        <div className="flex flex-col justify-between overflow-hidden rounded-2xl border border-black/10 bg-white lg:col-span-5">
          <div className="h-56 w-full overflow-hidden bg-[#EDEDED]">
            {!ps5ImgError ? (
              <img
                src={GENERATED_IMAGES.ps5Preview}
                alt="PlayStation 5 console and DualSense controller coming to VRzone in December"
                referrerPolicy="no-referrer"
                onError={() => setPs5ImgError(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center bg-[#EDEDED] p-6 text-center">
                <Gamepad2 className="h-8 w-8 text-gray-600" />
                <p className="mt-2 text-xs font-medium text-gray-700">
                  PS5 Console Setup
                </p>
              </div>
            )}
          </div>
          <div className="flex flex-1 flex-col justify-between p-6">
            <div>
              <p className="text-xs font-medium text-blue-600">
                02. Coming December
              </p>
              <h2 className="mt-1.5 text-xl font-semibold text-gray-900">
                PS5 Gaming Template
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                A dedicated PlayStation 5 template is scheduled to be added
                around December. You can already reserve December waitlist
                interest when booking your VRzone session.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('packages')}
              className="mt-5 inline-flex w-fit cursor-pointer items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              <span>Join PS5 December waitlist</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 03. Roblox Accounts Verified Lookup */}
      <div className="mt-12 rounded-2xl border border-black/10 bg-white p-7">
        <div className="flex flex-col justify-between gap-4 border-b border-black/10 pb-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-medium text-blue-600">
              03. Verified Roblox IDs · Robux Currency Payment
            </p>
            <h2 className="mt-1.5 text-2xl font-semibold tracking-tight text-gray-900">
              Roblox Account Lookup: Ibirahim60 &amp; Abdd332211
            </h2>
            <p className="mt-1.5 text-sm text-gray-600">
              Both Roblox accounts were verified directly via Roblox. Select
              which account you are referring to as your active Robux payment
              recipient.
            </p>
          </div>
          <span className="text-xs font-medium text-gray-500 whitespace-nowrap">
            Active choice:{' '}
            <strong className="text-gray-900">{selectedRobuxAccount}</strong>
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          {ROBLOX_PAYMENT_ACCOUNTS.map((acct) => {
            const isSelected = selectedRobuxAccount === acct.username;
            return (
              <div
                key={acct.userId}
                className={`flex flex-col justify-between rounded-xl border p-5 transition-colors ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/40'
                    : 'border-black/10 bg-[#f8f8f6]'
                }`}
              >
                <div className="flex items-start gap-4">
                  <img
                    src={acct.avatarUrl}
                    alt={`${acct.username} Roblox avatar`}
                    referrerPolicy="no-referrer"
                    className="h-14 w-14 shrink-0 rounded-xl border border-black/10 bg-white object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-base font-semibold text-gray-900">
                        @{acct.username}
                      </h3>
                      <span className="font-mono text-xs tabular-nums text-gray-500">
                        ID: {acct.userId}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs font-medium text-gray-700">
                      Display Name: {acct.displayName} · Joined {acct.created}
                    </p>
                    <p className="mt-2 text-xs italic text-gray-600">
                      &ldquo;{acct.bio}&rdquo;
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3 border-t border-black/10 pt-4">
                  <a
                    href={acct.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900"
                  >
                    <span>View Roblox profile</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <button
                    type="button"
                    onClick={() => onSelectRobuxAccount(acct.username)}
                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'border border-black/15 bg-white text-gray-800 hover:border-gray-900'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <UserCheck className="h-3.5 w-3.5" />
                        <span>Selected for Robux</span>
                      </>
                    ) : (
                      <span>Use this ID for Robux</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 04. Custom Snacks & Pro 5 Free Snacks */}
      <div className="mt-12 grid grid-cols-1 items-stretch gap-8 rounded-2xl border border-black/10 bg-white p-7 lg:grid-cols-12">
        <div className="overflow-hidden rounded-xl border border-black/10 bg-[#EDEDED] lg:col-span-5">
          {!snackImgError ? (
            <img
              src={GENERATED_IMAGES.snackBar}
              alt="VRzone snack tray with fries, tortilla chips, chocolate bar, and chilled drinks"
              referrerPolicy="no-referrer"
              onError={() => setSnackImgError(true)}
              className="h-full min-h-[260px] w-full object-cover"
            />
          ) : (
            <div className="flex h-full min-h-[260px] flex-col items-center justify-center bg-[#EDEDED] p-6 text-center">
              <Coffee className="h-8 w-8 text-gray-600" />
              <p className="mt-2 text-xs font-medium text-gray-700">
                VRzone Custom Snack Menu
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col justify-between lg:col-span-7">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-medium text-blue-600">
                04. Snacks While You Play
              </p>
              <span className="text-xs font-medium text-gray-500">
                Pro 5-Hour Package includes 5 free snacks
              </span>
            </div>
            <h2 className="mt-1.5 text-2xl font-semibold tracking-tight text-gray-900">
              Custom-Priced Snack Add-Ons
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Order snacks to enjoy during your VR session. Snack rates are
              customizable — adjust prices below to preview your custom tray
              cost.
            </p>

            <div className="mt-5 space-y-2.5">
              {SNACK_MENU.map((item) => {
                const checked = selectedSnacks.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/10 px-4 py-2.5"
                  >
                    <button
                      type="button"
                      onClick={() => toggleSnackPreview(item.id)}
                      className="flex cursor-pointer items-center gap-3 text-left"
                    >
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded border text-xs ${
                          checked
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {checked && <Check className="h-3 w-3" />}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {item.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {item.category}
                      </span>
                    </button>

                    <label className="flex items-center gap-1.5 text-xs text-gray-500">
                      <span>PKR</span>
                      <input
                        type="number"
                        min={0}
                        max={5000}
                        step={10}
                        value={snackPrices[item.id] ?? item.defaultPricePkr}
                        onChange={(e) =>
                          setSnackPrices((prev) => ({
                            ...prev,
                            [item.id]: Math.max(0, Number(e.target.value) || 0),
                          }))
                        }
                        className="w-20 rounded-lg border border-black/15 bg-[#f8f8f6] px-2 py-1 text-right font-mono text-xs font-medium tabular-nums text-gray-900 focus:border-blue-600 focus:outline-none"
                      />
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-black/10 pt-4">
            <div className="text-sm text-gray-700">
              Preview Snack Add-On Total:{' '}
              <span className="font-mono font-semibold tabular-nums text-gray-900">
                PKR {snackTotal.toLocaleString()}
              </span>{' '}
              <span className="text-xs text-gray-500">
                (or PKR 0 with Pro 5-Hour up to 5 items)
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('packages')}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-700 whitespace-nowrap"
            >
              <span>Book session &amp; snacks</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
