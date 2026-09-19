import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:taskline/models/quadrant_map.dart';
import 'package:taskline/models/task.dart';

/// Exercises the real API the way the app will, without Flutter bindings.
/// Skipped automatically when no backend is listening.
void main() {
  const base = 'http://localhost:8080';
  final client = http.Client();

  Future<bool> backendUp() async {
    try {
      await client.get(Uri.parse('$base/api/tasks')).timeout(const Duration(seconds: 2));
      return true;
    } catch (_) {
      return false;
    }
  }

  test('mobile auth returns a refresh token the app can store', () async {
    if (!await backendUp()) return;

    final email = 'dart-${DateTime.now().microsecondsSinceEpoch}@example.com';
    final registered = await client.post(
      Uri.parse('$base/api/auth/register'),
      headers: {'Content-Type': 'application/json', 'X-Client': 'mobile'},
      body: jsonEncode({'email': email, 'password': 'password123'}),
    );
    expect(registered.statusCode, 201);

    final auth = jsonDecode(registered.body) as Map<String, dynamic>;
    expect(auth['token'], isNotNull);
    expect(auth['refreshToken'], isNotNull, reason: 'mobile needs this: no cookie jar');

    // a task round-trip through the real contract
    final created = await client.post(
      Uri.parse('$base/api/tasks'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ${auth['token']}',
      },
      body: jsonEncode(const TaskInput(
        title: 'From the Dart client',
        description: null,
        status: TaskStatus.todo,
        importance: Importance.important,
        urgency: Urgency.urgent,
      ).toJson()),
    );
    expect(created.statusCode, 201);

    final task = Task.fromJson(jsonDecode(created.body) as Map<String, dynamic>);
    expect(task.quadrant, Quadrant.doFirst, reason: 'derived server-side from the two axes');
    expect(jsonDecode(created.body).containsKey('quadrant'), isTrue);

    // the payload we sent must not have contained a quadrant
    expect(
      const TaskInput(
        title: 't',
        description: null,
        status: TaskStatus.todo,
        importance: Importance.important,
        urgency: Urgency.urgent,
      ).toJson().containsKey('quadrant'),
      isFalse,
      reason: 'quadrant is derived, never written',
    );
  });

  group('quadrant mapping mirrors the backend enum', () {
    test('maps both directions for all four', () {
      expect(quadrantOf(Importance.important, Urgency.urgent), Quadrant.doFirst);
      expect(quadrantOf(Importance.important, Urgency.notUrgent), Quadrant.schedule);
      expect(quadrantOf(Importance.notImportant, Urgency.urgent), Quadrant.delegate);
      expect(quadrantOf(Importance.notImportant, Urgency.notUrgent), Quadrant.drop);

      for (final q in Quadrant.values) {
        final cell = axesOf(q);
        expect(quadrantOf(cell.importance, cell.urgency), q);
      }
    });
  });

  group('parseUtc', () {
    test('reads a bare task timestamp as UTC, not local time', () {
      final parsed = Task.parseUtc('2026-09-17T18:58:40.935');
      expect(parsed.toUtc().toIso8601String(), startsWith('2026-09-17T18:58:40.935'));
    });

    test('leaves an explicit marker alone', () {
      expect(
        Task.parseUtc('2026-09-17T00:00:00Z').toUtc().hour,
        Task.parseUtc('2026-09-17T00:00:00').toUtc().hour,
      );
    });
  });
}
