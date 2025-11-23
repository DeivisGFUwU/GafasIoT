// src/navigation/RootNavigator.tsx
import React, { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View } from 'react-native';
import { Session } from '@supabase/supabase-js';

import { supabase } from '../services/supabaseClient';
import { HomeScreen } from '../screens/Home/HomeScreen';
import { DetectionDetailScreen } from '../screens/Home/DetectionDetailScreen';
import { LoginScreen } from '../screens/Auth/LoginScreen';
import { ScanScreen } from '../screens/Scan/ScanScreen';
import { TranscriptionScreen } from '../screens/Voice/TranscriptionScreen';
import { Detection } from '../types';

export type RootStackParamList = {
  Home: undefined;
  DetectionDetail: { detection: Detection };
  Scan: undefined;
  Transcription: undefined;
  Login: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('RootNavigator: Initial session:', session ? 'Authenticated' : 'Not authenticated');
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('RootNavigator: Auth state changed -', event, session ? 'Authenticated' : 'Not authenticated');
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#050816' }}>
        <ActivityIndicator size="large" color="#00C851" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#020617' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
        cardStyle: { backgroundColor: '#050816' },
      }}>
      {session ? (
        // Authenticated Stack
        <>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: 'Gafas IoT' }}
          />
          <Stack.Screen
            name="Scan"
            component={ScanScreen}
            options={{ title: 'Buscar Dispositivos' }}
          />
          <Stack.Screen
            name="Transcription"
            component={TranscriptionScreen}
            options={{ title: 'Transcripción en Vivo' }}
          />
          <Stack.Screen
            name="DetectionDetail"
            component={DetectionDetailScreen}
            options={{ title: 'Detalle de Detección' }}
          />
        </>
      ) : (
        // Auth Stack
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      )}
    </Stack.Navigator>
  );
};
