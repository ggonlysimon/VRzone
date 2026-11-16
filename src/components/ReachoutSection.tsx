import {useEffect, useState} from 'react';
import {
  AdvancedMarker,
  APIProvider,
  APILoadingStatus,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  useAdvancedMarkerRef,
  useApiLoadingStatus,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import {Clock, ExternalLink, Fuel, MapPin, Navigation} from 'lucide-react';
import {OPERATING_HOURS, VRZONE_LOCATION} from '../data/vrzoneData';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

interface LatLngLiteral {
  lat: number;
  lng: number;
}

interface PlaceLocationLike {
  lat: () => number;
  lng: () => number;
}

interface PlaceItemLike {
  id: string;
  displayName?: string | null;
  formattedAddress?: string | null;
  location?: PlaceLocationLike | null;
  googleMapsURI?: string | null;
}

interface PlacesLibraryLike {
  Place: {
    searchByText: (req: {
      textQuery: string;
      fields: string[];
      language?: string;
      region?: string;
      maxResultCount?: number;
    }) => Promise<{places: PlaceItemLike[]}>;
    searchNearby: (req: {
      fields: string[];
      locationRestriction: {center: LatLngLiteral; radius: number};
      includedPrimaryTypes?: string[];
      maxResultCount?: number;
      language?: string;
      region?: string;
    }) => Promise<{places: PlaceItemLike[]}>;
  };
}

interface ResolvedPlace {
  id: string;
  name: string;
  address: string;
  location: LatLngLiteral;
  mapsUri?: string;
}

function PlaceMarkerWithInfo({
  place,
  isPrimary,
}: {
  place: ResolvedPlace;
  isPrimary?: boolean;
}) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [open, setOpen] = useState(Boolean(isPrimary));

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={place.location}
        title={place.name}
        onClick={() => setOpen(true)}
      >
        <Pin
          background={isPrimary ? '#2563eb' : '#111827'}
          borderColor={isPrimary ? '#1d4ed8' : '#030712'}
          glyphColor="#ffffff"
          scale={isPrimary ? 1.2 : 0.95}
        />
      </AdvancedMarker>

      {open && marker && (
        <InfoWindow
          anchor={marker}
          maxWidth={260}
          onCloseClick={() => setOpen(false)}
        >
          <div className="p-1 text-left">
            <p className="text-xs font-semibold text-gray-900">{place.name}</p>
            <p className="mt-1 text-[11px] leading-snug text-gray-600">
              {place.address}
            </p>
            {place.mapsUri && (
              <a
                href={place.mapsUri}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:underline"
              >
                <span>Open in Google Maps</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </InfoWindow>
      )}
    </>
  );
}

function IslamabadMapInner({
  onLandmarksResolved,
}: {
  onLandmarksResolved: (
    primary: ResolvedPlace | null,
    petrolPumps: ResolvedPlace[]
  ) => void;
}) {
  const placesLib = useMapsLibrary('places') as unknown as PlacesLibraryLike | null;
  const loadingStatus = useApiLoadingStatus();
  const [primaryPlace, setPrimaryPlace] = useState<ResolvedPlace | null>(null);
  const [nearbyStations, setNearbyStations] = useState<ResolvedPlace[]>([]);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(true);

  useEffect(() => {
    if (
      loadingStatus === APILoadingStatus.FAILED ||
      loadingStatus === APILoadingStatus.AUTH_FAILURE
    ) {
      setLookupError(
        'Google Maps could not initialize. Please verify your API key or quota.'
      );
      setIsSearching(false);
      return;
    }

    if (!placesLib) return;

    let cancelled = false;

    async function resolveSectorAndPetrolPumps() {
      try {
        const {places} = await placesLib!.Place.searchByText({
          textQuery: VRZONE_LOCATION.placeQuery,
          fields: [
            'id',
            'displayName',
            'formattedAddress',
            'location',
            'googleMapsURI',
          ],
          language: 'en',
          region: 'PK',
          maxResultCount: 3,
        });

        if (cancelled) return;

        const first = places.find((p) => Boolean(p.location));
        if (!first || !first.location) {
          setLookupError(
            'Could not resolve Street 16, Bella Road, G-10/1 via Places API.'
          );
          setIsSearching(false);
          return;
        }

        const primaryLoc: LatLngLiteral = {
          lat: first.location.lat(),
          lng: first.location.lng(),
        };

        const resolvedPrimary: ResolvedPlace = {
          id: first.id,
          name: 'VRzone — House 113 Area (Street 16, Bella Road)',
          address: first.formattedAddress || VRZONE_LOCATION.fullAddress,
          location: primaryLoc,
          mapsUri: first.googleMapsURI || undefined,
        };

        let stations: ResolvedPlace[] = [];
        try {
          const nearby = await placesLib!.Place.searchNearby({
            fields: [
              'id',
              'displayName',
              'formattedAddress',
              'location',
              'googleMapsURI',
            ],
            locationRestriction: {
              center: primaryLoc,
              radius: 1500,
            },
            includedPrimaryTypes: ['gas_station'],
            maxResultCount: 4,
            language: 'en',
            region: 'PK',
          });

          if (!cancelled && nearby.places.length > 0) {
            stations = nearby.places
              .filter((s) => Boolean(s.location))
              .map((s) => ({
                id: s.id,
                name: s.displayName || 'Nearby Petrol Station',
                address: s.formattedAddress || 'Sector G-10, Islamabad',
                location: {
                  lat: s.location!.lat(),
                  lng: s.location!.lng(),
                },
                mapsUri: s.googleMapsURI || undefined,
              }));
          }
        } catch {
          // Non-fatal: nearby petrol station lookup is supplementary
        }

        if (!cancelled) {
          setPrimaryPlace(resolvedPrimary);
          setNearbyStations(stations);
          onLandmarksResolved(resolvedPrimary, stations);
          setIsSearching(false);
        }
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429')) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        setLookupError('Unable to load live Google Maps location details.');
        setIsSearching(false);
      }
    }

    void resolveSectorAndPetrolPumps();

    return () => {
      cancelled = true;
    };
  }, [placesLib, loadingStatus, onLandmarksResolved]);

  if (lookupError) {
    return (
      <div className="flex h-[440px] w-full flex-col items-center justify-center rounded-2xl border border-black/10 bg-[#EDEDED] p-6 text-center">
        <MapPin className="h-8 w-8 text-gray-500" />
        <p className="mt-3 text-sm font-medium text-gray-800">{lookupError}</p>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            VRZONE_LOCATION.placeQuery
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700"
        >
          <span>Open Street 16, Bella Road in Google Maps</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    );
  }

  if (isSearching || !primaryPlace) {
    return (
      <div className="flex h-[440px] w-full flex-col items-center justify-center rounded-2xl border border-black/10 bg-[#EDEDED] p-6 text-center">
        <MapPin className="h-7 w-7 text-blue-600" />
        <p className="mt-3 text-sm font-medium text-gray-800">
          Locating Street 16, Bella Road, Sector G-10/1 via Google Maps...
        </p>
      </div>
    );
  }

  return (
    <div className="h-[440px] w-full overflow-hidden rounded-2xl border border-black/10 bg-[#EDEDED]">
      <GoogleMap
        defaultCenter={primaryPlace.location}
        defaultZoom={16}
        mapId="DEMO_MAP_ID"
        gestureHandling="greedy"
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        style={{width: '100%', height: '100%'}}
      >
        <PlaceMarkerWithInfo place={primaryPlace} isPrimary />
        {nearbyStations.map((station) => (
          <PlaceMarkerWithInfo key={station.id} place={station} />
        ))}
      </GoogleMap>
    </div>
  );
}

export default function ReachoutSection() {
  const [resolvedPrimary, setResolvedPrimary] = useState<ResolvedPlace | null>(
    null
  );
  const [petrolStations, setPetrolStations] = useState<ResolvedPlace[]>([]);

  const handleLandmarks = (
    primary: ResolvedPlace | null,
    stations: ResolvedPlace[]
  ) => {
    setResolvedPrimary(primary);
    setPetrolStations(stations);
  };

  const googleMapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    'Street 16 Bella Road Sector G-10/1 Islamabad Pakistan'
  )}`;

  return (
    <section className="mx-auto w-full max-w-6xl px-6 pb-20 pt-10 sm:px-10">
      <div className="max-w-2xl">
        <p className="text-[13px] font-medium text-blue-600">
          Reachout &amp; Location · Islamabad Only
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl [text-wrap:balance]">
          House 113, Street 16, Bella Road — Sector G-10/1.
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-gray-600">
          Located in a private residence near the petrol pump in Sector G-10/1,
          Islamabad, Pakistan. Use the live Google Map below to inspect Bella
          Road and nearby petrol stations before heading over.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8">
          {GOOGLE_MAPS_API_KEY ? (
            <APIProvider
              apiKey={GOOGLE_MAPS_API_KEY}
              language="en"
              region="PK"
            >
              <IslamabadMapInner onLandmarksResolved={handleLandmarks} />
            </APIProvider>
          ) : (
            <div className="flex h-[440px] w-full flex-col items-center justify-center rounded-2xl border border-black/10 bg-[#EDEDED] p-6 text-center">
              <MapPin className="h-8 w-8 text-gray-500" />
              <p className="mt-3 text-sm font-medium text-gray-800">
                Google Maps API key is not configured yet in this runtime.
              </p>
              <a
                href={googleMapsSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700"
              >
                <span>Open in Google Maps</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}

          {petrolStations.length > 0 && (
            <div className="mt-4 rounded-2xl border border-black/10 bg-white p-5">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-900">
                <Fuel className="h-4 w-4 text-blue-600" />
                <span>
                  Nearby Petrol Pump Landmarks (Live Google Maps Places Data)
                </span>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {petrolStations.map((station) => (
                  <div
                    key={station.id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-black/10 bg-[#f8f8f6] p-3 text-xs"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">
                        {station.name}
                      </p>
                      <p className="mt-0.5 text-gray-600">{station.address}</p>
                    </div>
                    {station.mapsUri && (
                      <a
                        href={station.mapsUri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-blue-600 hover:text-blue-700"
                        aria-label={`Open ${station.name} in Google Maps`}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-5 lg:col-span-4">
          <div className="rounded-2xl border border-black/10 bg-white p-6">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
              <MapPin className="h-4 w-4 text-blue-600" />
              <span>Exact Private House Address</span>
            </div>
            <p className="mt-3 text-base font-semibold text-gray-900">
              VRzone Private Studio
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
              {VRZONE_LOCATION.house}, {VRZONE_LOCATION.street}
              <br />
              {VRZONE_LOCATION.sector}, {VRZONE_LOCATION.city}
              <br />
              {VRZONE_LOCATION.country} ({VRZONE_LOCATION.landmark})
            </p>
            {resolvedPrimary && (
              <p className="mt-3 font-mono text-[11px] tabular-nums text-gray-500">
                Verified Area: {resolvedPrimary.address}
              </p>
            )}
            <a
              href={resolvedPrimary?.mapsUri || googleMapsSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
            >
              <Navigation className="h-3.5 w-3.5" />
              <span>Get Directions</span>
            </a>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-6">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
              <Clock className="h-4 w-4 text-blue-600" />
              <span>Visiting Hours</span>
            </div>
            <div className="mt-4 space-y-2.5 text-sm">
              {OPERATING_HOURS.map((block) => (
                <div
                  key={block.days}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="text-gray-600">{block.days}</span>
                  <span className="font-mono text-xs font-medium tabular-nums text-gray-900">
                    {block.hours}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-4 border-t border-black/10 pt-3 text-xs text-gray-500">
              Operates inside a private home in Islamabad only. Closed on
              select off-days as marked on the booking calendar.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
