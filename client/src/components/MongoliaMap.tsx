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
        
        const loader = new Loader({
          apiKey: apiKey,
          version: 'weekly',
          libraries: ['maps', 'marker']
        });
        
        console.log('Loader created successfully');

        console.log('Loading Google Maps libraries...');
        
        const { Map } = await loader.importLibrary('maps') as google.maps.MapsLibrary;
        console.log('Maps library loaded');
        
        const { AdvancedMarkerElement } = await loader.importLibrary('marker') as google.maps.MarkerLibrary;
        console.log('Marker library loaded');

        if (!mapRef.current) return;

        // Create map centered on Mongolia
        const mapInstance = new Map(mapRef.current, {
          center: mongoliaCenter,
          zoom: 6,
          minZoom: 5,
          maxZoom: 15,
          restriction: {
            latLngBounds: mongoliaBounds,
            strictBounds: false
          },
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          streetViewControl: false,
          mapTypeControl: true,
          fullscreenControl: true,
          zoomControl: true,
          scaleControl: true,
          styles: [
            {
              "featureType": "administrative.country",
              "elementType": "geometry.stroke",
              "stylers": [
                {
                  "color": "#ff0000"
                },
                {
                  "weight": 2
                }
              ]
            },
            {
              "featureType": "administrative.province",
              "elementType": "geometry.stroke",
              "stylers": [
                {
                  "color": "#0066cc"
                },
                {
                  "weight": 1
                }
              ]
            }
          ]
        });

        setMap(mapInstance);

        // Add markers for each branch
        branches.forEach((branch) => {
          const markerElement = document.createElement('div');
          markerElement.className = 'custom-marker';
          markerElement.innerHTML = `
            <div style="position: relative;">
              <!-- Radiating effect rings -->
              <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 60px;
                height: 60px;
                border: 2px solid #dc2626;
                border-radius: 50%;
                animation: pulse-ring 2s infinite;
                opacity: 0.4;
              "></div>
              <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 40px;
                height: 40px;
                border: 2px solid #dc2626;
                border-radius: 50%;
                animation: pulse-ring 2s infinite 0.5s;
                opacity: 0.6;
              "></div>
              <!-- Main marker -->
              <div style="
                position: relative;
                background: #dc2626;
                color: white;
                padding: 8px 12px;
                border-radius: 20px;
                font-weight: bold;
                box-shadow: 0 4px 15px rgba(220, 38, 38, 0.4);
                cursor: pointer;
                border: 2px solid white;
                font-size: 12px;
                white-space: nowrap;
                z-index: 10;
                transition: all 0.3s ease;
              ">
                📍 ${branch.name}
              </div>
            </div>
            <style>
              @keyframes pulse-ring {
                0% {
                  transform: translate(-50%, -50%) scale(0.1);
                  opacity: 1;
                }
                100% {
                  transform: translate(-50%, -50%) scale(1);
                  opacity: 0;
                }
              }
              .custom-marker:hover div div:last-child {
                transform: scale(1.1);
                box-shadow: 0 6px 20px rgba(220, 38, 38, 0.6);
              }
            </style>
          `;

          const marker = new AdvancedMarkerElement({
            map: mapInstance,
            position: { lat: branch.lat, lng: branch.lng },
            content: markerElement,
            title: branch.name
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
                    background: #dc2626;
                    color: white;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                  ">📍</div>
                  <h3 style="
                    margin: 0;
                    color: #1f2937;
                    font-size: 16px;
                    font-weight: 600;
                  ">${branch.name}</h3>
                </div>

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
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#f3f4f6',
          border: '1px solid #d1d5db',
          borderRadius: '8px'
        }}
      >
        <div style={{ textAlign: 'center', color: '#dc2626' }}>
          <p>⚠️ {error}</p>
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