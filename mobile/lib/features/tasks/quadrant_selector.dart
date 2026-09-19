import 'package:flutter/material.dart';

import '../../models/quadrant_map.dart';
import '../../models/task.dart';
import '../../theme/tokens.dart';
import '../../widgets/badges.dart';

/// The grid IS the mapping: a cell is an {importance, urgency} pair, so a contradictory
/// combination cannot be expressed from the UI — the same guarantee the backend makes with
/// two separate enum columns. One tap writes both axes.
class QuadrantSelector extends StatelessWidget {
  const QuadrantSelector({super.key, required this.selected, required this.onChanged, this.error});

  final Quadrant? selected;
  final ValueChanged<QuadrantCell> onChanged;
  final String? error;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Priority',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: c.ink)),
        const SizedBox(height: 4),
        Text('One tap sets both badges.', style: TextStyle(fontSize: 12, color: c.muted)),
        const SizedBox(height: 12),
        Row(
          children: [
            const SizedBox(width: 22),
            Expanded(child: _AxisLabel('URGENT')),
            const SizedBox(width: 10),
            Expanded(child: _AxisLabel('NOT URGENT')),
          ],
        ),
        const SizedBox(height: 8),
        _row(context, 'IMPORTANT', quadrantCells[0], quadrantCells[1]),
        const SizedBox(height: 10),
        _row(context, 'NOT IMPORTANT', quadrantCells[2], quadrantCells[3]),
        const SizedBox(height: 8),
        Text(
          error ?? (selected == null ? 'No priority set yet' : selected!.axes),
          style: TextStyle(fontSize: 12, color: error != null ? c.danger : c.muted),
        ),
      ],
    );
  }

  Widget _row(BuildContext context, String label, QuadrantCell left, QuadrantCell right) {
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SizedBox(width: 22, child: _RowLabel(label)),
          Expanded(child: _Cell(cell: left, selected: selected, onTap: onChanged)),
          const SizedBox(width: 10),
          Expanded(child: _Cell(cell: right, selected: selected, onTap: onChanged)),
        ],
      ),
    );
  }
}

class _AxisLabel extends StatelessWidget {
  const _AxisLabel(this.text);
  final String text;

  @override
  Widget build(BuildContext context) => Text(
        text,
        textAlign: TextAlign.center,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.8,
          color: context.colors.primaryDeep,
        ),
      );
}

class _RowLabel extends StatelessWidget {
  const _RowLabel(this.text);
  final String text;

  @override
  Widget build(BuildContext context) => RotatedBox(
        quarterTurns: 3,
        child: Center(
          child: FittedBox(
            child: Text(
              text,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                letterSpacing: 0.8,
                color: context.colors.primaryDeep,
              ),
            ),
          ),
        ),
      );
}

class _Cell extends StatelessWidget {
  const _Cell({required this.cell, required this.selected, required this.onTap});

  final QuadrantCell cell;
  final Quadrant? selected;
  final ValueChanged<QuadrantCell> onTap;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final isSelected = selected == cell.quadrant;

    return GestureDetector(
      // opaque: the whole cell is the target, including its padding — not just the labels
      behavior: HitTestBehavior.opaque,
      // both axes are written in one call, so no state ever holds half a selection
      onTap: () => onTap(cell),
      child: Container(
        constraints: const BoxConstraints(minHeight: 86),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isSelected ? c.primaryTint : c.surface,
          border: Border.all(color: isSelected ? c.primary : c.line, width: isSelected ? 1.5 : 1),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 10,
                  height: 10,
                  decoration: BoxDecoration(
                    color: quadrantColor(context, cell.quadrant),
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(cell.quadrant.label,
                      style: TextStyle(
                          fontSize: 14, fontWeight: FontWeight.w600, color: c.ink)),
                ),
                if (isSelected) Icon(Icons.check, size: 16, color: c.primary),
              ],
            ),
            const SizedBox(height: 6),
            Text(cell.quadrant.axes, style: TextStyle(fontSize: 11, color: c.muted)),
          ],
        ),
      ),
    );
  }
}
