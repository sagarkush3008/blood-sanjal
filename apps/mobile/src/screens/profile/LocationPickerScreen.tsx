import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

type GoogleLayerType = 'standard' | 'satellite' | 'terrain';

export const LocationPickerScreen = () => {
  const navigation = useNavigation<any>();
  const webViewRef = useRef<WebView>(null);

  const [coords, setCoords] = useState<{ latitude: number; longitude: number }>({
    latitude: 27.7172, // Kathmandu default
    longitude: 85.3240,
  });

  const [layerType, setLayerType] = useState<GoogleLayerType>('standard');
  const [loading, setLoading] = useState(false);
  const [exactLocationName, setExactLocationName] = useState<string>('Kathmandu');
  const [detailedAddress, setDetailedAddress] = useState<string>('Detecting exact location...');
  const [isResolving, setIsResolving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);

  // Jump to device's GPS position on mount
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          const target = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          };
          setCoords(target);
          fetchExactAddress(target.latitude, target.longitude);
          if (isMapReady) {
            webViewRef.current?.injectJavaScript(`if(window.setCenter){ window.setCenter(${target.latitude}, ${target.longitude}); } true;`);
          }
        } else {
          fetchExactAddress(coords.latitude, coords.longitude);
        }
      } catch {
        fetchExactAddress(coords.latitude, coords.longitude);
      }
    })();
  }, [isMapReady]);

  // Resolves the high-precision human-friendly name of the pinned location
  const fetchExactAddress = async (lat: number, lng: number) => {
    setIsResolving(true);
    try {
      // 1. Native Device Geocoder (expo-location)
      const nativeResults = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });

      if (nativeResults && nativeResults.length > 0) {
        const p = nativeResults[0];
        const specificName = p.name || p.street;
        const municipalityOrCity = p.city || p.subregion || p.district;
        
        let exact = '';
        if (specificName && municipalityOrCity && !specificName.toLowerCase().includes(municipalityOrCity.toLowerCase())) {
          exact = `${specificName}, ${municipalityOrCity}`;
        } else if (specificName) {
          exact = specificName;
        } else if (municipalityOrCity) {
          exact = municipalityOrCity;
        }

        const fullParts = [p.name, p.street, p.subregion || p.city, p.region].filter(Boolean);
        const detailed = fullParts.length > 0 ? Array.from(new Set(fullParts)).join(', ') : exact;

        if (exact && !exact.match(/^[\d\+\s\-\.,]+$/)) {
          setExactLocationName(exact);
          setDetailedAddress(detailed);
          setIsResolving(false);
          return;
        }
      }

      // 2. High-accuracy fallback: OpenStreetMap Nominatim reverse geocode (gives precise neighborhoods in Nepal)
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
        headers: { 'User-Agent': 'BloodSanjal-App/1.0' },
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.address) {
          const addr = data.address;
          const place = addr.amenity || addr.hospital || addr.tourism || addr.neighbourhood || addr.suburb || addr.quarter || addr.village || addr.road;
          const city = addr.city || addr.town || addr.municipality || addr.district || addr.county;
          
          let exact = '';
          if (place && city && place !== city) {
            exact = `${place}, ${city}`;
          } else if (place) {
            exact = place;
          } else if (city) {
            exact = city;
          }

          if (exact) {
            setExactLocationName(exact);
            setDetailedAddress(data.display_name ? data.display_name.split(',').slice(0, 3).join(', ') : exact);
            setIsResolving(false);
            return;
          }
        }
      }
    } catch {
      // Fallback on coordinate display
    }

    const fallbackName = `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    setExactLocationName(fallbackName);
    setDetailedAddress(`${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E`);
    setIsResolving(false);
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'location_changed') {
        const newCoords = { latitude: data.latitude, longitude: data.longitude };
        setCoords(newCoords);
        fetchExactAddress(newCoords.latitude, newCoords.longitude);
      } else if (data.type === 'map_ready') {
        setIsMapReady(true);
      }
    } catch {
      // Ignore parse errors
    }
  };

  const handleSwitchLayer = (type: GoogleLayerType) => {
    setLayerType(type);
    webViewRef.current?.injectJavaScript(`if(window.switchLayer){ window.switchLayer("${type}"); } true;`);
  };

  const handleRecenterGPS = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to center on your position.');
        setIsLocating(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const target = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      setCoords(target);
      fetchExactAddress(target.latitude, target.longitude);
      webViewRef.current?.injectJavaScript(`if(window.setCenter){ window.setCenter(${target.latitude}, ${target.longitude}); } true;`);
    } catch {
      Alert.alert('Location Error', 'Could not retrieve your current GPS coordinates.');
    } finally {
      setIsLocating(false);
    }
  };

  const handleOpenGoogleMapsApp = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${coords.latitude},${coords.longitude}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Google Maps', 'Unable to open Google Maps app.');
    });
  };

  const handleConfirm = () => {
    setLoading(true);
    // Pass the exact resolved location name back to EditProfile
    navigation.navigate({
      name: 'EditProfile',
      params: { 
        selectedLocation: exactLocationName,
        latitude: coords.latitude,
        longitude: coords.longitude,
      },
      merge: true,
    });
    setLoading(false);
  };

  // Generate robust HTML map with Google Maps tiles via Leaflet
  const mapHtml = useMemo(() => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <meta name="color-scheme" content="light only" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map {
      width: 100%;
      height: 100%;
      background-color: #e2e8f0;
      overflow: hidden;
      touch-action: none;
    }
    .leaflet-control-attribution { display: none !important; }
    .leaflet-bar { border: none !important; box-shadow: 0 2px 6px rgba(0,0,0,0.2) !important; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var layers = {
      standard: L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['0', '1', '2', '3']
      }),
      satellite: L.tileLayer('https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['0', '1', '2', '3']
      }),
      terrain: L.tileLayer('https://mt{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['0', '1', '2', '3']
      })
    };

    var map = L.map('map', {
      center: [${coords.latitude}, ${coords.longitude}],
      zoom: 15,
      zoomControl: false,
      layers: [layers.standard]
    });

    var currentLayer = layers.standard;

    window.switchLayer = function(type) {
      if (layers[type] && currentLayer !== layers[type]) {
        map.removeLayer(currentLayer);
        currentLayer = layers[type];
        map.addLayer(currentLayer);
      }
    };

    window.setCenter = function(lat, lng) {
      map.setView([lat, lng], 16, { animate: true });
    };

    var debounceTimer = null;
    function emitLocation() {
      var center = map.getCenter();
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'location_changed',
          latitude: center.lat,
          longitude: center.lng
        }));
      }
    }

    map.on('move', function() {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(emitLocation, 120);
    });

    // Notify ready
    setTimeout(function() {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'map_ready' }));
      }
      emitLocation();
    }, 200);
  </script>
</body>
</html>
    `;
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerTitleCol}>
          <Text style={styles.headerTitle}>Google Maps Location</Text>
          <Text style={styles.headerSub}>Drag the map to pinpoint your exact spot</Text>
        </View>
        <View style={styles.googleBadge}>
          <Ionicons name="map" size={14} color="#2563EB" />
          <Text style={styles.googleBadgeText}>Google</Text>
        </View>
      </View>

      {/* Map View Area (WebView Google Maps - 100% Guaranteed No Black Screen) */}
      <View style={styles.mapContainer}>
        <WebView
          ref={webViewRef}
          source={{ html: mapHtml }}
          style={styles.webView}
          onMessage={handleMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#DC2626" />
              <Text style={styles.loadingText}>Loading Google Maps...</Text>
            </View>
          )}
          scalesPageToFit={false}
          scrollEnabled={false}
          bounces={false}
          overScrollMode="never"
        />

        {/* Center Static Pin (Fixed on top of map) */}
        <View style={styles.centerPinContainer} pointerEvents="none">
          <View style={styles.pinWrapper}>
            <MaterialCommunityIcons name="map-marker" size={48} color="#DC2626" />
            <View style={styles.pinShadow} />
          </View>
        </View>

        {/* Floating Google Map Layer Switcher */}
        <View style={styles.floatingLayerRow}>
          {(['standard', 'satellite', 'terrain'] as const).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.layerChip,
                layerType === type && styles.layerChipActive,
              ]}
              onPress={() => handleSwitchLayer(type)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.layerChipText,
                  layerType === type && styles.layerChipTextActive,
                ]}
              >
                {type === 'standard' ? 'Google Map' : type === 'satellite' ? 'Satellite' : 'Terrain'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Floating Action Controls */}
        <View style={styles.floatingControls}>
          {/* Recenter GPS */}
          <TouchableOpacity
            style={styles.controlCircleBtn}
            onPress={handleRecenterGPS}
            disabled={isLocating}
            activeOpacity={0.8}
          >
            {isLocating ? (
              <ActivityIndicator size="small" color="#DC2626" />
            ) : (
              <MaterialCommunityIcons name="crosshairs-gps" size={22} color="#0F172A" />
            )}
          </TouchableOpacity>

          {/* Open in Native Google Maps App */}
          <TouchableOpacity
            style={styles.controlCircleBtn}
            onPress={handleOpenGoogleMapsApp}
            activeOpacity={0.8}
          >
            <Ionicons name="open-outline" size={20} color="#2563EB" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Confirmation Card with EXACT Location Name */}
      <View style={styles.bottomCard}>
        <View style={styles.addressPreviewBox}>
          <View style={styles.addressIconCircle}>
            <MaterialCommunityIcons name="map-marker-radius" size={24} color="#DC2626" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.labelRow}>
              <Text style={styles.addressLabel}>EXACT LOCATION NAME</Text>
              {isResolving && (
                <View style={styles.resolvingBadge}>
                  <ActivityIndicator size="small" color="#DC2626" style={{ transform: [{ scale: 0.6 }] }} />
                  <Text style={styles.resolvingText}>Resolving...</Text>
                </View>
              )}
            </View>
            <Text style={styles.exactNameText} numberOfLines={2}>
              {exactLocationName}
            </Text>
            <Text style={styles.detailedSubtext} numberOfLines={1}>
              {detailedAddress}
            </Text>
            <Text style={styles.coordsText}>
              📍 {coords.latitude.toFixed(5)}° N, {coords.longitude.toFixed(5)}° E
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.confirmBtn, isResolving && { opacity: 0.7 }]}
          onPress={handleConfirm}
          disabled={loading || isResolving}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <MaterialCommunityIcons name="check-circle" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.confirmBtnText} numberOfLines={1}>
                Set Exact Location: {exactLocationName.length > 20 ? exactLocationName.substring(0, 20) + '...' : exactLocationName}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleCol: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#64748B',
    marginTop: 1,
  },
  googleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  googleBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#2563EB',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#E2E8F0',
  },
  webView: {
    flex: 1,
    backgroundColor: '#E2E8F0',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    zIndex: 5,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#64748B',
  },
  centerPinContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -24,
    marginTop: -48,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  pinWrapper: {
    alignItems: 'center',
  },
  pinShadow: {
    width: 14,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    marginTop: -6,
  },
  floatingLayerRow: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    gap: 2,
    zIndex: 3,
  },
  layerChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  layerChipActive: {
    backgroundColor: '#0F172A',
  },
  layerChipText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#475569',
  },
  layerChipTextActive: {
    color: '#FFFFFF',
  },
  floatingControls: {
    position: 'absolute',
    right: 14,
    top: 14,
    gap: 10,
    zIndex: 3,
  },
  controlCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  bottomCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
  },
  addressPreviewBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  addressIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addressLabel: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: '#DC2626',
    letterSpacing: 0.6,
  },
  resolvingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  resolvingText: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    color: '#DC2626',
  },
  exactNameText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#0F172A',
    marginTop: 2,
  },
  detailedSubtext: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#64748B',
    marginTop: 2,
  },
  coordsText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: '#94A3B8',
    marginTop: 4,
  },
  confirmBtn: {
    backgroundColor: '#DC2626',
    height: 54,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    paddingHorizontal: 16,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
});
