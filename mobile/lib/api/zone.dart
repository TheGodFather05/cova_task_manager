import 'dart:io';

/// The backend computes period bounds in this zone; without it a daily report is shifted
/// for anyone outside UTC. Falls back to UTC if the platform name is unusable.
String get deviceZone {
  try {
    final name = Platform.environment['TZ'];
    if (name != null && name.contains('/')) return name;
  } catch (_) {
    // environment unavailable on some platforms
  }
  final offset = DateTime.now().timeZoneOffset;
  if (offset == Duration.zero) return 'UTC';
  final sign = offset.isNegative ? '-' : '+';
  final hours = offset.abs().inHours.toString().padLeft(2, '0');
  final minutes = (offset.abs().inMinutes % 60).toString().padLeft(2, '0');
  // an explicit offset the backend's ZoneId.of accepts
  return 'UTC$sign$hours:$minutes';
}
