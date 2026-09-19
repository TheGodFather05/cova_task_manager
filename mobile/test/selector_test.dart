import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:taskline/features/tasks/quadrant_selector.dart';
import 'package:taskline/models/quadrant_map.dart';
import 'package:taskline/models/task.dart';
import 'package:taskline/theme/app_theme.dart';

/// Does tapping a cell actually report both axes? Isolated from the rest of the app.
void main() {
  testWidgets('one tap on a cell reports both axes', (tester) async {
    QuadrantCell? received;
    Quadrant? selected;

    await tester.pumpWidget(
      MaterialApp(
        theme: lightTheme,
        home: StatefulBuilder(
          builder: (context, setState) => Scaffold(
            body: QuadrantSelector(
              selected: selected,
              onChanged: (cell) => setState(() {
                received = cell;
                selected = cell.quadrant;
              }),
            ),
          ),
        ),
      ),
    );

    expect(find.text('No priority set yet'), findsOneWidget);

    await tester.tap(find.text('Schedule'));
    await tester.pumpAndSettle();

    expect(received, isNotNull, reason: 'the tap must reach onChanged');
    expect(received!.importance, Importance.important);
    expect(received!.urgency, Urgency.notUrgent);
    expect(find.text('No priority set yet'), findsNothing);
  });
}
