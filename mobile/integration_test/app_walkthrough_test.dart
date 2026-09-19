import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:taskline/main.dart';

/// Drives the real app against the real backend, the way a person would.
void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('sign in, see tasks, open the form, reach reports', (tester) async {
    await tester.pumpWidget(const TasklineApp());
    await tester.pumpAndSettle(const Duration(seconds: 3));

    // the login screen is the entry point for a signed-out app
    expect(find.text('Sign in to Taskline'), findsOneWidget);

    await tester.enterText(find.byType(TextField).first, 'phone@example.com');
    await tester.enterText(find.byType(TextField).last, 'password123');
    await tester.pumpAndSettle();

    await tester.tap(find.text('Sign in'));
    await tester.pumpAndSettle(const Duration(seconds: 6));

    // the seeded tasks must be listed, with their derived quadrant badges
    expect(find.text('My tasks'), findsOneWidget);
    expect(find.text('Migrate billing service to v2 API'), findsOneWidget);
    expect(find.text('Do first'), findsWidgets);

    // the 2x2 selector, reached through the FAB
    await tester.tap(find.byType(FloatingActionButton));
    await tester.pumpAndSettle(const Duration(seconds: 2));
    expect(find.text('One tap sets both badges.'), findsOneWidget);
    expect(find.text('No priority set yet'), findsOneWidget);

    // one tap writes both axes
    await tester.tap(find.text('Schedule').last);
    await tester.pumpAndSettle();
    expect(find.text('Important · Not urgent'), findsWidgets);

    await tester.tap(find.text('Cancel'));
    await tester.pumpAndSettle(const Duration(seconds: 2));

    // reports
    await tester.tap(find.byIcon(Icons.insights_outlined));
    await tester.pumpAndSettle(const Duration(seconds: 8));
    expect(find.text('Reports'), findsWidgets);
    expect(find.text('COMPLETION RATE'), findsOneWidget);
  });
}
