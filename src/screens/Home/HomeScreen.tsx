import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Button, FlatList, TouchableOpacity, Animated, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { detectionService, DetectionPayload } from '../../services/DetectionService';
import { notificationService } from '../../services/notificationService';
import { authService } from '../../services/authService';
import { Detection } from '../../types';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { generateUUID } from '../../utils/uuid';
import { useApp } from '../../context/AppContext';
import { useAlert } from '../../context/AlertContext';
import { DemoScenarioService } from '../../services/DemoScenarioService';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { isTranscribing, isBleConnected, setIsBleConnected } = useApp(); // Context
  const { currentAlert, triggerAlert } = useAlert(); // Global Alert Context
  const [detections, setDetections] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showVoicePrompt, setShowVoicePrompt] = useState(false); // New state for voice prompt

  const [isDemoRunning, setIsDemoRunning] = useState(false);

  // Animation for listening circle
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const animationLoop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    loadDetections();
    if (isBleConnected) {
      startListeningAnimation();
    } else {
      stopListeningAnimation();
    }
    notificationService.configure();

    return () => {
      stopListeningAnimation();
    };
  }, [isBleConnected]); // Re-run when connection changes

  // Auto-update history when an alert occurs
  useEffect(() => {
    if (currentAlert) {
      loadDetections();
    }
  }, [currentAlert]);

  React.useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  function startListeningAnimation() {
    stopListeningAnimation(); // Ensure no duplicate animation
    animationLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
      ])
    );
    animationLoop.current.start();
  }

  function stopListeningAnimation() {
    if (animationLoop.current) {
      animationLoop.current.stop();
      animationLoop.current = null;
    }
    pulseAnim.setValue(1);
  }

  async function loadDetections() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await detectionService.fetchRecent(20);
      setDetections(data);
    } catch (e: any) {
      console.error('Error loading detections:', e);
      setErrorMsg(e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  // Removed insertDummyDetection - moved to DemoScenarioService


  // Logout function
  const handleLogout = async () => {
    try {
      console.log('Logout: Starting sign out...');
      await authService.signOut();
      console.log('Logout: Sign out successful');
      // The RootNavigator will automatically redirect to Login based on auth state change
    } catch (e) {
      console.error('Logout error:', e);
      Alert.alert('Error', 'No se pudo cerrar sesión. Intenta nuevamente.');
    }
  };

  const handleDemoToggle = () => {
    if (isDemoRunning) {
      DemoScenarioService.stopDemo(setIsBleConnected);
      setIsDemoRunning(false);
    } else {
      setIsDemoRunning(true);
      DemoScenarioService.runDemo(
        { triggerAlert: currentAlert ? () => { } : triggerAlert },
        { setIsBleConnected, isTranscribing }
      );
    }
  };

  const renderItem = ({ item }: { item: Detection }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('DetectionDetail', { detection: item })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>
          {item.tipo.toUpperCase()}
        </Text>
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.prioridad) }]} />
      </View>

      <Text style={styles.cardTextSmall}>
        {item.direccion.toUpperCase()} | Intensidad: {item.intensidad.toFixed(2)}
      </Text>
      <Text style={styles.cardTextSmall}>
        {new Date(item.timestamp!).toLocaleString()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header with Logout */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>GafasIOT</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Cerrar Sesión 🚪</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.alertArea}>
        {/* Always render the listening animation to prevent freezing/unmounting */}
        <View style={styles.listeningContainer}>
          <Animated.View style={[
            styles.listeningCircle,
            {
              transform: [{ scale: isBleConnected ? pulseAnim : 1 }],
              borderColor: isBleConnected ? '#00FF9D' : '#333',
              backgroundColor: isBleConnected ? 'rgba(0, 255, 157, 0.1)' : 'rgba(255, 255, 255, 0.05)'
            }
          ]}>
            <Text style={[styles.listeningIcon, { opacity: isBleConnected ? 1 : 0.3 }]}>
              {isBleConnected ? '👂' : '🔌'}
            </Text>
          </Animated.View>
          <Text style={[styles.listeningText, { color: isBleConnected ? '#00FF9D' : '#666' }]}>
            {isBleConnected ? 'Escuchando entorno...' : 'Desconectado'}
          </Text>
        </View>
      </View>

      {/* Voice Prompt Modal/Banner */}
      {showVoicePrompt && !isTranscribing && (
        <TouchableOpacity
          style={styles.voicePrompt}
          onPress={() => {
            setShowVoicePrompt(false);
            navigation.navigate('Transcription');
          }}
        >
          <Text style={styles.voicePromptText}>🗣️ Voz detectada. Activar Subtítulos</Text>
        </TouchableOpacity>
      )}

      {/* Action Buttons Area */}
      <View style={styles.actionButtonsContainer}>
        <Button title="📡 Conectar" onPress={() => navigation.navigate('Scan')} color="#00FF9D" />
        <Button title="🗣️ Conversar" onPress={() => navigation.navigate('Transcription')} color="#FFD60A" />
        <Button
          title={isDemoRunning ? "⏹️ Detener" : "⚠️ Simular"}
          onPress={handleDemoToggle}
          color={isDemoRunning ? "#FF4444" : "#33b5e5"}
        />
      </View>

      <View style={styles.listContainer}>
        <View style={styles.listHeader}>
          <Text style={styles.subtitle}>Historial Reciente</Text>
        </View>

        {loading && <Text style={styles.info}>Actualizando...</Text>}

        {errorMsg && (
          <Text style={styles.error}>Error: {errorMsg}</Text>
        )}

        <FlatList
          data={detections}
          keyExtractor={(item) => item.id || Math.random().toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      </View>
    </View>
  );
};

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'rojo': return '#FF0055';
    case 'amarillo': return '#FFD60A';
    case 'verde': return '#00FF9D';
    default: return '#fff';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Pure Black
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40, // Status bar padding
    paddingBottom: 10,
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: '#111',
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    color: '#FF0055',
    fontSize: 14,
    fontWeight: '600',
  },
  alertArea: {
    flex: 1, // Takes upper 50% roughly
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#111',
  },
  listeningContainer: {
    alignItems: 'center',
  },
  listeningCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 255, 157, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#00FF9D',
    shadowColor: '#00FF9D',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  listeningIcon: {
    fontSize: 50,
  },
  listeningText: {
    color: '#00FF9D',
    fontSize: 18,
    fontWeight: '500',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 255, 157, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  voicePrompt: {
    backgroundColor: '#FFD60A',
    padding: 15,
    marginHorizontal: 16,
    marginTop: -20,
    marginBottom: 10,
    borderRadius: 8,
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#FFD60A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  voicePromptText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingVertical: 15,
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: '#111',
  },
  listContainer: {
    flex: 1, // Takes lower 50%
    padding: 16,
    backgroundColor: '#000000',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  subtitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  info: {
    color: '#888',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  error: {
    color: '#FF0055',
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#111',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#333',
    borderWidth: 1,
    borderColor: '#222',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  priorityBadge: {
    width: 12,
    height: 12,
    borderRadius: 6,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
  },
  cardTextSmall: {
    color: '#888',
    fontSize: 12,
    marginTop: 6,
  },
});
