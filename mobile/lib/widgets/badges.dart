import 'package:flutter/material.dart';
import '../models/task.dart';
import '../theme/tokens.dart';

class StatusBadge extends StatelessWidget {
  const StatusBadge({super.key, required this.status});
  final TaskStatus status;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final (background, foreground) = switch (status) {
      TaskStatus.todo => (c.lineSoft, c.muted),
      TaskStatus.inProgress => (c.accent.withValues(alpha: 0.15), c.accentInk),
      TaskStatus.done => (c.primaryTint, c.primaryDeep),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(color: background, borderRadius: BorderRadius.circular(8)),
      child: Text(status.label,
          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: foreground)),
    );
  }
}

Color quadrantColor(BuildContext context, Quadrant quadrant) {
  final c = context.colors;
  return switch (quadrant) {
    Quadrant.doFirst => c.doFirst,
    Quadrant.schedule => c.schedule,
    Quadrant.delegate => c.delegate,
    Quadrant.drop => c.drop,
  };
}

class QuadrantBadge extends StatelessWidget {
  const QuadrantBadge({super.key, required this.quadrant, this.showAxes = false});

  final Quadrant quadrant;
  final bool showAxes;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: BoxDecoration(
            color: c.surface,
            border: Border.all(color: c.line),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  color: quadrantColor(context, quadrant),
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 8),
              Text(quadrant.label,
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: c.ink)),
            ],
          ),
        ),
        if (showAxes) ...[
          const SizedBox(width: 8),
          Flexible(
            child: Text(quadrant.axes,
                style: TextStyle(fontSize: 12, color: c.muted), overflow: TextOverflow.ellipsis),
          ),
        ],
      ],
    );
  }
}

/// Empty state with the kit's dashed teal illustration box.
class EmptyState extends StatelessWidget {
  const EmptyState({
    super.key,
    required this.title,
    required this.description,
    this.action,
  });

  final String title;
  final String description;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 200,
              height: 130,
              decoration: BoxDecoration(
                color: c.primaryTint,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: c.primary.withValues(alpha: 0.4)),
              ),
              child: Icon(Icons.checklist_rounded, size: 44,
                  color: c.primary.withValues(alpha: 0.55)),
            ),
            const SizedBox(height: 18),
            Text(title,
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600, color: c.ink)),
            const SizedBox(height: 6),
            Text(description,
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 14, color: c.muted)),
            if (action != null) ...[const SizedBox(height: 18), action!],
          ],
        ),
      ),
    );
  }
}
