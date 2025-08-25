import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

interface BranchLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address?: string;
  phone?: string;
  description?: string;
  leader?: string;
  leadershipMembers?: string;
  country?: string;
  city?: string;
  isInternational?: boolean;
}

interface MongoliaMapProps {
  branches: BranchLocation[];
  height?: string;
  width?: string;
  apiKey?: string;
}

const MongoliaMap: React.FC<MongoliaMapProps> = ({
  branches,
  height = '600px',
  width = '100%',
  apiKey // apiKey prop is still here but will be overridden by env var if present
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mongolia's approximate center and bounds
  const mongoliaCenter = { lat: 46.8625, lng: 103.8467 };
  const mongoliaBounds = {
    north: 52.1,
    south: 41.5,
    east: 119.9,
    west: 87.7
  };

  // Check if we have international branches to adjust map view
  const hasInternationalBranches = branches.some(branch => branch.isInternational);
  const domesticOnlyBranches = branches.filter(branch => !branch.isInternational);
  const shouldFocusOnMongolia = domesticOnlyBranches.length > 0 && !hasInternationalBranches;

  useEffect(() => {
    const loadMap = async () => {
      try {
        // Use environment variable for API key
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        
        console.log('Google Maps API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'Not found');
        console.log('API Key length:', apiKey ? apiKey.length : 0);
        console.log('All env vars:', Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')));
        console.log('Environment mode:', import.meta.env.MODE);

        if (!apiKey) {
          setError('Google Maps API key is not provided in the environment variables. Please set VITE_GOOGLE_MAPS_API_KEY in Secrets.');
          setIsLoading(false);
          return;
        }

        console.log('Initializing Google Maps Loader...');
        console.log('Current domain:', window.location.hostname);
        console.log('Current protocol:', window.location.protocol);
        console.log('Full URL:', window.location.href);
        
        const loader = new Loader({
          apiKey: apiKey,
          version: 'weekly',
          libraries: ['maps', 'marker']
        });
        
        console.log('Loader created successfully');
        
        // Test API key validity by making a simple request
        try {
          console.log('Testing API key validity...');
          const testResponse = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=Mongolia&key=${apiKey}`);
          const testData = await testResponse.json();
          console.log('API key test response:', testData);
          
          if (testData.status === 'REQUEST_DENIED') {
            throw new Error(`Google Maps API Key Error: ${testData.error_message || 'Request denied'}`);
          }
        } catch (testError) {
          console.error('API key test failed:', testError);
        }

        console.log('Loading Google Maps libraries...');
        
        // Add error handling for library loading
        let Map, AdvancedMarkerElement;
        try {
          const mapsLib = await loader.importLibrary('maps') as google.maps.MapsLibrary;
          Map = mapsLib.Map;
          console.log('Maps library loaded successfully');
        } catch (error) {
          console.error('Failed to load Maps library:', error);
          throw new Error(`Maps library failed to load: ${error}`);
        }
        
        // Note: Using regular markers instead of AdvancedMarkerElement for better compatibility
        console.log('Skipping marker library - using regular markers');

        if (!mapRef.current) return;

        // Create map centered on Mongolia (or worldwide if international branches exist)
        const mapInstance = new Map(mapRef.current, {
          center: mongoliaCenter,
          zoom: shouldFocusOnMongolia ? 5 : (hasInternationalBranches ? 3 : 5),
          minZoom: shouldFocusOnMongolia ? 4 : (hasInternationalBranches ? 2 : 4),
          maxZoom: 15,
          restriction: shouldFocusOnMongolia ? {
            latLngBounds: mongoliaBounds,
            strictBounds: false
          } : (hasInternationalBranches ? undefined : {
            latLngBounds: mongoliaBounds,
            strictBounds: false
          }),
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          streetViewControl: false,
          mapTypeControl: true,
          fullscreenControl: true,
          zoomControl: true,
          scaleControl: true
        });

        setMap(mapInstance);

        // Add markers for each branch using regular Marker
        branches.forEach((branch) => {
          // Create a custom marker icon
          const markerIcon = {
            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
              <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="18" fill="${branch.isInternational ? '#2563eb' : '#dc2626'}" stroke="white" stroke-width="2"/>
                <text x="20" y="26" font-family="Arial, sans-serif" font-size="12" fill="white" text-anchor="middle" font-weight="bold">
                  ${branch.isInternational ? '🌍' : '📍'}
                </text>
              </svg>
            `)}`,
            scaledSize: new google.maps.Size(40, 40),
            anchor: new google.maps.Point(20, 20)
          };

          const marker = new google.maps.Marker({
            position: { lat: branch.lat, lng: branch.lng },
            map: mapInstance,
            title: branch.name,
            icon: markerIcon,
            animation: google.maps.Animation.DROP
          });

          // Create info window
          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="
                padding: 15px; 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                max-width: 300px;
                line-height: 1.5;
              ">
                <div style="
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  margin-bottom: 12px;
                  padding-bottom: 8px;
                  border-bottom: 1px solid #e5e7eb;
                ">
                  <div style="
                    background: ${branch.isInternational ? '#2563eb' : '#dc2626'};
                    color: white;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                  ">${branch.isInternational ? '🌍' : '📍'}</div>
                  <h3 style="
                    margin: 0;
                    color: #1f2937;
                    font-size: 16px;
                    font-weight: 600;
                  ">${branch.name}</h3>
                </div>

                ${branch.isInternational && (branch.country || branch.city) ? `
                  <div style="margin: 8px 0; display: flex; align-items: start; gap: 6px;">
                    <span style="color: #6b7280; font-size: 14px;">🌍</span>
                    <div>
                      <span style="font-weight: 500; color: #374151; font-size: 13px;">Улс/Хот:</span>
                      <span style="color: #6b7280; font-size: 13px; margin-left: 4px;">
                        ${branch.city ? `${branch.city}, ` : ''}${branch.country}
                      </span>
                    </div>
                  </div>
                ` : ''}

                ${branch.leader ? `
                  <div style="margin: 8px 0; display: flex; align-items: start; gap: 6px;">
                    <span style="color: #6b7280; font-size: 14px;">👤</span>
                    <div>
                      <span style="font-weight: 500; color: #374151; font-size: 13px;">Тэргүүлэгч:</span>
                      <span style="color: #6b7280; font-size: 13px; margin-left: 4px;">${branch.leader}</span>
                    </div>
                  </div>
                ` : ''}

                ${branch.address ? `
                  <div style="margin: 8px 0; display: flex; align-items: start; gap: 6px;">
                    <span style="color: #6b7280; font-size: 14px;">📍</span>
                    <div>
                      <span style="font-weight: 500; color: #374151; font-size: 13px;">Хаяг:</span>
                      <span style="color: #6b7280; font-size: 13px; margin-left: 4px;">${branch.address}</span>
                    </div>
                  </div>
                ` : ''}

                ${branch.description ? `
                  <div style="margin: 8px 0; display: flex; align-items: start; gap: 6px;">
                    <span style="color: #6b7280; font-size: 14px;">ℹ️</span>
                    <div>
                      <span style="color: #6b7280; font-size: 13px;">${branch.description}</span>
                    </div>
                  </div>
                ` : ''}

                ${branch.leadershipMembers ? `
                  <div style="margin: 8px 0; display: flex; align-items: start; gap: 6px;">
                    <span style="color: #6b7280; font-size: 14px;">👥</span>
                    <div>
                      <span style="font-weight: 500; color: #374151; font-size: 13px;">Гишүүд:</span>
                      <span style="color: #6b7280; font-size: 13px; margin-left: 4px;">${branch.leadershipMembers}</span>
                    </div>
                  </div>
                ` : ''}

                <div style="
                  margin-top: 12px;
                  padding-top: 8px;
                  border-top: 1px solid #e5e7eb;
                  font-size: 11px;
                  color: #9ca3af;
                  text-align: center;
                ">
                  Координат: ${branch.lat.toFixed(6)}, ${branch.lng.toFixed(6)}
                </div>
              </div>
            `,
            maxWidth: 350
          });

          marker.addListener('click', () => {
            infoWindow.open(mapInstance, marker);
          });
        });

        // Fit map to show all markers if there are branches
        if (branches.length > 0) {
          if (shouldFocusOnMongolia) {
            // For domestic branches, fit bounds but ensure we stay focused on Mongolia
            const bounds = new google.maps.LatLngBounds();
            domesticOnlyBranches.forEach(branch => {
              bounds.extend({ lat: branch.lat, lng: branch.lng });
            });
            mapInstance.fitBounds(bounds);

            // Ensure appropriate zoom level for Mongolia
            const listener = google.maps.event.addListener(mapInstance, 'idle', () => {
              const currentZoom = mapInstance.getZoom();
              if (currentZoom && currentZoom > 8) {
                mapInstance.setZoom(6);
              } else if (currentZoom && currentZoom < 4) {
                mapInstance.setZoom(5);
              }
              google.maps.event.removeListener(listener);
            });
          } else {
            // For international branches, fit all markers
            const bounds = new google.maps.LatLngBounds();
            branches.forEach(branch => {
              bounds.extend({ lat: branch.lat, lng: branch.lng });
            });
            mapInstance.fitBounds(bounds);

            // Ensure minimum zoom level
            const listener = google.maps.event.addListener(mapInstance, 'idle', () => {
              if (mapInstance.getZoom() && mapInstance.getZoom()! > 10) {
                mapInstance.setZoom(8);
              }
              google.maps.event.removeListener(listener);
            });
          }
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Google Maps failed to load:', err);
        if (err instanceof Error) {
          setError(`Failed to load Google Maps: ${err.message}`);
        } else {
          setError('Failed to load Google Maps. Please check API key and configuration.');
        }
        setIsLoading(false);
      }
    };

    loadMap();
  }, [apiKey, branches]); // apiKey dependency is kept for cases where it might be passed directly, though env var is prioritized

  if (error) {
    return (
      <div 
        style={{ 
          height, 
          width, 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#f3f4f6',
          border: '1px solid #d1d5db',
          borderRadius: '8px',
          padding: '20px'
        }}
      >
        <div style={{ textAlign: 'center', color: '#dc2626', marginBottom: '20px' }}>
          <p>⚠️ {error}</p>
          <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '10px' }}>
            Google Maps could not load. Check console for details.
          </p>
        </div>
        
        {/* Fallback: Show branch list */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '8px', 
          maxHeight: '400px', 
          overflowY: 'auto',
          width: '100%'
        }}>
          <h3 style={{ marginBottom: '15px', color: '#374151' }}>Салбар холбоодын жагсаалт:</h3>
          {branches.map((branch) => (
            <div key={branch.id} style={{ 
              marginBottom: '15px', 
              padding: '12px', 
              backgroundColor: '#f9fafb', 
              borderRadius: '6px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ fontWeight: 'bold', color: '#1f2937', marginBottom: '5px' }}>
                {branch.isInternational ? '🌍' : '📍'} {branch.name}
              </div>
              {(branch.country || branch.city) && (
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '3px' }}>
                  {branch.city ? `${branch.city}, ` : ''}{branch.country}
                </div>
              )}
              {branch.address && (
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '3px' }}>
                  📍 {branch.address}
                </div>
              )}
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                Координат: {branch.lat.toFixed(6)}, {branch.lng.toFixed(6)}
              </div>
              {branch.leader && (
                <div style={{ fontSize: '12px', color: '#374151', marginTop: '5px' }}>
                  👤 {branch.leader}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', height, width }}>
      {isLoading && (
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            zIndex: 1000
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #dc2626',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 10px'
            }}></div>
            <p>Loading map...</p>
          </div>
        </div>
      )}
      <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default MongoliaMap;