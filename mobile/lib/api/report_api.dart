import '../models/report.dart';
import '../models/task.dart';
import 'api_client.dart';
import 'zone.dart';
import 'task_api.dart';

class ReportApi {
  ReportApi(this._client, this._tasks);
  final ApiClient _client;
  final TaskApi _tasks;


  Future<SummaryReport> summary(Period period) async => SummaryReport.fromJson(
      await _client.request('GET', '/api/reports/summary',
          query: {'period': periodWire[period]!, 'zone': deviceZone}) as Map<String, dynamic>);

  Future<TrendReport> trend(Period period) async => TrendReport.fromJson(
      await _client.request('GET', '/api/reports/trend',
          query: {'period': periodWire[period]!, 'zone': deviceZone}) as Map<String, dynamic>);

  Future<QuadrantReport> quadrants(Period period) async => QuadrantReport.fromJson(
      await _client.request('GET', '/api/reports/quadrants',
          query: {'period': periodWire[period]!, 'zone': deviceZone}) as Map<String, dynamic>);

  Future<QuadrantReport> distribution() async => QuadrantReport.fromJson(
      await _client.request('GET', '/api/reports/distribution') as Map<String, dynamic>);

  Future<StatusCounts> statusCounts() async {
    // independent calls, so they go out together rather than in sequence
    final counts = await Future.wait([
      _tasks.countByStatus(TaskStatus.todo),
      _tasks.countByStatus(TaskStatus.inProgress),
      _tasks.countByStatus(TaskStatus.done),
    ]);
    return StatusCounts(counts[0], counts[1], counts[2]);
  }
}
