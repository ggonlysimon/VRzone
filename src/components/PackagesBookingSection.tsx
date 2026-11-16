import {useMemo, useState} from 'react';
import type {User} from 'firebase/auth';
import {signInWithPopup, signOut} from 'firebase/auth';
import {
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  Calendar,
  Check,
  Clock,
  LogIn,
  LogOut,
  Shield,
  Sparkles,
  Trash2,
  UserPlus,
} from 'lucide-react';
import {
  OPERATING_HOURS,
  PRIVATE_ACCOUNT_FEE_PKR,
  ROBLOX_PAYMENT_ACCOUNTS,
  SNACK_MENU,
  VR_PACKAGES,
} from '../data/vrzoneData';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from '../firebase';
import type {
  GameFocus,
  MemberAccount,
  PackageId,
  PaymentMethod,
  ScheduleClosure,
  SessionBooking,
} from '../types';

interface PackagesBookingSectionProps {
  user: User | null;
  authReady: boolean;
  isAdmin: boolean;
  memberAccount: MemberAccount | null;
  bookings: SessionBooking[];
  allBookings: SessionBooking[];
  allMembers: MemberAccount[];
  closures: ScheduleClosure[];
  selectedRobuxAccount: string;
}

function getTodayPktDate(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function getSlotsForDate(dateStr: string): {
  scheduleName: string;
  hoursLabel: string;
  slots: string[];
} {
  if (!dateStr) {
    return {
      scheduleName: 'Monday – Thursday',
      hoursLabel: OPERATING_HOURS[0].hours,
      slots: OPERATING_HOURS[0].slots,
    };
  }
  const [y, m, d] = dateStr.split('-').map(Number);
  const utcDay = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0=Sun, 5=Fri, 6=Sat
  const isFriToSun = utcDay === 0 || utcDay === 5 || utcDay === 6;
  const block = isFriToSun ? OPERATING_HOURS[1] : OPERATING_HOURS[0];
  return {
    scheduleName: block.days,
    hoursLabel: block.hours,
    slots: block.slots,
  };
}

export default function PackagesBookingSection({
  user,
  authReady,
  isAdmin,
  memberAccount,
  bookings,
  allBookings,
  allMembers,
  closures,
  selectedRobuxAccount,
}: PackagesBookingSectionProps) {
  const [selectedPackageId, setSelectedPackageId] = useState<PackageId>('1h');
  const [gameFocus, setGameFocus] = useState<GameFocus>('Excessive VR');
  const [sessionDate, setSessionDate] = useState<string>(getTodayPktDate);
  const [timeSlot, setTimeSlot] = useState<string>(() => {
    const info = getSlotsForDate(getTodayPktDate());
    return info.slots[0];
  });
  const [selectedSnackIds, setSelectedSnackIds] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(() =>
    selectedRobuxAccount === 'Abdd332211'
      ? 'Robux (Abdd332211)'
      : 'PKR Cash'
  );
  const [notes, setNotes] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Private Account Form (PKR 1,300)
  const [memberName, setMemberName] = useState('');
  const [memberPhone, setMemberPhone] = useState('');
  const [memberRoblox, setMemberRoblox] = useState('');
  const [memberPaymentPref, setMemberPaymentPref] = useState<'PKR' | 'Robux'>(
    'PKR'
  );
  const [editingMember, setEditingMember] = useState(false);

  // Admin Closure Form
  const [closureDate, setClosureDate] = useState(getTodayPktDate);
  const [closureReason, setClosureReason] = useState('Private off-day');

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittingMember, setSubmittingMember] = useState(false);
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  const selectedPackage = useMemo(
    () => VR_PACKAGES.find((p) => p.id === selectedPackageId) || VR_PACKAGES[2],
    [selectedPackageId]
  );

  const dateSchedule = useMemo(
    () => getSlotsForDate(sessionDate),
    [sessionDate]
  );

  const closureOnDate = useMemo(
    () => closures.find((c) => c.dateStr === sessionDate),
    [closures, sessionDate]
  );

  const isProPackage = selectedPackageId === 'pro5h';

  const snacksTotalPkr = useMemo(() => {
    if (isProPackage) {
      // Pro includes 5 free snacks
      const extraIds = selectedSnackIds.slice(5);
      return extraIds.reduce((sum, id) => {
        const found = SNACK_MENU.find((s) => s.id === id);
        return sum + (found ? found.defaultPricePkr : 0);
      }, 0);
    }
    return selectedSnackIds.reduce((sum, id) => {
      const found = SNACK_MENU.find((s) => s.id === id);
      return sum + (found ? found.defaultPricePkr : 0);
    }, 0);
  }, [isProPackage, selectedSnackIds]);

  const handleSignIn = async () => {
    setErrorMessage(null);
    setAuthLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Unable to sign in with Google.'
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    setErrorMessage(null);
    setStatusMessage(null);
    await signOut(auth);
  };

  const handleDateChange = (nextDate: string) => {
    setSessionDate(nextDate);
    const info = getSlotsForDate(nextDate);
    if (!info.slots.includes(timeSlot)) {
      setTimeSlot(info.slots[0]);
    }
  };

  const toggleSnack = (id: string) => {
    setSelectedSnackIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((s) => s !== id);
      }
      if (prev.length >= 10) {
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setErrorMessage(null);
    setStatusMessage(null);

    const resolvedName = (
      memberName ||
      memberAccount?.displayName ||
      user.displayName ||
      ''
    )
      .trim()
      .slice(0, 80);
    const resolvedPhone = (memberPhone || memberAccount?.phone || '')
      .trim()
      .slice(0, 25);
    const resolvedRoblox = (
      memberRoblox ||
      memberAccount?.robloxUsername ||
      ''
    )
      .trim()
      .slice(0, 40);

    if (resolvedName.length < 1) {
      setErrorMessage('Please enter your name for the private account.');
      return;
    }
    if (resolvedPhone.length < 7) {
      setErrorMessage('Please enter a valid contact phone or WhatsApp number.');
      return;
    }

    setSubmittingMember(true);
    const path = `members/${user.uid}`;
    try {
      if (!memberAccount) {
        await setDoc(doc(db, 'members', user.uid), {
          uid: user.uid,
          displayName: resolvedName,
          email: (user.email || 'member@vrzone.pk').slice(0, 120),
          phone: resolvedPhone,
          robloxUsername: resolvedRoblox,
          membershipStatus: 'pending_payment',
          membershipFeePkr: PRIVATE_ACCOUNT_FEE_PKR,
          preferredPayment: memberPaymentPref,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setStatusMessage(
          `Private account registered (PKR ${PRIVATE_ACCOUNT_FEE_PKR.toLocaleString()} fee due at visit or via Robux).`
        );
      } else {
        await updateDoc(doc(db, 'members', user.uid), {
          displayName: resolvedName,
          phone: resolvedPhone,
          robloxUsername: resolvedRoblox,
          preferredPayment: memberPaymentPref,
          updatedAt: serverTimestamp(),
        });
        setEditingMember(false);
        setStatusMessage('Private account details updated.');
      }
    } catch (err) {
      handleFirestoreError(
        err,
        memberAccount ? OperationType.UPDATE : OperationType.CREATE,
        path
      );
    } finally {
      setSubmittingMember(false);
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMessage('Please sign in with Google first to submit a booking.');
      return;
    }
    if (closureOnDate) {
      setErrorMessage(
        `VRzone is marked closed on ${sessionDate} (${closureOnDate.reason}). Please choose another date.`
      );
      return;
    }

    const resolvedName = (
      customerName ||
      memberAccount?.displayName ||
      user.displayName ||
      ''
    )
      .trim()
      .slice(0, 80);
    const resolvedPhone = (customerPhone || memberAccount?.phone || '')
      .trim()
      .slice(0, 25);

    if (resolvedName.length < 1) {
      setErrorMessage('Please enter your name.');
      return;
    }
    if (resolvedPhone.length < 7) {
      setErrorMessage('Please enter a valid phone / WhatsApp number (min 7 characters).');
      return;
    }

    setErrorMessage(null);
    setStatusMessage(null);
    setSubmittingBooking(true);

    const bookingId = `vrz_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const snackLabels = selectedSnackIds.map((id) => {
      const found = SNACK_MENU.find((s) => s.id === id);
      return (found ? found.name : id).slice(0, 60);
    });

    const path = `bookings/${bookingId}`;
    try {
      await setDoc(doc(db, 'bookings', bookingId), {
        bookingId,
        userId: user.uid,
        customerName: resolvedName,
        customerPhone: resolvedPhone,
        packageId: selectedPackage.id,
        packageLabel: `${selectedPackage.duration} — ${selectedPackage.title}`.slice(0, 60),
        packagePricePkr: selectedPackage.pricePkr ?? 0,
        gameFocus,
        sessionDate,
        timeSlot,
        snacks: snackLabels,
        snacksTotalPkr,
        paymentMethod,
        status: 'pending',
        notes: notes.trim().slice(0, 300),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setNotes('');
      setSelectedSnackIds([]);
      setStatusMessage(
        `Booking ${bookingId} submitted for ${sessionDate} at ${timeSlot}.`
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    } finally {
      setSubmittingBooking(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    setErrorMessage(null);
    const path = `bookings/${bookingId}`;
    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        status: 'cancelled',
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const handleAdminBookingStatus = async (
    bookingId: string,
    status: 'confirmed' | 'cancelled'
  ) => {
    const path = `bookings/${bookingId}`;
    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        status,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const handleAdminActivateMember = async (uid: string) => {
    const path = `members/${uid}`;
    try {
      await updateDoc(doc(db, 'members', uid), {
        membershipStatus: 'active',
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const handleAddClosure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isAdmin) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(closureDate)) return;
    const path = `schedule_closures/${closureDate}`;
    try {
      await setDoc(doc(db, 'schedule_closures', closureDate), {
        dateStr: closureDate,
        reason: (closureReason.trim() || 'Closed').slice(0, 140),
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      });
      setStatusMessage(`Marked ${closureDate} as closed.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const handleRemoveClosure = async (dateStr: string) => {
    const path = `schedule_closures/${dateStr}`;
    try {
      await deleteDoc(doc(db, 'schedule_closures', dateStr));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  return (
    <section className="mx-auto w-full max-w-6xl px-6 pb-20 pt-10 sm:px-10">
      <div className="flex flex-col justify-between gap-6 border-b border-black/10 pb-8 md:flex-row md:items-end">
        <div className="max-w-2xl">
          <p className="text-[13px] font-medium text-blue-600">
            Packages &amp; Private Account Booking
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl [text-wrap:balance]">
            Pick your session length, register your account, and book House 113.
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {!authReady ? (
            <span className="text-xs text-gray-500">Checking account...</span>
          ) : user ? (
            <div className="flex items-center gap-3 rounded-xl border border-black/10 bg-white px-4 py-2">
              <div className="text-right">
                <p className="text-xs font-semibold text-gray-900">
                  {user.displayName || user.email}
                </p>
                <p className="text-[11px] text-gray-500">
                  {isAdmin ? 'Studio Operator' : 'Signed-in Player'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-black/15 px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-gray-900 hover:text-gray-900 whitespace-nowrap"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign out</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSignIn}
              disabled={authLoading}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-gray-900 px-5 py-2.5 text-xs font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-60 whitespace-nowrap"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>
                {authLoading ? 'Signing in...' : 'Sign in with Google to Book'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Pricing Tier Strip */}
      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {VR_PACKAGES.map((pkg) => {
          const isSelected = selectedPackageId === pkg.id;
          return (
            <button
              key={pkg.id}
              type="button"
              onClick={() => setSelectedPackageId(pkg.id)}
              className={`flex cursor-pointer flex-col justify-between rounded-2xl border p-5 text-left transition-all duration-200 ${
                isSelected
                  ? 'border-blue-600 bg-white ring-1 ring-blue-600'
                  : 'border-black/10 bg-white hover:border-black/30'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-gray-500">
                    {pkg.duration}
                  </span>
                  {pkg.featured && (
                    <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                  )}
                </div>
                <h2 className="mt-2 text-lg font-semibold text-gray-900">
                  {pkg.title}
                </h2>
                <p className="mt-2 font-mono text-xl font-semibold tabular-nums text-gray-900">
                  {pkg.priceDisplay}
                </p>
                <p className="mt-0.5 text-[11px] text-gray-500">
                  {pkg.robuxEstimate}
                </p>
                <p className="mt-3 text-xs leading-relaxed text-gray-600">
                  {pkg.summary}
                </p>
              </div>

              <ul className="mt-4 space-y-1.5 border-t border-black/5 pt-3">
                {pkg.includes.map((line) => (
                  <li
                    key={line}
                    className="flex items-start gap-1.5 text-[11.5px] text-gray-600"
                  >
                    <Check className="mt-0.5 h-3 w-3 shrink-0 text-blue-600" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      {statusMessage && (
        <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          {statusMessage}
        </div>
      )}
      {errorMessage && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {errorMessage}
        </div>
      )}

      {/* Main Booking + Private Account Grid */}
      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left: Session Booking Form */}
        <form
          onSubmit={handleCreateBooking}
          className="rounded-2xl border border-black/10 bg-white p-6 sm:p-8 lg:col-span-7"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/10 pb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Book a VR Session
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                House 113, Street 16, Bella Road, G-10/1 · Islamabad only
              </p>
            </div>
            <span className="font-mono text-sm font-semibold tabular-nums text-blue-600">
              {selectedPackage.duration} ({selectedPackage.priceDisplay})
            </span>
          </div>

          {!user && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/10 bg-[#f8f8f6] px-4 py-3 text-xs text-gray-700">
              <span>Sign in with Google to save your booking and view status.</span>
              <button
                type="button"
                onClick={handleSignIn}
                className="cursor-pointer font-semibold text-blue-600 hover:text-blue-700 whitespace-nowrap"
              >
                Sign in now →
              </button>
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-gray-700">
                Player Name
              </label>
              <input
                type="text"
                required
                maxLength={80}
                placeholder={
                  memberAccount?.displayName || user?.displayName || 'Your name'
                }
                value={
                  customerName ||
                  memberAccount?.displayName ||
                  user?.displayName ||
                  ''
                }
                onChange={(e) => setCustomerName(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-black/15 bg-[#f8f8f6] px-3.5 py-2.5 text-sm text-gray-900 focus:border-blue-600 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700">
                Phone / WhatsApp Number
              </label>
              <input
                type="tel"
                required
                maxLength={25}
                placeholder="03XX-XXXXXXX"
                value={customerPhone || memberAccount?.phone || ''}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-black/15 bg-[#f8f8f6] px-3.5 py-2.5 text-sm text-gray-900 focus:border-blue-600 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700">
                Game / Experience Focus
              </label>
              <select
                value={gameFocus}
                onChange={(e) => setGameFocus(e.target.value as GameFocus)}
                className="mt-1.5 w-full rounded-xl border border-black/15 bg-[#f8f8f6] px-3.5 py-2.5 text-sm text-gray-900 focus:border-blue-600 focus:bg-white focus:outline-none"
              >
                <option value="Excessive VR">Excessive VR Gaming</option>
                <option value="Roblox VR">Roblox VR &amp; Rivals</option>
                <option value="Minecraft VR">Minecraft VR</option>
                <option value="PS5 Waitlist (Dec)">
                  PS5 Template Waitlist (December)
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(e.target.value as PaymentMethod)
                }
                className="mt-1.5 w-full rounded-xl border border-black/15 bg-[#f8f8f6] px-3.5 py-2.5 text-sm text-gray-900 focus:border-blue-600 focus:bg-white focus:outline-none"
              >
                <option value="PKR Cash">PKR Cash at House 113</option>
                <option value="Robux (Ibirahim60)">
                  Robux Payment → Ibirahim60 (iBBy_PrO67)
                </option>
                <option value="Robux (Abdd332211)">
                  Robux Payment → Abdd332211 (Rivalspro67)
                </option>
              </select>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                <Calendar className="h-3.5 w-3.5 text-gray-500" />
                <span>Session Date</span>
              </label>
              <input
                type="date"
                required
                min={getTodayPktDate()}
                value={sessionDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-black/15 bg-[#f8f8f6] px-3.5 py-2.5 font-mono text-sm tabular-nums text-gray-900 focus:border-blue-600 focus:bg-white focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-gray-500">
                {dateSchedule.scheduleName}: {dateSchedule.hoursLabel}
              </p>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                <Clock className="h-3.5 w-3.5 text-gray-500" />
                <span>Arrival Time Slot</span>
              </label>
              <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-black/15 bg-[#f8f8f6] px-3.5 py-2.5 font-mono text-sm tabular-nums text-gray-900 focus:border-blue-600 focus:bg-white focus:outline-none"
              >
                {dateSchedule.slots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {closureOnDate && (
            <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-950">
              VRzone is marked closed on <strong>{sessionDate}</strong>:{' '}
              {closureOnDate.reason}. Please select a different day.
            </div>
          )}

          {/* Snacks Selector */}
          <div className="mt-6 border-t border-black/10 pt-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-gray-900">
                Snacks &amp; Drinks Add-On
              </span>
              <span className="text-xs text-gray-500">
                {isProPackage
                  ? 'Pro 5-Hour includes 5 free snacks'
                  : 'Custom PKR add-on pricing'}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {SNACK_MENU.map((snack) => {
                const checked = selectedSnackIds.includes(snack.id);
                return (
                  <button
                    key={snack.id}
                    type="button"
                    onClick={() => toggleSnack(snack.id)}
                    className={`flex cursor-pointer items-center justify-between rounded-xl border px-3.5 py-2.5 text-left text-xs transition-colors ${
                      checked
                        ? 'border-blue-600 bg-blue-50/50 text-gray-900'
                        : 'border-black/10 bg-[#f8f8f6] text-gray-700 hover:border-black/25'
                    }`}
                  >
                    <span className="font-medium">{snack.name}</span>
                    <span className="font-mono tabular-nums text-gray-500">
                      {isProPackage && selectedSnackIds.indexOf(snack.id) > -1 && selectedSnackIds.indexOf(snack.id) < 5
                        ? 'Free (Pro)'
                        : `PKR ${snack.defaultPricePkr}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5">
            <label className="block text-xs font-medium text-gray-700">
              Notes or Custom Snack Request (optional)
            </label>
            <input
              type="text"
              maxLength={300}
              placeholder="e.g., Roblox Rivals setup, custom snack request, arriving with a friend"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-black/15 bg-[#f8f8f6] px-3.5 py-2.5 text-sm text-gray-900 focus:border-blue-600 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-black/10 pt-5">
            <div>
              <p className="text-xs text-gray-500">Estimated Total</p>
              <p className="font-mono text-lg font-semibold tabular-nums text-gray-900">
                {selectedPackage.pricePkr !== null
                  ? `PKR ${(selectedPackage.pricePkr + snacksTotalPkr).toLocaleString()}`
                  : `Pro Custom Rate${snacksTotalPkr > 0 ? ` + PKR ${snacksTotalPkr}` : ' (5 Free Snacks Included)'}`}
              </p>
            </div>

            <button
              type="submit"
              disabled={!user || submittingBooking || Boolean(closureOnDate)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap"
            >
              <span>
                {submittingBooking ? 'Saving booking...' : 'Confirm Booking Request'}
              </span>
            </button>
          </div>
        </form>

        {/* Right: PKR 1,300 Private Account Registration + Robux Quick Info */}
        <div className="space-y-6 lg:col-span-5">
          <div className="rounded-2xl border border-black/10 bg-white p-6">
            <div className="flex items-start justify-between gap-3 border-b border-black/10 pb-4">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-blue-600">
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Private Member Account</span>
                </div>
                <h2 className="mt-1 text-xl font-semibold text-gray-900">
                  PKR {PRIVATE_ACCOUNT_FEE_PKR.toLocaleString()} Registration
                </h2>
              </div>
              {memberAccount && (
                <span className="text-xs font-semibold text-blue-600">
                  {memberAccount.membershipStatus === 'active'
                    ? 'Active Member'
                    : 'Pending Payment'}
                </span>
              )}
            </div>

            {!user ? (
              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  Register a private VRzone account for{' '}
                  <strong className="tabular-nums text-gray-900">
                    PKR {PRIVATE_ACCOUNT_FEE_PKR.toLocaleString()}
                  </strong>{' '}
                  to save your gamer profile, phone contact, and Robux / PKR
                  preferences.
                </p>
                <button
                  type="button"
                  onClick={handleSignIn}
                  className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full border border-blue-500 px-5 py-2 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-600 hover:text-white"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span>Sign in with Google to Register</span>
                </button>
              </div>
            ) : memberAccount && !editingMember ? (
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">Gamer Name</span>
                  <span className="font-medium text-gray-900">
                    {memberAccount.displayName}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">Phone</span>
                  <span className="font-mono text-xs tabular-nums text-gray-900">
                    {memberAccount.phone}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">Roblox ID</span>
                  <span className="text-gray-900">
                    {memberAccount.robloxUsername || 'Not linked'}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">Registration Fee</span>
                  <span className="font-mono text-xs tabular-nums text-gray-900">
                    PKR {memberAccount.membershipFeePkr.toLocaleString()} (
                    {memberAccount.membershipStatus === 'active'
                      ? 'Paid'
                      : 'Pay at House 113 / Robux'}
                    )
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMemberName(memberAccount.displayName);
                    setMemberPhone(memberAccount.phone);
                    setMemberRoblox(memberAccount.robloxUsername || '');
                    setMemberPaymentPref(memberAccount.preferredPayment);
                    setEditingMember(true);
                  }}
                  className="mt-2 cursor-pointer text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  Edit private account details
                </button>
              </div>
            ) : (
              <form onSubmit={handleSaveMember} className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Gamer / Display Name
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={80}
                    placeholder={user.displayName || 'Your gamer name'}
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-black/15 bg-[#f8f8f6] px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Phone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={25}
                    placeholder="03XX-XXXXXXX"
                    value={memberPhone}
                    onChange={(e) => setMemberPhone(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-black/15 bg-[#f8f8f6] px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Your Roblox Username (optional)
                  </label>
                  <input
                    type="text"
                    maxLength={40}
                    placeholder="e.g. player_username"
                    value={memberRoblox}
                    onChange={(e) => setMemberRoblox(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-black/15 bg-[#f8f8f6] px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Preferred Payment Currency
                  </label>
                  <select
                    value={memberPaymentPref}
                    onChange={(e) =>
                      setMemberPaymentPref(e.target.value as 'PKR' | 'Robux')
                    }
                    className="mt-1 w-full rounded-xl border border-black/15 bg-[#f8f8f6] px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:bg-white focus:outline-none"
                  >
                    <option value="PKR">PKR (Cash in Islamabad)</option>
                    <option value="Robux">Robux Currency</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={submittingMember}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
                  >
                    {submittingMember
                      ? 'Saving...'
                      : memberAccount
                        ? 'Save Changes'
                        : `Register Account (PKR ${PRIVATE_ACCOUNT_FEE_PKR.toLocaleString()})`}
                  </button>
                  {editingMember && (
                    <button
                      type="button"
                      onClick={() => setEditingMember(false)}
                      className="cursor-pointer text-xs text-gray-600 hover:text-gray-900"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>

          <div className="rounded-2xl border border-black/10 bg-[#EDEDED] p-6">
            <h3 className="text-sm font-semibold text-gray-900">
              Robux Payment Targets
            </h3>
            <p className="mt-1 text-xs text-gray-600">
              Paying in Robux? Send to the verified studio Roblox ID you prefer:
            </p>
            <div className="mt-3 space-y-2">
              {ROBLOX_PAYMENT_ACCOUNTS.map((acct) => (
                <div
                  key={acct.userId}
                  className="flex items-center justify-between rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-xs"
                >
                  <div>
                    <span className="font-semibold text-gray-900">
                      @{acct.username}
                    </span>{' '}
                    <span className="text-gray-500">({acct.displayName})</span>
                  </div>
                  <span className="font-mono tabular-nums text-gray-500">
                    #{acct.userId}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* User's Bookings List */}
      {user && (
        <div className="mt-12 rounded-2xl border border-black/10 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">My Bookings</h2>
          {bookings.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">
              No bookings yet. Use the booking form above to reserve your VR
              time slot.
            </p>
          ) : (
            <div className="mt-4 divide-y divide-black/10">
              {bookings.map((b) => (
                <div
                  key={b.bookingId}
                  className="flex flex-wrap items-center justify-between gap-4 py-4 text-sm"
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      {b.packageLabel} · {b.gameFocus}
                    </p>
                    <p className="mt-0.5 font-mono text-xs tabular-nums text-gray-500">
                      {b.sessionDate} at {b.timeSlot} · {b.paymentMethod}
                    </p>
                    {b.snacks.length > 0 && (
                      <p className="mt-1 text-xs text-gray-600">
                        Snacks: {b.snacks.join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold capitalize text-gray-800">
                      {b.status}
                    </span>
                    {b.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => handleCancelBooking(b.bookingId)}
                        className="cursor-pointer rounded-full border border-black/15 px-3 py-1 text-xs font-medium text-gray-700 hover:border-red-600 hover:text-red-600"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Owner Controls Panel (Studio Admin only) */}
      {isAdmin && (
        <div className="mt-10 rounded-2xl border border-blue-200 bg-white p-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600">
            <Shield className="h-4 w-4" />
            <span>Studio Operator Controls (Islamabad House 113)</span>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Manage Closed Days */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Mark Closed Days
              </h3>
              <form onSubmit={handleAddClosure} className="mt-3 flex flex-wrap gap-2">
                <input
                  type="date"
                  required
                  value={closureDate}
                  onChange={(e) => setClosureDate(e.target.value)}
                  className="rounded-xl border border-black/15 bg-[#f8f8f6] px-3 py-2 font-mono text-xs tabular-nums"
                />
                <input
                  type="text"
                  required
                  maxLength={140}
                  placeholder="Reason (e.g., Family event / maintenance)"
                  value={closureReason}
                  onChange={(e) => setClosureReason(e.target.value)}
                  className="flex-1 rounded-xl border border-black/15 bg-[#f8f8f6] px-3 py-2 text-xs"
                />
                <button
                  type="submit"
                  className="cursor-pointer rounded-full bg-gray-900 px-4 py-2 text-xs font-medium text-white hover:bg-gray-800 whitespace-nowrap"
                >
                  Mark Closed
                </button>
              </form>

              {closures.length > 0 && (
                <div className="mt-3 space-y-2">
                  {closures.map((c) => (
                    <div
                      key={c.dateStr}
                      className="flex items-center justify-between rounded-lg border border-black/10 px-3 py-2 text-xs"
                    >
                      <span>
                        <strong className="font-mono tabular-nums">
                          {c.dateStr}
                        </strong>{' '}
                        — {c.reason}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveClosure(c.dateStr)}
                        className="cursor-pointer text-gray-500 hover:text-red-600"
                        aria-label={`Reopen ${c.dateStr}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Manage Memberships & Incoming Bookings */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                All Studio Bookings ({allBookings.length}) &amp; Members (
                {allMembers.length})
              </h3>
              <div className="mt-3 max-h-60 space-y-2 overflow-y-auto">
                {allBookings.map((b) => (
                  <div
                    key={b.bookingId}
                    className="flex items-center justify-between gap-3 rounded-lg border border-black/10 px-3 py-2 text-xs"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">
                        {b.customerName} ({b.customerPhone})
                      </p>
                      <p className="text-gray-500">
                        {b.sessionDate} {b.timeSlot} · {b.packageLabel} ·{' '}
                        {b.status}
                      </p>
                    </div>
                    {b.status === 'pending' && (
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            handleAdminBookingStatus(b.bookingId, 'confirmed')
                          }
                          className="cursor-pointer rounded-full bg-blue-600 px-3 py-1 text-[11px] font-medium text-white"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleAdminBookingStatus(b.bookingId, 'cancelled')
                          }
                          className="cursor-pointer rounded-full border border-black/15 px-3 py-1 text-[11px] font-medium text-gray-700"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {allMembers
                  .filter((m) => m.membershipStatus === 'pending_payment')
                  .map((m) => (
                    <div
                      key={m.uid}
                      className="flex items-center justify-between gap-3 rounded-lg border border-black/10 bg-[#f8f8f6] px-3 py-2 text-xs"
                    >
                      <span>
                        Member: <strong>{m.displayName}</strong> ({m.phone}) —
                        PKR 1,300 pending
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAdminActivateMember(m.uid)}
                        className="cursor-pointer rounded-full bg-gray-900 px-3 py-1 text-[11px] font-medium text-white"
                      >
                        Activate
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
