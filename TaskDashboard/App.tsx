/**
 * APP-GM — Task Dashboard entry point.
 * Replaces the default RN template with our app navigator.
 */
import React, { useEffect } from 'react';
import { PermissionsAndroid, Platform, StatusBar } from 'react-native';
import { AppNavigator } from './src/presentation/navigation/AppNavigator';
import { SyncService } from './src/data/sync/SyncService';
import NetInfo from '@react-native-community/netinfo';
import { useTaskStore } from './src/presentation/stores/useTaskStore';

function App(): React.JSX.Element {
  const { setOffline } = useTaskStore();

  useEffect(() => {
    const requestPermissions = async () => {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      }
    };
    requestPermissions();

    // Start listening for reconnect → auto push pending
    SyncService.startListening();

    // Track offline state for the UI banner
    const unsub = NetInfo.addEventListener(state => {
      setOffline(!(state.isConnected && state.isInternetReachable));
    });

    return () => {
      SyncService.stopListening();
      unsub();
    };
  }, [setOffline]);

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0D1117" />
      <AppNavigator />
    </>
  );
}

export default App;
