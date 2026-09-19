import 'dart:io';

/// Overridden at build time:
///   flutter run --dart-define=API_BASE_URL=https://backend-xyz.run.app
const _configured = String.fromEnvironment('API_BASE_URL');

/// The Android emulator reaches the host machine at 10.0.2.2, never localhost.
String get apiBaseUrl {
  if (_configured.isNotEmpty) return _configured;
  if (Platform.isAndroid) return 'http://10.0.2.2:8080';
  return 'http://localhost:8080';
}
