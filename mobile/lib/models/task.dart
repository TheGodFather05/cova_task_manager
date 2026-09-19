enum TaskStatus { todo, inProgress, done }

enum Importance { important, notImportant }

enum Urgency { urgent, notUrgent }

enum Quadrant { doFirst, schedule, delegate, drop }

const _statusWire = {
  TaskStatus.todo: 'TODO',
  TaskStatus.inProgress: 'IN_PROGRESS',
  TaskStatus.done: 'DONE',
};

const _importanceWire = {
  Importance.important: 'IMPORTANT',
  Importance.notImportant: 'NOT_IMPORTANT',
};

const _urgencyWire = {Urgency.urgent: 'URGENT', Urgency.notUrgent: 'NOT_URGENT'};

const _quadrantWire = {
  Quadrant.doFirst: 'DO_FIRST',
  Quadrant.schedule: 'SCHEDULE',
  Quadrant.delegate: 'DELEGATE',
  Quadrant.drop: 'DROP',
};

T _fromWire<T>(Map<T, String> wire, String value) =>
    wire.entries.firstWhere((e) => e.value == value).key;

String statusWire(TaskStatus v) => _statusWire[v]!;
String importanceWire(Importance v) => _importanceWire[v]!;
String urgencyWire(Urgency v) => _urgencyWire[v]!;
String quadrantWire(Quadrant v) => _quadrantWire[v]!;

extension TaskStatusLabel on TaskStatus {
  String get label => switch (this) {
        TaskStatus.todo => 'To Do',
        TaskStatus.inProgress => 'In Progress',
        TaskStatus.done => 'Done',
      };
}

extension QuadrantLabel on Quadrant {
  String get label => switch (this) {
        Quadrant.doFirst => 'Do first',
        Quadrant.schedule => 'Schedule',
        Quadrant.delegate => 'Delegate',
        Quadrant.drop => 'Drop',
      };

  String get axes => switch (this) {
        Quadrant.doFirst => 'Important · Urgent',
        Quadrant.schedule => 'Important · Not urgent',
        Quadrant.delegate => 'Not important · Urgent',
        Quadrant.drop => 'Not important · Not urgent',
      };
}

/// Mirrors TaskResponse. Timestamps arrive as UTC wall-clock strings without an offset.
class Task {
  const Task({
    required this.id,
    required this.title,
    required this.description,
    required this.status,
    required this.importance,
    required this.urgency,
    required this.quadrant,
    required this.completedAt,
    required this.createdAt,
    required this.updatedAt,
  });

  final int id;
  final String title;
  final String? description;
  final TaskStatus status;
  final Importance importance;
  final Urgency urgency;
  final Quadrant quadrant;
  final DateTime? completedAt;
  final DateTime createdAt;
  final DateTime updatedAt;

  /// The API serializes task timestamps without a zone marker, so DateTime.parse would read
  /// them as local time — an hour out in WAT, a day out near midnight. Append the Z first.
  static DateTime parseUtc(String value) {
    final hasZone = RegExp(r'(Z|[+-]\d{2}:?\d{2})$', caseSensitive: false).hasMatch(value);
    return DateTime.parse(hasZone ? value : '${value}Z').toLocal();
  }

  factory Task.fromJson(Map<String, dynamic> json) => Task(
        id: json['id'] as int,
        title: json['title'] as String,
        description: json['description'] as String?,
        status: _fromWire(_statusWire, json['status'] as String),
        importance: _fromWire(_importanceWire, json['importance'] as String),
        urgency: _fromWire(_urgencyWire, json['urgency'] as String),
        quadrant: _fromWire(_quadrantWire, json['quadrant'] as String),
        completedAt: json['completedAt'] == null
            ? null
            : parseUtc(json['completedAt'] as String),
        createdAt: parseUtc(json['createdAt'] as String),
        updatedAt: parseUtc(json['updatedAt'] as String),
      );
}

/// Mirrors TaskRequest. There is deliberately no quadrant field: it is derived server-side
/// from the two axes and never accepted on write.
class TaskInput {
  const TaskInput({
    required this.title,
    required this.description,
    required this.status,
    required this.importance,
    required this.urgency,
  });

  final String title;
  final String? description;
  final TaskStatus status;
  final Importance importance;
  final Urgency urgency;

  Map<String, dynamic> toJson() => {
        'title': title,
        'description': description,
        'status': statusWire(status),
        'importance': importanceWire(importance),
        'urgency': urgencyWire(urgency),
      };
}

class Page<T> {
  const Page({
    required this.content,
    required this.totalElements,
    required this.totalPages,
    required this.number,
  });

  final List<T> content;
  final int totalElements;
  final int totalPages;
  final int number;
}
