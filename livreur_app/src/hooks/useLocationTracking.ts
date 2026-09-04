import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export function useLocationTracking() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let watchSubscription: Location.LocationSubscription;

    (async () => {
      // 1. Demander la permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg("Permission d'accès au GPS refusée");
        return;
      }

      // 2. Obtenir la position immédiate
      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
      
      // 3. Suivre la position en temps réel (mise à jour tous les 10 mètres)
      watchSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 10, 
        },
        (newLocation) => {
          setLocation(newLocation);
          // TODO: Envoyer à Firebase ici (ex: driverLocations)
        }
      );
    })();

    // Nettoyage lors du démontage du composant
    return () => {
      if (watchSubscription) {
        watchSubscription.remove();
      }
    };
  }, []);

  return { location, errorMsg };
}
