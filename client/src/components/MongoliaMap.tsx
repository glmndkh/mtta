
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
  apiKey
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
        if (!apiKey) {
          setError('Google Maps API key өгөгдөөгүй байна');
          setIsLoading(false);
          return;
        }

        const loader = new Loader({
          apiKey: apiKey,
          version: 'weekly',
          libraries: ['maps', 'marker']
        });

        const { Map } = await loader.importLibrary('maps');
        const { AdvancedMarkerElement } = await loader.importLibrary('marker') as google.maps.MarkerLibrary;

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
            <div style="
              background: #dc2626;
              color: white;
              padding: 8px 12px;
              border-radius: 20px;
              font-weight: bold;
              box-shadow: 0 2px 10px rgba(0,0,0,0.3);
              cursor: pointer;
              border: 2px solid white;
              font-size: 12px;
              white-space: nowrap;
            ">
              📍 ${branch.name}
            </div>
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
              <div style="padding: 10px; font-family: Arial, sans-serif;">
                <h3 style="margin: 0 0 10px 0; color: #dc2626;">${branch.name}</h3>
                ${branch.address ? `<p style="margin: 5px 0;"><strong>Хаяг:</strong> ${branch.address}</p>` : ''}
                ${branch.phone ? `<p style="margin: 5px 0;"><strong>Утас:</strong> ${branch.phone}</p>` : ''}
                ${branch.description ? `<p style="margin: 5px 0;">${branch.description}</p>` : ''}
                <p style="margin: 5px 0; color: #666; font-size: 12px;">
                  Координат: ${branch.lat.toFixed(4)}, ${branch.lng.toFixed(4)}
                </p>
              </div>
            `
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
        console.error('Google Maps ачаалахад алдаа гарлаа:', err);
        setError('Газрын зураг ачаалахад алдаа гарлаа');
        setIsLoading(false);
      }
    };

    loadMap();
  }, [apiKey, branches]);

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
            <p>Газрын зураг ачаалж байна...</p>
          </div>
        </div>
      )}
      <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default MongoliaMap;
