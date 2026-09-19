import 'package:flutter/material.dart';

import '../../auth/auth_scope.dart';
import '../../models/report.dart';
import '../../theme/tokens.dart';
import '../../widgets/primitives.dart';
import 'charts.dart';

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> {
  Period _period = Period.weekly;

  SummaryReport? _summary;
  TrendReport? _trend;
  QuadrantReport? _quadrants;
  QuadrantReport? _distribution;
  StatusCounts? _statusCounts;

  bool _loading = true;
  String? _error;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_summary == null && _error == null) _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    final api = AuthScope.of(context).reportApi;
    try {
      // independent sources, so they go out together rather than in sequence
      final results = await Future.wait([
        api.summary(_period),
        api.trend(_period),
        api.quadrants(_period),
        api.distribution(),
        api.statusCounts(),
      ]);
      if (!mounted) return;
      setState(() {
        _summary = results[0] as SummaryReport;
        _trend = results[1] as TrendReport;
        _quadrants = results[2] as QuadrantReport;
        _distribution = results[3] as QuadrantReport;
        _statusCounts = results[4] as StatusCounts;
      });
    } catch (_) {
      if (mounted) setState(() => _error = "Couldn't load reports");
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = context.colors;

    return Scaffold(
      backgroundColor: c.ground,
      appBar: AppBar(
        backgroundColor: c.primary,
        foregroundColor: c.onPrimary,
        elevation: 0,
        title: Text('Reports',
            style: TextStyle(fontSize: 17, fontWeight: FontWeight.w600, color: c.onPrimary)),
      ),
      body: SafeArea(
        child: Column(
          children: [
            _PeriodSelector(
              period: _period,
              onChanged: (value) {
                setState(() => _period = value);
                _load();
              },
            ),
            Expanded(child: _body()),
          ],
        ),
      ),
    );
  }

  Widget _body() {
    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(22),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TasklineAlert(title: _error!, detail: 'Check your connection and retry.'),
              const SizedBox(height: 16),
              TasklineButton(
                  label: 'Retry',
                  variant: ButtonVariant.ghost,
                  expand: false,
                  onPressed: _load),
            ],
          ),
        ),
      );
    }

    if (_summary == null) {
      return const Center(child: CircularProgressIndicator());
    }

    final summary = _summary!;
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(18, 8, 18, 28),
        children: [
          if (!summary.currentPeriodComplete)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Text(
                'This period is still in progress, so it is compared against a complete one.',
                style: TextStyle(fontSize: 12, color: context.colors.muted),
              ),
            ),
          Row(
            children: [
              Expanded(
                child: _Metric(
                  label: 'CREATED',
                  value: '${summary.current.created}',
                  delta: summary.createdPercent,
                  suffix: '%',
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _Metric(
                  label: 'COMPLETED',
                  value: '${summary.current.completed}',
                  delta: summary.completedPercent,
                  suffix: '%',
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _Metric(
                  // null means undefined, not zero: the API refused to state a rate
                  label: 'COMPLETION RATE',
                  value: summary.current.rate == null
                      ? '—'
                      : '${summary.current.rate!.toStringAsFixed(1)}%',
                  delta: summary.ratePoints,
                  suffix: ' pts',
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _Metric(
                  label: 'OPEN NOW',
                  value: '${_distribution?.total ?? 0}',
                  delta: null,
                  suffix: '',
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _Card(
            title: 'Completion trend',
            caption: 'Completed per ${_trend?.bucketUnit.toLowerCase() ?? "period"}',
            child: TrendChart(points: _trend?.points ?? const []),
          ),
          const SizedBox(height: 12),
          _Card(
            title: 'Completed by quadrant',
            caption: 'Where the period actually went',
            child: _quadrants == null
                ? const SizedBox.shrink()
                : QuadrantBars(report: _quadrants!),
          ),
          const SizedBox(height: 12),
          _Card(
            title: 'Open tasks by quadrant',
            caption: 'As of now',
            child: _distribution == null
                ? const SizedBox.shrink()
                : QuadrantDonut(report: _distribution!),
          ),
          const SizedBox(height: 12),
          _Card(
            title: 'Tasks by status',
            caption: 'Disjoint sets, not funnel stages',
            child: _statusCounts == null
                ? const SizedBox.shrink()
                : StatusBars(counts: _statusCounts!),
          ),
          if (_loading) const Padding(
            padding: EdgeInsets.only(top: 16),
            child: Center(child: CircularProgressIndicator()),
          ),
        ],
      ),
    );
  }
}

class _PeriodSelector extends StatelessWidget {
  const _PeriodSelector({required this.period, required this.onChanged});

  final Period period;
  final ValueChanged<Period> onChanged;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Container(
      margin: const EdgeInsets.fromLTRB(18, 12, 18, 6),
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: c.primaryTint,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          for (final value in Period.values)
            Expanded(
              child: GestureDetector(
                onTap: () => onChanged(value),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 9),
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: period == value ? c.primary : Colors.transparent,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    value.label,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: period == value ? c.onPrimary : c.primaryDeep,
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _Metric extends StatelessWidget {
  const _Metric({
    required this.label,
    required this.value,
    required this.delta,
    required this.suffix,
  });

  final String label;
  final String value;
  final double? delta;
  final String suffix;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    // an em dash, never 0: the backend declined to state this
    final deltaText = delta == null
        ? '—'
        : '${delta! > 0 ? '+' : ''}${delta!.toStringAsFixed(1)}$suffix';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: c.surface,
        border: Border.all(color: c.line),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label,
              style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.6,
                  color: c.muted)),
          const SizedBox(height: 8),
          Text(value,
              style: TextStyle(
                  fontSize: 26, fontWeight: FontWeight.w600, color: c.primaryDeep)),
          const SizedBox(height: 6),
          Text(deltaText, style: TextStyle(fontSize: 11, color: c.muted)),
        ],
      ),
    );
  }
}

class _Card extends StatelessWidget {
  const _Card({required this.title, required this.caption, required this.child});

  final String title;
  final String caption;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: c.surface,
        border: Border.all(color: c.line),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title,
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: c.ink)),
          const SizedBox(height: 2),
          Text(caption, style: TextStyle(fontSize: 11, color: c.muted)),
          const SizedBox(height: 14),
          child,
        ],
      ),
    );
  }
}
