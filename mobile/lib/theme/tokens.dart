import 'package:flutter/material.dart';

/// Design tokens from the Taskline UI kit, identical to the web app's palette.
/// Only the semantic layer differs between themes; the quadrant colours carry meaning
/// and stay recognisable in both.
class TasklineColors extends ThemeExtension<TasklineColors> {
  const TasklineColors({
    required this.ground,
    required this.surface,
    required this.raised,
    required this.line,
    required this.lineSoft,
    required this.ink,
    required this.muted,
    required this.faint,
    required this.primary,
    required this.primaryDeep,
    required this.primaryTint,
    required this.onPrimary,
    required this.accent,
    required this.accentInk,
    required this.danger,
    required this.dangerTint,
    required this.doFirst,
    required this.schedule,
    required this.delegate,
    required this.drop,
    required this.heat,
  });

  final Color ground;
  final Color surface;
  final Color raised;
  final Color line;
  final Color lineSoft;
  final Color ink;
  final Color muted;
  final Color faint;
  final Color primary;
  final Color primaryDeep;
  final Color primaryTint;
  final Color onPrimary;

  /// Orange appears only where the user is meant to act.
  final Color accent;
  final Color accentInk;
  final Color danger;
  final Color dangerTint;

  final Color doFirst;
  final Color schedule;
  final Color delegate;
  final Color drop;

  /// Five heatmap steps, index 0 meaning no activity.
  final List<Color> heat;

  static const light = TasklineColors(
    ground: Color(0xFFEFEFEB),
    surface: Color(0xFFFAFAF8),
    raised: Color(0xFFFFFFFF),
    line: Color(0xFFE5E7EB),
    lineSoft: Color(0xFFEEF0F1),
    ink: Color(0xFF26383A),
    muted: Color(0xFF6B7280),
    faint: Color(0xFF9CA3AF),
    primary: Color(0xFF17878A),
    primaryDeep: Color(0xFF0E5F61),
    primaryTint: Color(0xFFE6F2F2),
    onPrimary: Color(0xFFFFFFFF),
    accent: Color(0xFFF26A21),
    accentInk: Color(0xFFB4500F),
    danger: Color(0xFFDC2626),
    dangerTint: Color(0xFFFEE2E2),
    doFirst: Color(0xFFF26A21),
    schedule: Color(0xFF0E5F61),
    delegate: Color(0xFFD9A21B),
    drop: Color(0xFF9CA3AF),
    heat: [
      Color(0xFFEEF0F1),
      Color(0xFFDCEFEF),
      Color(0xFFD6ECEC),
      Color(0xFF9CC6C6),
      Color(0xFF17878A),
    ],
  );

  /// The teal lightens because the light teal fails contrast on a dark surface;
  /// the orange keeps its exact hue because it signals action, not identity.
  static const dark = TasklineColors(
    ground: Color(0xFF0F1A1B),
    surface: Color(0xFF16292A),
    raised: Color(0xFF1C3536),
    line: Color(0xFF2C4849),
    lineSoft: Color(0xFF24403F),
    ink: Color(0xFFE8F1F0),
    muted: Color(0xFF9FB1B1),
    faint: Color(0xFF7A8E8E),
    primary: Color(0xFF5FC3C4),
    primaryDeep: Color(0xFF2FA8AB),
    primaryTint: Color(0xFF1C3536),
    onPrimary: Color(0xFF0F1A1B),
    accent: Color(0xFFF26A21),
    accentInk: Color(0xFFF26A21),
    danger: Color(0xFF9B3B3B),
    dangerTint: Color(0xFF3C1E1E),
    doFirst: Color(0xFFF26A21),
    schedule: Color(0xFF2FA8AB),
    delegate: Color(0xFFD9A21B),
    drop: Color(0xFF7A8E8E),
    heat: [
      Color(0xFF182828),
      Color(0xFF1B3E3F),
      Color(0xFF1E6062),
      Color(0xFF2A9B9D),
      Color(0xFF5FC3C4),
    ],
  );

  @override
  ThemeExtension<TasklineColors> copyWith() => this;

  @override
  ThemeExtension<TasklineColors> lerp(ThemeExtension<TasklineColors>? other, double t) => this;
}

extension TasklineTheme on BuildContext {
  TasklineColors get colors => Theme.of(this).extension<TasklineColors>()!;
}
