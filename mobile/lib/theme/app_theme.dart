import 'package:flutter/material.dart';
import 'tokens.dart';

/// Type scale from the kit: display 30/600, heading 20/600, body 15/500, secondary 14/400.
ThemeData _build(TasklineColors c, Brightness brightness) {
  final base = ThemeData(brightness: brightness, useMaterial3: true);

  return base.copyWith(
    scaffoldBackgroundColor: c.ground,
    colorScheme: ColorScheme.fromSeed(
      seedColor: c.primary,
      brightness: brightness,
      surface: c.surface,
    ),
    extensions: [c],
    textTheme: base.textTheme.copyWith(
      displaySmall: TextStyle(fontSize: 30, fontWeight: FontWeight.w600, color: c.ink),
      headlineSmall: TextStyle(fontSize: 20, fontWeight: FontWeight.w600, color: c.ink),
      bodyLarge: TextStyle(fontSize: 15, fontWeight: FontWeight.w500, color: c.ink),
      bodyMedium: TextStyle(fontSize: 14, color: c.muted),
      bodySmall: TextStyle(fontSize: 12, color: c.muted),
    ),
  );
}

ThemeData get lightTheme => _build(TasklineColors.light, Brightness.light);
ThemeData get darkTheme => _build(TasklineColors.dark, Brightness.dark);
