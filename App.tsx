// App.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AppProvider } from './src/context/AppContext';
import { AlertProvider, useAlert } from './src/context/AlertContext';
import { LiveAlert } from './src/components/LiveAlert';

const AppContent = () => {
  const { currentAlert } = useAlert();
  const navigationRef = React.useRef<NavigationContainerRef<any>>(null);

  const handleAlertPress = () => {
    if (navigationRef.current?.isReady()) {
      navigationRef.current.navigate('Transcription' as never);
    }
  };

  return (
    <>
      <NavigationContainer ref={navigationRef}>
        <RootNavigator />
      </NavigationContainer>

      {/* Global Alert Overlay - Always on top of navigation */}
      {currentAlert && (
        <View style={styles.globalAlertOverlay}>
          <LiveAlert detection={currentAlert} onPress={handleAlertPress} />
        </View>
      )}
    </>
  );
};

const App = () => {
  return (
    <AppProvider>
      <AlertProvider>
        <AppContent />
      </AlertProvider>
    </AppProvider>
  );
};

export default App;

const styles = StyleSheet.create({
  globalAlertOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'box-none', // Allow touches to pass through to navigation when no alert
  },
});

