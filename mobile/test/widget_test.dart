import 'package:flutter_test/flutter_test.dart';
import 'package:taskline/models/quadrant_map.dart';

void main() {
  test('the app exposes a coherent quadrant mapping', () {
    for (final cell in quadrantCells) {
      expect(quadrantOf(cell.importance, cell.urgency), cell.quadrant);
    }
    expect(quadrantCells.length, 4);
  });
}
