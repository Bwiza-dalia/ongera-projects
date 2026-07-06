/// Cueing ladder steps revealed one at a time via Hint; all shown steps stay visible.
enum CueLevel {
  none,
  semantic,
  phonemic,
  syllable,
  fullModel,
}

extension CueLevelX on CueLevel {
  int get stepNumber => index;

  String get title => switch (this) {
        CueLevel.none => '',
        CueLevel.semantic => 'Semantic',
        CueLevel.phonemic => 'Phonemic',
        CueLevel.syllable => 'Syllable',
        CueLevel.fullModel => 'Full model',
      };

  CueLevel? get next {
    if (this == CueLevel.fullModel) return null;
    return CueLevel.values[index + 1];
  }
}
