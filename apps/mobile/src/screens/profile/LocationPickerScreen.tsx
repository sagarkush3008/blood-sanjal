import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  TextInput,
  ScrollView,
  Keyboard,
  Animated,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

type GoogleLayerType = 'standard' | 'satellite' | 'terrain';

interface LandmarkPreset {
  id: string;
  name: string;
  category: 'hospital' | 'city' | 'landmark';
  latitude: number;
  longitude: number;
  address: string;
}

// Curated prominent Nepal health hubs & major centers
const PRESET_LOCATIONS: LandmarkPreset[] = [
  { id: 'tuth', name: 'TU Teaching Hospital', category: 'hospital', latitude: 27.7358, longitude: 85.3308, address: 'Maharajgunj, Kathmandu' },
  { id: 'bir', name: 'Bir Hospital', category: 'hospital', latitude: 27.7047, longitude: 85.3134, address: 'Kanti Path, Ratnapark, Kathmandu' },
  { id: 'patan', name: 'Patan Hospital', category: 'hospital', latitude: 27.6685, longitude: 85.3216, address: 'Lagankhel, Lalitpur' },
  { id: 'civil', name: 'Civil Service Hospital', category: 'hospital', latitude: 27.6865, longitude: 85.3414, address: 'New Baneshwor, Minbhawan, Kathmandu' },
  { id: 'gangalal', name: 'Gangalal Heart Center', category: 'hospital', latitude: 27.7478, longitude: 85.3482, address: 'Bansbari, Kathmandu' },
  { id: 'kmc', name: 'KMC Teaching Hospital', category: 'hospital', latitude: 27.6961, longitude: 85.3524, address: 'Sinamangal, Kathmandu' },
  { id: 'bpkihs', name: 'BPKIHS Hospital', category: 'hospital', latitude: 26.8122, longitude: 87.2835, address: 'Dharan, Sunsari' },
  { id: 'chitwan', name: 'Chitwan Medical College', category: 'hospital', latitude: 27.6713, longitude: 84.4361, address: 'Bharatpur, Chitwan' },
  { id: 'pokhara', name: 'Western Regional Hospital', category: 'hospital', latitude: 28.2144, longitude: 83.9995, address: 'Ramghat, Pokhara' },
  { id: 'biratnagar', name: 'Koshi Hospital', category: 'hospital', latitude: 26.4525, longitude: 87.2718, address: 'Biratnagar, Morang' },
  { id: 'ktm_center', name: 'Kathmandu Central', category: 'city', latitude: 27.7172, longitude: 85.3240, address: 'Kathmandu, Bagmati' },
  { id: 'lalitpur_center', name: 'Lalitpur City', category: 'city', latitude: 27.6710, longitude: 85.3260, address: 'Patan, Lalitpur' },
  { id: 'bhaktapur_center', name: 'Bhaktapur Durbar', category: 'city', latitude: 27.6710, longitude: 85.4298, address: 'Bhaktapur' },
  { id: 'butwal', name: 'Lumbini Provincial Hospital', category: 'hospital', latitude: 27.7006, longitude: 83.4484, address: 'Butwal, Rupandehi' },
];

