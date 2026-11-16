/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {useEffect, useState} from 'react';
import type {User} from 'firebase/auth';
import {onAuthStateChanged} from 'firebase/auth';
import {collection, doc, onSnapshot, query, where} from 'firebase/firestore';
import AboutSection from './components/AboutSection';
import OffersSection from './components/OffersSection';
import PackagesBookingSection from './components/PackagesBookingSection';
import ReachoutSection from './components/ReachoutSection';
import {HERO_VIDEO_URL, STUDIO_ADMIN_EMAIL} from './data/vrzoneData';
import {
  auth,
  db,
  handleFirestoreError,
  OperationType,
} from './firebase';
import type {
  MemberAccount,
  PageView,
  ScheduleClosure,
  SessionBooking,
} from './types';

const NAV_LINKS: {label: string; view: PageView; hash: string}[] = [
  {label: 'About Me', view: 'about-me', hash: '#about-me'},
  {label: 'What I Offer', view: 'what-i-offer', hash: '#what-i-offer'},
  {label: 'Packages', view: 'packages', hash: '#packages'},
  {label: 'Reachout', view: 'reachout', hash: '#reachout'},
];

function viewFromHash(hash: string): PageView {
  const match = NAV_LINKS.find((item) => item.hash === hash);
  return match ? match.view : 'home';
}

function Logo() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 256 256"
      fill="none"
      aria-label="VRzone logo"
    >
      <path
        fill="rgb(84, 84, 84)"
        d="M 160 88 L 194 34 L 216 0 L 256 0 L 256 40 L 221.5 93.5 L 200 128 L 256 128 L 256 256 L 96 256 L 96 168 L 64.246 220 L 40 256 L 0 256 L 0 216 L 34 162 L 56 128 L 0 128 L 0 0 L 160 0 Z"
      />
    </svg>
  );
}

