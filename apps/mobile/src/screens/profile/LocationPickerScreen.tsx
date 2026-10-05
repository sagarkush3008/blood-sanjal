import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import MapView, { Region, UrlTile } from 'react-native-maps';
import * as Location from 'expo-location';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const LocationPickerScreen = () => {
  const navigation = useNavigation<any>();
  const mapRef = React.useRef<MapView>(null);
  const [region, setRegion] = useState<Region>({
    latitude: 27.0163, // Birgunj default
    longitude: 84.8788,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Allow location access to jump to your current location.');
        return;
      }
      try {
        let location = await Location.getCurrentPositionAsync({});
        const newRegion = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setRegion(newRegion);
        mapRef.current?.animateToRegion(newRegion, 1000);
      } catch (e) {
        // Fallback to default
      }
    })();
  }, []);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const geocoded = await Location.reverseGeocodeAsync({
        latitude: region.latitude,
        longitude: region.longitude,
      });

      let selectedCity = 'Unknown Location';
      if (geocoded.length > 0) {
        const place = geocoded[0];
        selectedCity = place.city || place.subregion || place.region || place.country || 'Unknown Location';
      }

      // Navigate back to EditProfile and pass the selected location
      navigation.navigate({
        name: 'EditProfile',
        params: { selectedLocation: selectedCity },
        merge: true,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch location details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pin Your Location</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={region}
          onRegionChangeComplete={(newRegion) => setRegion(newRegion)}
          showsUserLocation={true}
          showsMyLocationButton={true}
          mapType={Platform.OS === 'android' ? 'none' : 'standard'}
        >
          {Platform.OS === 'android' && (
            <UrlTile
              urlTemplate="https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png"
              maximumZ={19}
              flipY={false}
              zIndex={1}
            />
          )}
        </MapView>
        {/* Fixed Center Pin */}
        <View style={styles.centerPinContainer} pointerEvents="none">
          <MaterialCommunityIcons name="map-marker" size={48} color="#DC2626" />
          <View style={styles.pinShadow} />
        </View>
      </View>

      <View style={styles.bottomCard}>
        <Text style={styles.infoText}>Drag the map to place the pin precisely on your city or neighborhood.</Text>
        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm} disabled={loading} activeOpacity={0.8}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <MaterialCommunityIcons name="check-circle" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.confirmBtnText}>Confirm Map Location</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontFamily: 'Inter_800ExtraBold', color: '#0F172A' },
  
  mapContainer: { flex: 1, position: 'relative' },
  map: { width: '100%', height: '100%' },
  
  centerPinContainer: { position: 'absolute', top: '50%', left: '50%', marginLeft: -24, marginTop: -48, alignItems: 'center', justifyContent: 'center' },
  pinShadow: { width: 12, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.3)', marginTop: -4 },
  
  bottomCard: { backgroundColor: '#FFFFFF', padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 15 },
  infoText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#64748B', textAlign: 'center', marginBottom: 20 },
  confirmBtn: { backgroundColor: '#0F172A', height: 56, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  confirmBtnText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Inter_700Bold' },
});
