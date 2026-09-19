import 'package:flutter/material.dart';

import '../../api/api_client.dart';
import '../../auth/auth_scope.dart';
import '../../models/quadrant_map.dart';
import '../../models/task.dart';
import '../../theme/tokens.dart';
import '../../widgets/primitives.dart';
import 'quadrant_selector.dart';

class TaskFormScreen extends StatefulWidget {
  const TaskFormScreen({super.key, this.task});
  final Task? task;

  @override
  State<TaskFormScreen> createState() => _TaskFormScreenState();
}

class _TaskFormScreenState extends State<TaskFormScreen> {
  late final _title = TextEditingController(text: widget.task?.title ?? '');
  late final _description = TextEditingController(text: widget.task?.description ?? '');
  late TaskStatus _status = widget.task?.status ?? TaskStatus.todo;
  late QuadrantCell? _axes =
      widget.task == null ? null : axesOf(widget.task!.quadrant);

  String? _error;
  Map<String, String> _fieldErrors = {};
  bool _pending = false;

  bool get _editing => widget.task != null;

  @override
  void dispose() {
    _title.dispose();
    _description.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_axes == null) {
      setState(() => _fieldErrors = {'priority': 'Pick a priority.'});
      return;
    }
    setState(() {
      _pending = true;
      _error = null;
      _fieldErrors = {};
    });

    // no quadrant field exists on the payload: it is derived server-side from the two axes
    final input = TaskInput(
      title: _title.text.trim(),
      description: _description.text.trim().isEmpty ? null : _description.text.trim(),
      status: _status,
      importance: _axes!.importance,
      urgency: _axes!.urgency,
    );

    final api = AuthScope.of(context).taskApi;
    try {
      if (_editing) {
        await api.update(widget.task!.id, input);
      } else {
        await api.create(input);
      }
      if (mounted) Navigator.of(context).pop(true);
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _fieldErrors = e.fieldErrors;
        _error = e.status == 404 ? 'That task no longer exists.' : e.message;
      });
    } catch (_) {
      if (mounted) setState(() => _error = 'Network error — try again.');
    } finally {
      if (mounted) setState(() => _pending = false);
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
        title: Text(_editing ? 'Edit task' : 'New task',
            style: TextStyle(fontSize: 17, fontWeight: FontWeight.w600, color: c.onPrimary)),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(22, 20, 22, 32),
          children: [
            if (_error != null) ...[
              TasklineAlert(title: _error!),
              const SizedBox(height: 18),
            ],
            TasklineField(
              label: 'Title',
              controller: _title,
              hint: 'Migrate billing service',
              maxLength: 255,
              autofocus: !_editing,
              error: _fieldErrors['title'],
            ),
            const SizedBox(height: 18),
            TasklineField(
              label: 'Description',
              controller: _description,
              hint: 'What does done look like?',
              maxLines: 3,
              maxLength: 5000,
            ),
            const SizedBox(height: 18),
            _StatusPicker(status: _status, onChanged: (v) => setState(() => _status = v)),
            const SizedBox(height: 22),
            QuadrantSelector(
              selected: _axes?.quadrant,
              error: _fieldErrors['priority'],
              onChanged: (cell) => setState(() => _axes = cell),
            ),
            const SizedBox(height: 28),
            TasklineButton(
              label: _editing ? 'Save task' : 'Create task',
              pending: _pending,
              pendingLabel: 'Saving…',
              onPressed: _save,
            ),
            const SizedBox(height: 10),
            TasklineButton(
              label: 'Cancel',
              variant: ButtonVariant.ghost,
              onPressed: _pending ? null : () => Navigator.of(context).pop(false),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatusPicker extends StatelessWidget {
  const _StatusPicker({required this.status, required this.onChanged});

  final TaskStatus status;
  final ValueChanged<TaskStatus> onChanged;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Status',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: c.ink)),
        const SizedBox(height: 8),
        Row(
          children: [
            for (final value in TaskStatus.values) ...[
              Expanded(
                child: GestureDetector(
                  onTap: () => onChanged(value),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 11),
                    margin: EdgeInsets.only(right: value == TaskStatus.done ? 0 : 8),
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: status == value ? c.primary : c.raised,
                      border: Border.all(color: status == value ? c.primary : c.line),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      value.label,
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: status == value ? c.onPrimary : c.muted,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ],
        ),
      ],
    );
  }
}