export default function App() {
  const [activeView, setActiveView] = useState<PageView>(() =>
    viewFromHash(window.location.hash)
  );
  const [selectedRobuxAccount, setSelectedRobuxAccount] =
    useState<string>('Ibirahim60');
  const [mapsQuotaExceeded, setMapsQuotaExceeded] = useState(false);

  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [memberAccount, setMemberAccount] = useState<MemberAccount | null>(
    null
  );
  const [bookings, setBookings] = useState<SessionBooking[]>([]);
  const [allBookings, setAllBookings] = useState<SessionBooking[]>([]);
  const [allMembers, setAllMembers] = useState<MemberAccount[]>([]);
  const [closures, setClosures] = useState<ScheduleClosure[]>([]);

  const isAdmin = Boolean(
    user && user.email === STUDIO_ADMIN_EMAIL && user.emailVerified
  );

  const navigate = (view: PageView) => {
    setActiveView(view);
    const targetHash =
      view === 'home'
        ? '#top'
        : NAV_LINKS.find((l) => l.view === view)?.hash || '#top';
    window.history.replaceState(null, '', targetHash);
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  useEffect(() => {
    const onHashChange = () => {
      setActiveView(viewFromHash(window.location.hash));
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    const onQuotaExceeded = () => setMapsQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', onQuotaExceeded);
    return () =>
      window.removeEventListener('gmp-quota-exceeded', onQuotaExceeded);
  }, []);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
      if (!currentUser) {
        setMemberAccount(null);
        setBookings([]);
        setAllBookings([]);
        setAllMembers([]);
      }
    });
    return () => unsubAuth();
  }, []);

  // Public studio closures listener
  useEffect(() => {
    const closuresPath = 'schedule_closures';
    const unsub = onSnapshot(
      collection(db, closuresPath),
      (snapshot) => {
        const items: ScheduleClosure[] = [];
        snapshot.forEach((d) => {
          items.push(d.data() as ScheduleClosure);
        });
        items.sort((a, b) => a.dateStr.localeCompare(b.dateStr));
        setClosures(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, closuresPath);
      }
    );
    return () => unsub();
  }, []);

  // Authenticated user's private member account & bookings
  useEffect(() => {
    if (!authReady || !user) return;

    const memberPath = `members/${user.uid}`;
    const unsubMember = onSnapshot(
      doc(db, 'members', user.uid),
      (snap) => {
        setMemberAccount(
          snap.exists() ? (snap.data() as MemberAccount) : null
        );
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, memberPath);
      }
    );

    const bookingsPath = 'bookings';
    const userBookingsQuery = query(
      collection(db, bookingsPath),
      where('userId', '==', user.uid)
    );
    const unsubBookings = onSnapshot(
      userBookingsQuery,
      (snapshot) => {
        const list: SessionBooking[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as SessionBooking);
        });
        list.sort((a, b) => b.sessionDate.localeCompare(a.sessionDate));
        setBookings(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, bookingsPath);
      }
    );

    return () => {
      unsubMember();
      unsubBookings();
    };
  }, [authReady, user]);

  // Admin listeners for studio operator
  useEffect(() => {
    if (!authReady || !isAdmin) return;

    const unsubAllBookings = onSnapshot(
      collection(db, 'bookings'),
      (snapshot) => {
        const list: SessionBooking[] = [];
        snapshot.forEach((d) => list.push(d.data() as SessionBooking));
        list.sort((a, b) => b.sessionDate.localeCompare(a.sessionDate));
        setAllBookings(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'bookings');
      }
    );

    const unsubAllMembers = onSnapshot(
      collection(db, 'members'),
      (snapshot) => {
        const list: MemberAccount[] = [];
        snapshot.forEach((d) => list.push(d.data() as MemberAccount));
        setAllMembers(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'members');
      }
    );

    return () => {
      unsubAllBookings();
      unsubAllMembers();
    };
  }, [authReady, isAdmin]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#f0f0ee]">
      {mapsQuotaExceeded && (
        <div className="sticky top-0 z-50 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-center text-xs text-amber-900 shadow-sm md:text-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-amber-950 underline hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* 3D Hand Background Video appears ONLY on the main Home page */}
      {activeView === 'home' && (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={HERO_VIDEO_URL}
          autoPlay
          muted
          loop
          playsInline
        />
      )}

      <div className="relative z-10 flex min-h-screen flex-col">
        <nav className="flex items-center justify-center gap-2 px-4 pt-4 sm:gap-3 sm:px-8 sm:pt-6">
          <button
            type="button"
            onClick={() => navigate('home')}
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full transition-transform duration-200 hover:scale-105 sm:h-11 sm:w-11"
            style={{backgroundColor: '#EDEDED'}}
            aria-label="VRzone Home"
            title="VRzone Home"
          >
            <Logo />
          </button>

          <div
            className="flex items-center gap-4 overflow-x-auto rounded-xl px-4 py-2.5 sm:gap-10 sm:px-8 sm:py-3"
            style={{backgroundColor: '#EDEDED'}}
          >
            {NAV_LINKS.map(({label, view, hash}) => {
              const isActive = activeView === view;
              return (
                <a
                  key={label}
                  href={hash}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(view);
                  }}
                  className={`whitespace-nowrap shrink-0 text-[12px] font-medium transition-colors duration-200 sm:text-[14px] ${
                    isActive
                      ? 'text-blue-600'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  {label}
                </a>
              );
            })}
          </div>
        </nav>

        {activeView === 'home' && (
          <main className="flex flex-1 items-end px-6 pb-10 sm:px-12 sm:pb-16 md:px-20 lg:px-28 lg:pb-20">
            <div className="max-w-xs">
              <button
                type="button"
                onClick={() => navigate('reachout')}
                className="group mb-3 inline-flex cursor-pointer items-center gap-1.5 text-left text-[11.5px] font-medium text-blue-500 transition-colors hover:text-blue-600"
              >
                <span>Sector G-10/1, Islamabad · House 113</span>
                <span className="inline-block transition-transform duration-200 group-hover:translate-x-0.5">
                  →
                </span>
              </button>

              <h1 className="mb-3 text-[1.5rem] font-medium leading-[1.15] tracking-tight text-gray-900 sm:text-[1.75rem]">
                VRzone — Excessive VR gaming made for players who go all in.
              </h1>

              <p className="mb-3 text-[13px] font-normal text-gray-500">
                Private house studio · Street 16, Bella Road.
              </p>

              <button
                type="button"
                onClick={() => navigate('packages')}
                className="group inline-flex cursor-pointer items-center gap-2 rounded-full border border-blue-400 px-5 py-2.5 text-[13px] font-medium text-blue-500 transition-all duration-200 hover:border-blue-500 hover:bg-blue-500 hover:text-white"
              >
                <span>Book a VR session</span>
                <span className="inline-block transition-transform duration-200 group-hover:translate-x-0.5">
                  →
                </span>
              </button>
            </div>
          </main>
        )}

        {activeView === 'about-me' && (
          <main className="flex-1">
            <AboutSection closures={closures} onNavigate={navigate} />
          </main>
        )}

        {activeView === 'what-i-offer' && (
          <main className="flex-1">
            <OffersSection
              selectedRobuxAccount={selectedRobuxAccount}
              onSelectRobuxAccount={setSelectedRobuxAccount}
              onNavigate={navigate}
            />
          </main>
        )}

        {activeView === 'packages' && (
          <main className="flex-1">
            <PackagesBookingSection
              user={user}
              authReady={authReady}
              isAdmin={isAdmin}
              memberAccount={memberAccount}
              bookings={bookings}
              allBookings={allBookings}
              allMembers={allMembers}
              closures={closures}
              selectedRobuxAccount={selectedRobuxAccount}
            />
          </main>
        )}

        {activeView === 'reachout' && (
          <main className="flex-1">
            <ReachoutSection />
          </main>
        )}

        {activeView !== 'home' && (
          <footer className="border-t border-black/10 bg-[#f0f0ee] px-6 py-8 sm:px-10">
            <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 text-xs text-gray-500 sm:flex-row sm:items-center">
              <p>
                VRzone · Private House VR Studio · House 113, Street 16, Bella
                Road, Sector G-10/1, Islamabad, Pakistan
              </p>
              <div className="flex items-center gap-5">
                {NAV_LINKS.map(({label, view}) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => navigate(view)}
                    className="cursor-pointer font-medium text-gray-600 hover:text-gray-900 whitespace-nowrap"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}
