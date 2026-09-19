import 'package:flutter/material.dart';
import '../theme/tokens.dart';

/// Primary action. Orange is reserved for the one thing the user is invited to do.
class TasklineButton extends StatelessWidget {
  const TasklineButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.variant = ButtonVariant.primary,
    this.pending = false,
    this.pendingLabel,
    this.expand = true,
  });

  final String label;
  final VoidCallback? onPressed;
  final ButtonVariant variant;
  final bool pending;
  final String? pendingLabel;
  final bool expand;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final (background, foreground, border) = switch (variant) {
      ButtonVariant.primary => (c.primary, c.onPrimary, null),
      ButtonVariant.accent => (c.accent, Colors.white, null),
      ButtonVariant.ghost => (Colors.transparent, c.muted, c.line),
      ButtonVariant.danger => (c.danger, Colors.white, null),
    };
    final disabled = pending || onPressed == null;

    return SizedBox(
      width: expand ? double.infinity : null,
      child: FilledButton(
        onPressed: disabled ? null : onPressed,
        style: FilledButton.styleFrom(
          backgroundColor: background,
          foregroundColor: foreground,
          disabledBackgroundColor: background.withValues(alpha: 0.4),
          disabledForegroundColor: foreground.withValues(alpha: 0.7),
          padding: const EdgeInsets.symmetric(vertical: 15, horizontal: 20),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
            side: border == null ? BorderSide.none : BorderSide(color: border),
          ),
          textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
        ),
        child: pending
            ? Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  SizedBox(
                    width: 15,
                    height: 15,
                    child: CircularProgressIndicator(strokeWidth: 2, color: foreground),
                  ),
                  const SizedBox(width: 10),
                  Text(pendingLabel ?? label),
                ],
              )
            : Text(label),
      ),
    );
  }
}

enum ButtonVariant { primary, accent, ghost, danger }

class TasklineField extends StatelessWidget {
  const TasklineField({
    super.key,
    required this.label,
    required this.controller,
    this.error,
    this.obscure = false,
    this.keyboardType,
    this.maxLines = 1,
    this.maxLength,
    this.hint,
    this.autofocus = false,
    this.onChanged,
  });

  final String label;
  final TextEditingController controller;
  final String? error;
  final bool obscure;
  final TextInputType? keyboardType;
  final int maxLines;
  final int? maxLength;
  final String? hint;
  final bool autofocus;
  final ValueChanged<String>? onChanged;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: c.ink)),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          obscureText: obscure,
          keyboardType: keyboardType,
          maxLines: obscure ? 1 : maxLines,
          maxLength: maxLength,
          autofocus: autofocus,
          onChanged: onChanged,
          style: TextStyle(fontSize: 14, color: c.ink),
          decoration: InputDecoration(
            hintText: hint,
            counterText: '',
            hintStyle: TextStyle(color: c.faint),
            filled: true,
            fillColor: c.raised,
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
            enabledBorder: _border(error != null ? c.danger : c.line),
            focusedBorder: _border(error != null ? c.danger : c.primary, width: 1.6),
            errorText: error,
            errorStyle: TextStyle(fontSize: 12, color: c.danger),
          ),
        ),
      ],
    );
  }

  OutlineInputBorder _border(Color color, {double width = 1}) => OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: BorderSide(color: color, width: width),
      );
}

/// Error banner with the kit's 7px dot.
class TasklineAlert extends StatelessWidget {
  const TasklineAlert({super.key, required this.title, this.detail});

  final String title;
  final String? detail;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: c.dangerTint.withValues(alpha: 0.5),
        border: Border.all(color: c.danger.withValues(alpha: 0.5)),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            margin: const EdgeInsets.only(top: 6),
            width: 7,
            height: 7,
            decoration: BoxDecoration(color: c.danger, shape: BoxShape.circle),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: c.ink)),
                if (detail != null)
                  Text(detail!, style: TextStyle(fontSize: 12, color: c.muted)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Filter pill: teal when active, outlined otherwise.
class TasklineChip extends StatelessWidget {
  const TasklineChip({
    super.key,
    required this.label,
    required this.active,
    required this.onTap,
  });

  final String label;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
        decoration: BoxDecoration(
          color: active ? c.primary : c.raised,
          border: Border.all(color: active ? c.primary : c.line),
          borderRadius: BorderRadius.circular(999),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: active ? c.onPrimary : c.muted,
          ),
        ),
      ),
    );
  }
}
