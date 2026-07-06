class VocabItem {
  const VocabItem({
    required this.id,
    required this.word,
    required this.englishTranslation,
    required this.semanticHint,
    required this.phonemicHint,
    required this.syllableBreakdown,
    required this.imageUrl,
    this.audioModelUrl = '',
    this.difficultyLevel = 1,
    this.distractorIds = const [],
  });

  final String id;
  final String word;
  final String englishTranslation;
  final String semanticHint;
  final String phonemicHint;
  final String syllableBreakdown;
  final String audioModelUrl;
  final String imageUrl;
  final int difficultyLevel;
  final List<String> distractorIds;

  factory VocabItem.fromJson(Map<String, dynamic> json) {
    return VocabItem(
      id: json['id'] as String,
      word: json['word'] as String,
      englishTranslation: json['english_translation'] as String,
      semanticHint: json['semantic_hint'] as String,
      phonemicHint: json['phonemic_hint'] as String,
      syllableBreakdown: json['syllable_breakdown'] as String,
      audioModelUrl: json['audio_model_url'] as String? ?? '',
      imageUrl: json['image_url'] as String,
      difficultyLevel: json['difficulty_level'] as int? ?? 1,
      distractorIds: (json['distractor_ids'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const [],
    );
  }
}
