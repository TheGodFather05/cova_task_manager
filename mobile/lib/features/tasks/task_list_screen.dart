import 'package:flutter/material.dart';

import '../../auth/auth_scope.dart';
import '../../models/task.dart';
import '../../theme/tokens.dart';
import '../../widgets/badges.dart';
import '../../widgets/primitives.dart';
import 'task_card.dart';
import 'task_form_screen.dart';

class TaskListScreen extends StatefulWidget {
  const TaskListScreen({super.key});

  @override
  State<TaskListScreen> createState() => _TaskListScreenState();
}

class _TaskListScreenState extends State<TaskListScreen> {
  TaskStatus? _status;
  TaskPage? _page;
  bool _loading = true;
  String? _error;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_page == null && _error == null) _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      // filtering runs on the server, not over a locally cached list
      final page = await AuthScope.of(context).taskApi.list(size: 50, status: _status);
      if (mounted) setState(() => _page = page);
    } catch (_) {
      if (mounted) setState(() => _error = "Couldn't load tasks");
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _openForm([Task? task]) async {
    final saved = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => TaskFormScreen(task: task)),
    );
    if (saved == true) _load();
  }

  Future<void> _confirmDelete(Task task) async {
    final c = context.colors;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        backgroundColor: c.raised,
        title: Text('Delete this task?',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: c.ink)),
        content: Text('“${task.title}” will be removed. This can’t be undone.',
            style: TextStyle(fontSize: 14, color: c.muted)),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: Text('Cancel', style: TextStyle(color: c.muted)),
          ),
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            child: Text('Delete task', style: TextStyle(color: c.danger)),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted) return;
    try {
      await AuthScope.of(context).taskApi.remove(task.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('“${task.title}” removed.'), backgroundColor: c.primaryDeep),
        );
      }
      _load();
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: const Text('Network error — try again.'), backgroundColor: c.danger),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final auth = AuthScope.of(context);

    return Scaffold(
      backgroundColor: c.ground,
      body: Column(
        children: [
          _Header(onSignOut: auth.signOut),
          _Filters(
            status: _status,
            onChanged: (value) {
              setState(() => _status = value);
              _load();
            },
          ),
          Expanded(child: _body()),
        ],
      ),
      // 60x60 with an 18px radius, per the kit: a rounded square, not a circle
      floatingActionButton: SizedBox(
        width: 60,
        height: 60,
        child: FloatingActionButton(
          onPressed: () => _openForm(),
          backgroundColor: c.accent,
          foregroundColor: Colors.white,
          elevation: 6,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
          child: const Icon(Icons.add, size: 30),
        ),
      ),
    );
  }

  Widget _body() {
    final c = context.colors;

    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(22),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TasklineAlert(
                  title: _error!, detail: 'Check your connection and retry.'),
              const SizedBox(height: 16),
              TasklineButton(
                label: 'Retry',
                variant: ButtonVariant.ghost,
                expand: false,
                onPressed: _load,
              ),
            ],
          ),
        ),
      );
    }

    if (_loading && _page == null) {
      return const Center(child: CircularProgressIndicator());
    }

    final tasks = _page?.content ?? const <Task>[];
    if (tasks.isEmpty) {
      return EmptyState(
        title: 'No tasks yet',
        description: _status == null
            ? "Add your first task and it'll show up here."
            : 'No task matches this filter.',
        action: _status == null
            ? TasklineButton(
                label: 'Add a task',
                variant: ButtonVariant.accent,
                expand: false,
                onPressed: () => _openForm(),
              )
            : null,
      );
    }

    return RefreshIndicator(
      onRefresh: _load,
      color: c.primary,
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(18, 4, 18, 96),
        itemCount: tasks.length,
        itemBuilder: (_, index) => TaskCard(
          task: tasks[index],
          onTap: () => _openForm(tasks[index]),
          onDelete: () => _confirmDelete(tasks[index]),
        ),
      ),
    );
  }
}

/// Teal header from the kit's mobile screens: stacked, 14/22/18 padding.
class _Header extends StatelessWidget {
  const _Header({required this.onSignOut});
  final Future<void> Function() onSignOut;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Container(
      width: double.infinity,
      color: c.primary,
      padding: EdgeInsets.fromLTRB(22, MediaQuery.of(context).padding.top + 14, 22, 18),
      child: Row(
        children: [
          Text('My tasks',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600, color: c.onPrimary)),
          const Spacer(),
          GestureDetector(
            onTap: onSignOut,
            child: Text('Log out',
                style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: c.onPrimary.withValues(alpha: 0.85))),
          ),
        ],
      ),
    );
  }
}

class _Filters extends StatelessWidget {
  const _Filters({required this.status, required this.onChanged});

  final TaskStatus? status;
  final ValueChanged<TaskStatus?> onChanged;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 58,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
        children: [
          TasklineChip(label: 'All', active: status == null, onTap: () => onChanged(null)),
          for (final value in TaskStatus.values) ...[
            const SizedBox(width: 8),
            TasklineChip(
              label: value.label,
              active: status == value,
              onTap: () => onChanged(status == value ? null : value),
            ),
          ],
        ],
      ),
    );
  }
}
