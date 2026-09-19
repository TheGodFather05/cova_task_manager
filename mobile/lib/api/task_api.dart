import '../models/task.dart';
import 'api_client.dart';

class TaskApi {
  TaskApi(this._client);
  final ApiClient _client;

  /// Filtering, search and pagination run on the server: the app never downloads the whole
  /// list to narrow it locally.
  Future<Page<Task>> list({
    int page = 0,
    int size = 20,
    TaskStatus? status,
    Quadrant? quadrant,
    String? search,
  }) async {
    final json = await _client.request('GET', '/api/tasks', query: {
      'page': '$page',
      'size': '$size',
      if (status != null) 'status': statusWire(status),
      if (quadrant != null) 'quadrant': quadrantWire(quadrant),
      if (search != null && search.isNotEmpty) 'search': search,
    }) as Map<String, dynamic>;

    return Page<Task>(
      content: (json['content'] as List)
          .map((t) => Task.fromJson(t as Map<String, dynamic>))
          .toList(),
      totalElements: json['totalElements'] as int,
      totalPages: json['totalPages'] as int,
      number: json['number'] as int,
    );
  }

  Future<Task> create(TaskInput input) async =>
      Task.fromJson(await _client.request('POST', '/api/tasks', body: input.toJson())
          as Map<String, dynamic>);

  Future<Task> update(int id, TaskInput input) async =>
      Task.fromJson(await _client.request('PUT', '/api/tasks/$id', body: input.toJson())
          as Map<String, dynamic>);

  Future<void> remove(int id) => _client.request('DELETE', '/api/tasks/$id');

  /// The API has no status-count endpoint, so the status chart reads totalElements from a
  /// one-row page per status rather than counting a fully loaded list.
  Future<int> countByStatus(TaskStatus status) async {
    final page = await list(size: 1, status: status);
    return page.totalElements;
  }
}