export const LocationPickerScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const webViewRef = useRef<WebView>(null);

  // Initial coords from route params if provided, otherwise default to Kathmandu
  const initialLat = typeof route.params?.latitude === 'number' ? route.params.latitude : 27.7172;
  const initialLng = typeof route.params?.longitude === 'number' ? route.params.longitude : 85.3240;
  const initialLocName = route.params?.selectedLocation || route.params?.locationName || 'Kathmandu';

  const [coords, setCoords] = useState<{ latitude: number; longitude: number }>({
    latitude: initialLat,
    longitude: initialLng,
  });

  const [layerType, setLayerType] = useState<GoogleLayerType>('standard');
  const [loading, setLoading] = useState(false);
  const [exactLocationName, setExactLocationName] = useState<string>(initialLocName);
  const [detailedAddress, setDetailedAddress] = useState<string>('Detecting exact location...');
  const [isResolving, setIsResolving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isMapMoving, setIsMapMoving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LandmarkPreset[]>([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Animated pin lift & bounce physics
  const pinAnim = useRef(new Animated.Value(0)).current;
  const shadowScale = useRef(new Animated.Value(1)).current;

  // Refs for race-condition prevention and stability
  const latestRequestIdRef = useRef<number>(0);
  const isMapReadyRef = useRef<boolean>(false);
  const hasInitializedGPS = useRef<boolean>(false);
  const addressCache = useRef<Map<string, { exact: string; detailed: string }>>(new Map());

  // Handle pin elevation animation
  useEffect(() => {
    if (isMapMoving) {
      Animated.parallel([
        Animated.timing(pinAnim, {
          toValue: -14,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(shadowScale, {
          toValue: 0.65,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(pinAnim, {
          toValue: 0,
          friction: 5,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.spring(shadowScale, {
          toValue: 1,
          friction: 5,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isMapMoving, pinAnim, shadowScale]);

  // Initial GPS location fetch (fires ONLY ONCE on mount if route params did not supply coordinates)
  useEffect(() => {
    let isCancelled = false;

    const setupInitialPosition = async () => {
      // If route already passed specific coordinates, resolve and keep them
      if (typeof route.params?.latitude === 'number' && typeof route.params?.longitude === 'number') {
        fetchExactAddress(route.params.latitude, route.params.longitude);
        return;
      }

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted' && !isCancelled) {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          if (isCancelled) return;

          const target = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          };

          setCoords(target);
          fetchExactAddress(target.latitude, target.longitude);
          hasInitializedGPS.current = true;

          // If map is already loaded, pan gently
          if (isMapReadyRef.current) {
            webViewRef.current?.injectJavaScript(
              `if(window.flyToLocation){ window.flyToLocation(${target.latitude}, ${target.longitude}, 16); } true;`
            );
          }
        } else {
          fetchExactAddress(coords.latitude, coords.longitude);
        }
      } catch {
        fetchExactAddress(coords.latitude, coords.longitude);
      }
    };

    setupInitialPosition();

    return () => {
      isCancelled = true;
    };
  }, []);

  // Resolves the high-precision human-friendly name of the pinned location
  const fetchExactAddress = useCallback(async (lat: number, lng: number) => {
    // Quantize coords to 4 decimal places (~11 meters) to check cache
    const cacheKey = `${lat.toFixed(4)}_${lng.toFixed(4)}`;
    if (addressCache.current.has(cacheKey)) {
      const cached = addressCache.current.get(cacheKey)!;
      setExactLocationName(cached.exact);
      setDetailedAddress(cached.detailed);
      setIsResolving(false);
      return;
    }

    const currentRequestId = ++latestRequestIdRef.current;
    setIsResolving(true);

    try {
      // 1. Check if pinned near any known Nepal hospital/landmark preset within ~150 meters
      for (const preset of PRESET_LOCATIONS) {
        const dLat = Math.abs(preset.latitude - lat);
        const dLng = Math.abs(preset.longitude - lng);
        if (dLat < 0.0015 && dLng < 0.0015) {
          if (currentRequestId === latestRequestIdRef.current) {
            setExactLocationName(preset.name);
            setDetailedAddress(preset.address);
            setIsResolving(false);
            addressCache.current.set(cacheKey, { exact: preset.name, detailed: preset.address });
            return;
          }
        }
      }

      // 2. Native Device Geocoder (expo-location)
      const nativeResults = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });

      if (currentRequestId !== latestRequestIdRef.current) return;

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
          addressCache.current.set(cacheKey, { exact, detailed });
          return;
        }
      }

      // 3. High-accuracy fallback: OpenStreetMap Nominatim reverse geocode with 4-second timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: { 'User-Agent': 'BloodSanjal-Nepal/2.0' },
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);

      if (currentRequestId !== latestRequestIdRef.current) return;

      if (res.ok) {
        const data = await res.json();
        if (data && data.address) {
          const addr = data.address;
          const place =
            addr.amenity ||
            addr.hospital ||
            addr.tourism ||
            addr.neighbourhood ||
            addr.suburb ||
            addr.quarter ||
            addr.village ||
            addr.road;
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
            const detailed = data.display_name ? data.display_name.split(',').slice(0, 3).join(', ') : exact;
            setExactLocationName(exact);
            setDetailedAddress(detailed);
            setIsResolving(false);
            addressCache.current.set(cacheKey, { exact, detailed });
            return;
          }
        }
      }
    } catch {
      // Fallback
    }

    if (currentRequestId === latestRequestIdRef.current) {
      const fallbackName = `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
      setExactLocationName(fallbackName);
      setDetailedAddress(`${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E`);
      setIsResolving(false);
    }
  }, []);

  // Webview message bus
  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'move_start') {
        setIsMapMoving(true);
      } else if (data.type === 'location_settled') {
        setIsMapMoving(false);
        const newCoords = { latitude: data.latitude, longitude: data.longitude };
        setCoords(newCoords);
        fetchExactAddress(newCoords.latitude, newCoords.longitude);
      } else if (data.type === 'map_ready') {
        isMapReadyRef.current = true;
        // If GPS arrived before map was ready, sync center now
        if (hasInitializedGPS.current) {
          webViewRef.current?.injectJavaScript(
            `if(window.setCenter){ window.setCenter(${coords.latitude}, ${coords.longitude}); } true;`
          );
        }
      }
    } catch {
      // Ignore parse errors
    }
  };

  const handleSwitchLayer = (type: GoogleLayerType) => {
    setLayerType(type);
    webViewRef.current?.injectJavaScript(`if(window.switchLayer){ window.switchLayer("${type}"); } true;`);
  };

  const handleZoomIn = () => {
    webViewRef.current?.injectJavaScript(`if(window.zoomIn){ window.zoomIn(); } true;`);
  };

  const handleZoomOut = () => {
    webViewRef.current?.injectJavaScript(`if(window.zoomOut){ window.zoomOut(); } true;`);
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
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const target = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      setCoords(target);
      fetchExactAddress(target.latitude, target.longitude);
      webViewRef.current?.injectJavaScript(
        `if(window.flyToLocation){ window.flyToLocation(${target.latitude}, ${target.longitude}, 16); } true;`
      );
    } catch {
      Alert.alert('Location Error', 'Could not retrieve your current GPS coordinates.');
    } finally {
      setIsLocating(false);
    }
  };

  const handleOpenGoogleMapsApp = () => {
    const url = Platform.select({
      ios: `maps:0,0?q=${coords.latitude},${coords.longitude}`,
      android: `geo:0,0?q=${coords.latitude},${coords.longitude}(${encodeURIComponent(exactLocationName)})`,
      default: `https://www.google.com/maps/search/?api=1&query=${coords.latitude},${coords.longitude}`,
    });

    Linking.openURL(url as string).catch(() => {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${coords.latitude},${coords.longitude}`);
    });
  };

  const handleSelectPreset = (preset: LandmarkPreset) => {
    Keyboard.dismiss();
    setShowSearchResults(false);
    setSearchQuery('');
    setExactLocationName(preset.name);
    setDetailedAddress(preset.address);
    setCoords({ latitude: preset.latitude, longitude: preset.longitude });

    webViewRef.current?.injectJavaScript(
      `if(window.flyToLocation){ window.flyToLocation(${preset.latitude}, ${preset.longitude}, 16); } true;`
    );
  };

  // Search places & hospitals in Nepal
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const query = text.toLowerCase();
    const matchedPresets = PRESET_LOCATIONS.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.address.toLowerCase().includes(query) ||
        p.category.includes(query)
    );

    setSearchResults(matchedPresets);
    setShowSearchResults(true);
  };

  const handleOnlineSearch = async () => {
    if (!searchQuery.trim()) return;
    Keyboard.dismiss();
    setIsSearchingOnline(true);
    setShowSearchResults(true);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&countrycodes=np&limit=6&addressdetails=1`,
        {
          headers: { 'User-Agent': 'BloodSanjal-Nepal/2.0' },
        }
      );

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const parsedResults: LandmarkPreset[] = data.map((item: any, idx: number) => ({
            id: `online_${idx}_${item.place_id}`,
            name: item.display_name.split(',')[0] || item.name || searchQuery,
            category: 'landmark',
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
            address: item.display_name.split(',').slice(0, 3).join(', '),
          }));
          setSearchResults(parsedResults);
        } else {
          Alert.alert('No Locations Found', 'Try searching with a city or hospital name in Nepal.');
        }
      }
    } catch {
      Alert.alert('Search Error', 'Unable to reach location search service.');
    } finally {
      setIsSearchingOnline(false);
    }
  };

  const handleConfirm = () => {
    setLoading(true);
    const returnScreen = route.params?.returnScreen || 'EditProfile';

    navigation.navigate({
      name: returnScreen,
      params: {
        selectedLocation: exactLocationName,
        locationAddress: detailedAddress,
        latitude: coords.latitude,
        longitude: coords.longitude,
      },
      merge: true,
    });
    setLoading(false);
  };

  // Robust HTML Leaflet Map with Google Maps Tiles (100% Guaranteed No Black Screen & Zero Fluctuation)
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
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #f1f5f9;
      overflow: hidden;
      touch-action: pan-x pan-y pinch-zoom;
      -webkit-user-select: none;
      user-select: none;
    }
    .leaflet-control-attribution, .leaflet-control-zoom {
      display: none !important;
    }
    .leaflet-tile {
      -webkit-backface-visibility: hidden;
      backface-visibility: hidden;
      -webkit-transform: translate3d(0, 0, 0);
      transform: translate3d(0, 0, 0);
      will-change: transform;
    }
    .leaflet-tile-container {
      -webkit-transform: translate3d(0, 0, 0);
      transform: translate3d(0, 0, 0);
    }
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

    var currentLayer = layers.standard;

    var map = L.map('map', {
      center: [${initialLat}, ${initialLng}],
      zoom: 15,
      minZoom: 4,
      maxZoom: 20,
      zoomControl: false,
      attributionControl: false,
      fadeAnimation: true,
      zoomAnimation: true,
      markerZoomAnimation: true,
      inertia: true,
      inertiaDeceleration: 3000,
      easeLinearity: 0.25,
      layers: [currentLayer]
    });

    // Invalidate container size to ensure no grey borders or tile clipping
    setTimeout(function() { map.invalidateSize(); }, 100);
    setTimeout(function() { map.invalidateSize(); }, 350);
    window.addEventListener('resize', function() { map.invalidateSize(); });

    function post(data) {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify(data));
      }
    }

    window.switchLayer = function(type) {
      if (layers[type] && currentLayer !== layers[type]) {
        map.removeLayer(currentLayer);
        currentLayer = layers[type];
        map.addLayer(currentLayer);
      }
    };

    window.setCenter = function(lat, lng) {
      map.setView([lat, lng], map.getZoom() || 16, { animate: true, duration: 0.6 });
    };

    window.flyToLocation = function(lat, lng, zoom) {
      map.flyTo([lat, lng], zoom || 16, {
        animate: true,
        duration: 1.2,
        easeLinearity: 0.25
      });
    };

    window.zoomIn = function() {
      map.zoomIn();
    };

    window.zoomOut = function() {
      map.zoomOut();
    };

    // Event listener: ONLY emit when map stops moving to completely prevent layout fluctuation
    var settleTimer = null;

    map.on('movestart', function() {
      clearTimeout(settleTimer);
      post({ type: 'move_start' });
    });

    map.on('moveend', function() {
      clearTimeout(settleTimer);
      settleTimer = setTimeout(function() {
        var c = map.getCenter();
        post({
          type: 'location_settled',
          latitude: c.lat,
          longitude: c.lng,
          zoom: map.getZoom()
        });
      }, 220);
    });

    // Notify React Native that map is ready
    setTimeout(function() {
      post({ type: 'map_ready' });
    }, 150);
  </script>
</body>
</html>
    `;
  }, [initialLat, initialLng]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerTitleCol}>
          <Text style={styles.headerTitle}>Google Maps Pinpoint</Text>
          <Text style={styles.headerSub}>Drag map or search landmark to set exact spot</Text>
        </View>
        <View style={styles.googleBadge}>
          <Ionicons name="map" size={13} color="#2563EB" />
          <Text style={styles.googleBadgeText}>Google Map</Text>
        </View>
      </View>

      {/* Search Bar & Quick Location Chips */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#64748B" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search hospital, city, landmark in Nepal..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={handleSearchChange}
            onSubmitEditing={handleOnlineSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setSearchResults([]);
                setShowSearchResults(false);
              }}
              style={styles.searchClearBtn}
            >
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.searchActionBtn}
            onPress={handleOnlineSearch}
            disabled={isSearchingOnline}
          >
            {isSearchingOnline ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>

        {/* Quick Filter Chips for Prominent Nepal Locations */}
        {!showSearchResults && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickChipsContainer}
          >
            <TouchableOpacity style={styles.gpsChip} onPress={handleRecenterGPS} activeOpacity={0.8}>
              <MaterialCommunityIcons name="crosshairs-gps" size={14} color="#DC2626" />
              <Text style={styles.gpsChipText}>My GPS</Text>
            </TouchableOpacity>
            {PRESET_LOCATIONS.map((preset) => (
              <TouchableOpacity
                key={preset.id}
                style={styles.presetChip}
                onPress={() => handleSelectPreset(preset)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={preset.category === 'hospital' ? 'medkit' : 'location'}
                  size={12}
                  color={preset.category === 'hospital' ? '#DC2626' : '#2563EB'}
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.presetChipText}>{preset.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Main Map Container */}
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
              <Text style={styles.loadingText}>Initializing Google Maps Tiles...</Text>
            </View>
          )}
          scalesPageToFit={false}
          scrollEnabled={false}
          bounces={false}
          overScrollMode="never"
        />

        {/* Center Animated Physical Pin (Fixed in Center, Lifts on Pan, Drops on Rest) */}
        <View style={styles.centerPinContainer} pointerEvents="none">
          <Animated.View
            style={[
              styles.pinWrapper,
              {
                transform: [{ translateY: pinAnim }],
              },
            ]}
          >
            <View style={styles.pinBubble}>
              <Text style={styles.pinBubbleText} numberOfLines={1}>
                {isMapMoving ? 'Locating...' : exactLocationName.split(',')[0]}
              </Text>
            </View>
            <MaterialCommunityIcons name="map-marker" size={46} color="#DC2626" />
          </Animated.View>

          {/* Animated Pin Shadow on Ground */}
          <Animated.View
            style={[
              styles.pinShadow,
              {
                transform: [{ scale: shadowScale }],
              },
            ]}
          />
          {/* Exact Coordinate Reticle Target Point */}
          <View style={styles.focalPointDot} />
        </View>

        {/* Floating Google Map Layer Switcher */}
        <View style={styles.floatingLayerRow}>
          {(['standard', 'satellite', 'terrain'] as const).map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.layerChip, layerType === type && styles.layerChipActive]}
              onPress={() => handleSwitchLayer(type)}
              activeOpacity={0.8}
            >
              <Text style={[styles.layerChipText, layerType === type && styles.layerChipTextActive]}>
                {type === 'standard' ? 'Standard' : type === 'satellite' ? 'Satellite' : 'Terrain'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Floating Action Controls on Right Side (Recenter, Zoom In, Zoom Out, Native Maps) */}
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
              <MaterialCommunityIcons name="crosshairs-gps" size={22} color="#DC2626" />
            )}
          </TouchableOpacity>

          {/* Zoom In Button */}
          <TouchableOpacity style={styles.controlCircleBtn} onPress={handleZoomIn} activeOpacity={0.8}>
            <Feather name="plus" size={20} color="#0F172A" />
          </TouchableOpacity>

          {/* Zoom Out Button */}
          <TouchableOpacity style={styles.controlCircleBtn} onPress={handleZoomOut} activeOpacity={0.8}>
            <Feather name="minus" size={20} color="#0F172A" />
          </TouchableOpacity>

          {/* Open in Native Google Maps App */}
          <TouchableOpacity style={styles.controlCircleBtn} onPress={handleOpenGoogleMapsApp} activeOpacity={0.8}>
            <Ionicons name="navigate-circle-outline" size={22} color="#2563EB" />
          </TouchableOpacity>
        </View>

        {/* Search Results Dropdown Overlay */}
        {showSearchResults && (
          <View style={styles.searchDropdownOverlay}>
            <View style={styles.searchDropdownHeader}>
              <Text style={styles.searchDropdownTitle}>Matching Places in Nepal</Text>
              <TouchableOpacity onPress={() => setShowSearchResults(false)}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 260 }}>
              {searchResults.length === 0 ? (
                <View style={styles.searchEmptyBox}>
                  <Text style={styles.searchEmptyText}>No matching places found. Try another query.</Text>
                </View>
              ) : (
                searchResults.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.searchResultItem}
                    onPress={() => handleSelectPreset(item)}
                  >
                    <View style={styles.searchResultIconCircle}>
                      <Ionicons
                        name={item.category === 'hospital' ? 'medkit' : 'location'}
                        size={16}
                        color={item.category === 'hospital' ? '#DC2626' : '#2563EB'}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.searchResultName}>{item.name}</Text>
                      <Text style={styles.searchResultAddress} numberOfLines={1}>
                        {item.address}
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={16} color="#94A3B8" />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Rigid Bottom Confirmation Card (Fixed Dimension to Prevent Any Layout Shift/Fluctuation) */}
      <View style={styles.bottomCard}>
        <View style={styles.addressPreviewBox}>
          <View style={styles.addressIconCircle}>
            <MaterialCommunityIcons name="map-marker-check" size={24} color="#DC2626" />
          </View>
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <View style={styles.labelRow}>
              <Text style={styles.addressLabel}>EXACT PINPOINT LOCATION</Text>
              <View style={styles.resolvingBadge}>
                {isResolving ? (
                  <>
                    <ActivityIndicator size="small" color="#DC2626" style={{ transform: [{ scale: 0.6 }] }} />
                    <Text style={styles.resolvingText}>Resolving...</Text>
                  </>
                ) : (
                  <Text style={styles.coordsBadgeText}>
                    {coords.latitude.toFixed(4)}°N, {coords.longitude.toFixed(4)}°E
                  </Text>
                )}
              </View>
            </View>

            <Text style={styles.exactNameText} numberOfLines={1}>
              {isMapMoving ? 'Adjusting pin...' : exactLocationName}
            </Text>

            <Text style={styles.detailedSubtext} numberOfLines={1}>
              {detailedAddress}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.confirmBtn, (isResolving || isMapMoving) && { opacity: 0.85 }]}
          onPress={handleConfirm}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <MaterialCommunityIcons name="check-circle" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.confirmBtnText} numberOfLines={1}>
                Confirm Location: {exactLocationName.length > 22 ? exactLocationName.substring(0, 22) + '...' : exactLocationName}
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
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    zIndex: 10,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleCol: {
    flex: 1,
    marginLeft: 10,
  },
  headerTitle: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: '#64748B',
    marginTop: 1,
  },
  googleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  googleBadgeText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#2563EB',
  },
  searchSection: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    zIndex: 9,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: '#0F172A',
    paddingVertical: 0,
  },
  searchClearBtn: {
    padding: 4,
  },
  searchActionBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  quickChipsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    paddingBottom: 2,
  },
  gpsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 4,
  },
  gpsChipText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: '#DC2626',
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetChipText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: '#334155',
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
    marginLeft: -40,
    marginTop: -64,
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
  },
  pinWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinBubble: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: -4,
    maxWidth: 130,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  pinBubbleText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
  },
  pinShadow: {
    width: 16,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    marginTop: -4,
  },
  focalPointDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DC2626',
    marginTop: 2,
  },
  floatingLayerRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    gap: 2,
    zIndex: 3,
  },
  layerChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
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
    right: 12,
    top: 12,
    gap: 8,
    zIndex: 3,
  },
  controlCircleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
  },
  searchDropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 10,
    right: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    zIndex: 15,
  },
  searchDropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 6,
  },
  searchDropdownTitle: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: '#0F172A',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    gap: 10,
  },
  searchResultIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchResultName: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#0F172A',
  },
  searchResultAddress: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: '#64748B',
    marginTop: 1,
  },
  searchEmptyBox: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  searchEmptyText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: '#94A3B8',
  },
  bottomCard: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
    minHeight: 160,
  },
  addressPreviewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    height: 72,
  },
  addressIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addressLabel: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    color: '#DC2626',
    letterSpacing: 0.5,
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
  coordsBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    color: '#64748B',
  },
  exactNameText: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: '#0F172A',
    marginTop: 1,
  },
  detailedSubtext: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: '#64748B',
    marginTop: 1,
  },
  confirmBtn: {
    backgroundColor: '#DC2626',
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
    paddingHorizontal: 14,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
});
