import 'task.dart';

/// One table, both directions — the mirror of Quadrant.java and the web app's quadrant.ts.
///
/// A cell IS an {importance, urgency} pair, so a contradictory combination is not
/// representable from the UI. Layout from the kit: urgency across, importance down.
///
///              URGENT      NOT_URGENT
///   IMPORTANT  Do first    Schedule
///   NOT_IMP.   Delegate    Drop
class QuadrantCell {
  const QuadrantCell(this.quadrant, this.importance, this.urgency);

  final Quadrant quadrant;
  final Importance importance;
  final Urgency urgency;
}

const quadrantCells = <QuadrantCell>[
  QuadrantCell(Quadrant.doFirst, Importance.important, Urgency.urgent),
  QuadrantCell(Quadrant.schedule, Importance.important, Urgency.notUrgent),
  QuadrantCell(Quadrant.delegate, Importance.notImportant, Urgency.urgent),
  QuadrantCell(Quadrant.drop, Importance.notImportant, Urgency.notUrgent),
];

Quadrant quadrantOf(Importance importance, Urgency urgency) => quadrantCells
    .firstWhere((c) => c.importance == importance && c.urgency == urgency)
    .quadrant;

QuadrantCell axesOf(Quadrant quadrant) =>
    quadrantCells.firstWhere((c) => c.quadrant == quadrant);
