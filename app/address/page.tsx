"use client";
import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
declare global { namespace JSX { interface IntrinsicElements { 'gmp-basic-place-autocomplete': any } } }
import Script from 'next/script';

export default function AddressPage() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [suggestions, setSuggestions] = useState<Array<{ label: string; address: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [placesFailed, setPlacesFailed] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [gStatus, setGStatus] = useState<string | null>(null);
  const [gLoaded, setGLoaded] = useState(false);
  const [useGmp, setUseGmp] = useState(false);
  const autoRef = useRef<any>(null);

  function initPlaces() {
    const g = (window as any).google;
    if (!g || !inputRef.current) return;
  }

  useEffect(() => {
    if ((window as any).google) initPlaces();
    const onLoaded = () => { initPlaces(); setGLoaded(true); };
    const onError = () => { setPlacesFailed(true); };
    window.addEventListener('gmaps:loaded', onLoaded);
    window.addEventListener('gmaps:error', onError);
    const onGmp = () => { setUseGmp(true); };
    window.addEventListener('gmp:loaded', onGmp);
    return () => {
      window.removeEventListener('gmaps:loaded', onLoaded);
      window.removeEventListener('gmaps:error', onError);
      window.removeEventListener('gmp:loaded', onGmp);
    };
  }, []);

  useEffect(() => {
    if (!address || address.length < 3) { setSuggestions([]); setShowSuggestions(false); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const g = (window as any).google;
      if (g && !placesFailed) {
        try {
          const svc = new g.maps.places.AutocompleteService();
          svc.getPlacePredictions({ input: address, types: ['address'], componentRestrictions: { country: 'us' } }, (preds: any[], status: string) => {
            setGStatus(status);
            if (status === g.maps.places.PlacesServiceStatus.OK && Array.isArray(preds) && preds.length) {
              const items = preds.slice(0, 5).map((p: any) => ({ label: p.description as string, address: p.description as string }));
              setSuggestions(items);
              setShowSuggestions(items.length > 0);
            } else if (status === g.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
              // keep trying as user types, fall back below
            } else if (status === g.maps.places.PlacesServiceStatus.REQUEST_DENIED || status === g.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
              setPlacesFailed(true);
            }
          });
          return;
        } catch {
          setPlacesFailed(true);
        }
      }
      try {
        const controller = new AbortController();
        const to = setTimeout(() => controller.abort(), 2500);
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=5`, {
          headers: { 'User-Agent': 'RoofMapping/1.0 (+support@example.com)' },
          signal: controller.signal,
        });
        clearTimeout(to);
        if (!res.ok) { setSuggestions([]); setShowSuggestions(false); return; }
        const arr = await res.json();
        const items = Array.isArray(arr) ? arr.slice(0, 5).map((x: any) => ({ label: x.display_name as string, address: x.display_name as string })) : [];
        setSuggestions(items);
        setShowSuggestions(items.length > 0);
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [address, placesFailed]);

  async function submit() {
    setLoading(true);
    setError(null);
    let a = address;
    if (useGmp && autoRef.current) {
      try { a = (autoRef.current as any).value || a; } catch {}
    }
    window.location.href = `/results?address=${encodeURIComponent(a)}`;
  }

  return (
    <main className="py-12">
      <div className="mx-auto max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle>Start a Roof Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700">Enter a property address. Geocoding validates the address before submission.</p>
            <div className="mt-4 space-y-3">
              {useGmp ? (
                <div className="relative">
                  {(() => {
                    const props: any = { ref: autoRef as any, class: 'block w-full' };
                    props['included-primary-types'] = 'street_address route';
                    props['included-region-codes'] = 'us';
                    props['requested-language'] = 'en';
                    props['requested-region'] = 'US';
                    props['unit-system'] = 'metric';
                    return (require('react').createElement as any)('gmp-basic-place-autocomplete', props);
                  })()}
                </div>
              ) : (
                <div className="relative">
                  <Input
                    ref={inputRef}
                    aria-label="Property address"
                    value={address}
                    onChange={(e) => { setAddress(e.target.value); setShowSuggestions(true); }}
                    placeholder="123 Main St, City"
                    autoComplete="off"
                    onFocus={() => { if (suggestions.length) setShowSuggestions(true); }}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && address && !loading) submit(); }}
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full rounded-md border border-sage-300 bg-white shadow">
                      {suggestions.map((s, i) => (
                        <button
                          key={i}
                          type="button"
                          className="block w-full text-left px-3 py-2 hover:bg-sage-100"
                          onMouseDown={(ev) => { ev.preventDefault(); setAddress(s.address); setShowSuggestions(false); }}
                        >{s.label}</button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {error && <p className="text-red-600 text-sm">{error}</p>}
              {gStatus && !useGmp && (
                <p className="text-xs text-slate-500">Google Places status: {gStatus}</p>
              )}
              <div className="flex gap-3">
                <Button onClick={submit} disabled={!address || loading}>{loading ? 'Submitting…' : 'Analyze Roof'}</Button>
                <Button variant="outline" onClick={() => setAddress('')} disabled={loading}>Clear</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Script id="gmaps-loader" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: `
        (function(){
          var key = window.__GMAPS_KEY || '';
          if(!key){ return; }
          var s = document.createElement('script');
          s.src = 'https://maps.googleapis.com/maps/api/js?key=' + key + '&libraries=places&language=en&region=US';
          s.async = true; s.defer = true;
          s.onload = function(){ if(window && window.dispatchEvent){ window.dispatchEvent(new Event('gmaps:loaded')); } };
          s.onerror = function(){ if(window && window.dispatchEvent){ window.dispatchEvent(new Event('gmaps:error')); } };
          document.head.appendChild(s);
          var sc = document.createElement('script');
          sc.src = 'https://unpkg.com/@googlemaps/extended-component-library@latest/dist/index.min.js';
          sc.async = true; sc.defer = true;
          sc.onload = function(){ if(window && window.dispatchEvent){ window.dispatchEvent(new Event('gmp:loaded')); } };
          document.head.appendChild(sc);
        })();
      ` }} />
    </main>
  );
}
