import 'package:flutter/material.dart';

import '../../models/report.dart';
import '../../models/task.dart';
import '../../theme/tokens.dart';
import '../../widgets/badges.dart';

/// Trend line drawn with a CustomPainter: the same shape as the web app's inline SVG,
/// with a flat baseline when every bucket is zero rather than a division by zero.
class TrendChart extends StatelessWidget {
  const TrendChart({super.key, required this.points});
  final List<TrendPoint> points;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    if (points.isEmpty) {
      return _ChartEmpty(message: 'Nothing to plot yet.');
    }
    return SizedBox(
      height: 150,
      child: CustomPaint(
        size: Size.infinite,
        painter: _TrendPainter(
          counts: points.map((p) => p.count).toList(),
          line: c.primary,
          fill: c.primary.withValues(alpha: 0.15),
        ),
      ),
    );
  }
}

class _TrendPainter extends CustomPainter {
  _TrendPainter({required this.counts, required this.line, required this.fill});

  final List<int> counts;
  final Color line;
  final Color fill;

  @override
  void paint(Canvas canvas, Size size) {
    if (counts.isEmpty) return;

    // floor the maximum at 1 so an all-zero series sits flat instead of dividing by zero
    final maxCount = counts.fold<int>(1, (a, b) => b > a ? b : a);
    final stepX = counts.length == 1 ? 0.0 : size.width / (counts.length - 1);

    final path = Path();
    for (var i = 0; i < counts.length; i++) {
      final x = counts.length == 1 ? size.width / 2 : i * stepX;
      final y = size.height - (counts[i] / maxCount) * size.height;
      if (i == 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    }

    final area = Path.from(path)
      ..lineTo(counts.length == 1 ? size.width / 2 : (counts.length - 1) * stepX, size.height)
      ..lineTo(counts.length == 1 ? size.width / 2 : 0, size.height)
      ..close();

    canvas.drawPath(area, Paint()..color = fill);
    canvas.drawPath(
      path,
      Paint()
        ..color = line
        ..strokeWidth = 2
        ..style = PaintingStyle.stroke
        ..strokeCap = StrokeCap.round
        ..strokeJoin = StrokeJoin.round,
    );
  }

  @override
  bool shouldRepaint(_TrendPainter oldDelegate) => oldDelegate.counts != counts;
}

/// Bars scaled to the tallest value, not to the share of the total: four equal quadrants
/// must fill the track rather than each showing a quarter.
class QuadrantBars extends StatelessWidget {
  const QuadrantBars({super.key, required this.report});
  final QuadrantReport report;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    if (report.total == 0) {
      return const _ChartEmpty(message: 'Nothing completed in this period.');
    }
    final maxCount = report.quadrants.fold<int>(1, (a, q) => q.count > a ? q.count : a);

    return SizedBox(
      height: 160,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          for (final q in report.quadrants)
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 6),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    Text('${q.count}',
                        style: TextStyle(
                            fontSize: 12, fontWeight: FontWeight.w600, color: c.ink)),
                    const SizedBox(height: 6),
                    Container(
                      height: (q.count / maxCount) * 96,
                      decoration: BoxDecoration(
                        color: quadrantColor(context, q.quadrant),
                        borderRadius: const BorderRadius.vertical(top: Radius.circular(8)),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(q.quadrant.label,
                        textAlign: TextAlign.center,
                        maxLines: 2,
                        style: TextStyle(fontSize: 11, color: c.muted)),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}

/// Donut drawn as arcs. A zero total renders an empty ring rather than a solid colour
/// implying a 100% share that does not exist.
class QuadrantDonut extends StatelessWidget {
  const QuadrantDonut({super.key, required this.report});
  final QuadrantReport report;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    if (report.total == 0) {
      return const _ChartEmpty(message: 'No open tasks right now.');
    }

    return Row(
      children: [
        SizedBox(
          width: 120,
          height: 120,
          child: CustomPaint(
            painter: _DonutPainter(
              slices: [
                for (final q in report.quadrants)
                  (q.count.toDouble(), quadrantColor(context, q.quadrant)),
              ],
              hole: c.surface,
            ),
            child: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text('${report.total}',
                      style: TextStyle(
                          fontSize: 20, fontWeight: FontWeight.w600, color: c.ink)),
                  Text('open', style: TextStyle(fontSize: 11, color: c.muted)),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(width: 18),
        Expanded(
          child: Column(
            children: [
              for (final q in report.quadrants)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 3),
                  child: Row(
                    children: [
                      Container(
                        width: 9,
                        height: 9,
                        decoration: BoxDecoration(
                          color: quadrantColor(context, q.quadrant),
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(q.quadrant.label,
                            style: TextStyle(fontSize: 12, color: c.ink)),
                      ),
                      Text('${q.count}',
                          style: TextStyle(
                              fontSize: 12, fontWeight: FontWeight.w600, color: c.ink)),
                    ],
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }
}

class _DonutPainter extends CustomPainter {
  _DonutPainter({required this.slices, required this.hole});

  final List<(double, Color)> slices;
  final Color hole;

  @override
  void paint(Canvas canvas, Size size) {
    final total = slices.fold<double>(0, (sum, s) => sum + s.$1);
    if (total <= 0) return;

    final rect = Rect.fromLTWH(0, 0, size.width, size.height);
    var start = -90 * 3.1415926535 / 180;

    for (final (value, color) in slices) {
      if (value <= 0) continue;
      final sweep = (value / total) * 2 * 3.1415926535;
      canvas.drawArc(rect, start, sweep, true, Paint()..color = color);
      start += sweep;
    }

    canvas.drawCircle(
      Offset(size.width / 2, size.height / 2),
      size.width * 0.3,
      Paint()..color = hole,
    );
  }

  @override
  bool shouldRepaint(_DonutPainter oldDelegate) => true;
}

class StatusBars extends StatelessWidget {
  const StatusBars({super.key, required this.counts});
  final StatusCounts counts;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final values = [
      (TaskStatus.todo, counts.todo, c.drop),
      (TaskStatus.inProgress, counts.inProgress, c.accent),
      (TaskStatus.done, counts.done, c.primary),
    ];
    final total = values.fold<int>(0, (sum, v) => sum + v.$2);
    if (total == 0) return const _ChartEmpty(message: 'No tasks yet.');

    final maxCount = values.fold<int>(1, (a, v) => v.$2 > a ? v.$2 : a);

    return Column(
      children: [
        for (final (status, count, color) in values)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 5),
            child: Row(
              children: [
                SizedBox(
                  width: 82,
                  child: Text(status.label, style: TextStyle(fontSize: 12, color: c.muted)),
                ),
                Expanded(
                  child: Stack(
                    children: [
                      Container(
                        height: 22,
                        decoration: BoxDecoration(
                          color: c.lineSoft,
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      FractionallySizedBox(
                        widthFactor: count / maxCount,
                        child: Container(
                          height: 22,
                          decoration: BoxDecoration(
                            color: color,
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                SizedBox(
                  width: 34,
                  child: Text('$count',
                      textAlign: TextAlign.right,
                      style: TextStyle(
                          fontSize: 12, fontWeight: FontWeight.w600, color: c.ink)),
                ),
              ],
            ),
          ),
      ],
    );
  }
}

class _ChartEmpty extends StatelessWidget {
  const _ChartEmpty({required this.message});
  final String message;

  @override
  Widget build(BuildContext context) => SizedBox(
        height: 120,
        child: Center(
          child: Text(message,
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 12, color: context.colors.faint)),
        ),
      );
}
