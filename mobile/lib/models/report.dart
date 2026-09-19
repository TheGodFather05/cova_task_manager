import 'task.dart';

enum Period { daily, weekly, monthly, yearly }

const periodWire = {
  Period.daily: 'DAILY',
  Period.weekly: 'WEEKLY',
  Period.monthly: 'MONTHLY',
  Period.yearly: 'YEARLY',
};

extension PeriodLabel on Period {
  String get label => switch (this) {
        Period.daily => 'Daily',
        Period.weekly => 'Weekly',
        Period.monthly => 'Monthly',
        Period.yearly => 'Yearly',
      };
}

/// null means undefined, not zero: the backend refuses to state a rate when the denominator
/// is zero, and the UI must not invent one.
class SummaryTotals {
  const SummaryTotals({required this.created, required this.completed, required this.rate});

  final int created;
  final int completed;
  final double? rate;

  factory SummaryTotals.fromJson(Map<String, dynamic> json) => SummaryTotals(
        created: json['tasksCreated'] as int,
        completed: json['tasksCompleted'] as int,
        rate: (json['completionRate'] as num?)?.toDouble(),
      );
}

class SummaryReport {
  const SummaryReport({
    required this.current,
    required this.previous,
    required this.currentPeriodComplete,
    required this.createdPercent,
    required this.completedPercent,
    required this.ratePoints,
  });

  final SummaryTotals current;
  final SummaryTotals previous;

  /// false is the normal case: the running period is compared against a complete one.
  final bool currentPeriodComplete;
  final double? createdPercent;
  final double? completedPercent;
  final double? ratePoints;

  factory SummaryReport.fromJson(Map<String, dynamic> json) {
    final delta = json['delta'] as Map<String, dynamic>;
    return SummaryReport(
      current: SummaryTotals.fromJson(json['current'] as Map<String, dynamic>),
      previous: SummaryTotals.fromJson(json['previous'] as Map<String, dynamic>),
      currentPeriodComplete: json['currentPeriodComplete'] as bool,
      createdPercent: (delta['tasksCreatedPercent'] as num?)?.toDouble(),
      completedPercent: (delta['tasksCompletedPercent'] as num?)?.toDouble(),
      ratePoints: (delta['completionRatePoints'] as num?)?.toDouble(),
    );
  }
}

class TrendPoint {
  const TrendPoint(this.bucket, this.count);
  final DateTime bucket;
  final int count;
}

class TrendReport {
  const TrendReport({required this.bucketUnit, required this.points});

  /// Drives the axis label format; comes from the response, not the requested period.
  final String bucketUnit;
  final List<TrendPoint> points;

  factory TrendReport.fromJson(Map<String, dynamic> json) => TrendReport(
        bucketUnit: json['bucketUnit'] as String,
        points: (json['points'] as List)
            .map((p) => TrendPoint(
                  Task.parseUtc(p['bucket'] as String),
                  p['count'] as int,
                ))
            .toList(),
      );
}

class QuadrantCount {
  const QuadrantCount(this.quadrant, this.count, this.percentage);
  final Quadrant quadrant;
  final int count;
  final double percentage;
}

class QuadrantReport {
  const QuadrantReport({required this.total, required this.quadrants});

  final int total;
  final List<QuadrantCount> quadrants;

  factory QuadrantReport.fromJson(Map<String, dynamic> json) => QuadrantReport(
        total: json['total'] as int,
        quadrants: (json['quadrants'] as List).map((q) {
          final wire = q['quadrant'] as String;
          return QuadrantCount(
            Quadrant.values.firstWhere((v) => quadrantWire(v) == wire),
            q['count'] as int,
            (q['percentage'] as num).toDouble(),
          );
        }).toList(),
      );
}

class StatusCounts {
  const StatusCounts(this.todo, this.inProgress, this.done);
  final int todo;
  final int inProgress;
  final int done;
}
