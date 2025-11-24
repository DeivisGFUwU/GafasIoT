/**
 * @format
 */

import { AppRegistry, LogBox } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// Suppress known warnings from third-party libraries
LogBox.ignoreLogs(['new NativeEventEmitter']);

AppRegistry.registerComponent(appName, () => App);
