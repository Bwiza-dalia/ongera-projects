import 'dart:convert';

import 'package:flutter/services.dart';

import '../../modules/atthemarket/models/vocab_item.dart';

class VocabRepository {
  List<VocabItem>? _cache;

  Future<List<VocabItem>> loadItems() async {
    if (_cache != null) return _cache!;

    final raw = await rootBundle.loadString('assets/data/vocab_items.json');
    final json = jsonDecode(raw) as Map<String, dynamic>;
    final items = (json['items'] as List<dynamic>)
        .map((e) => VocabItem.fromJson(e as Map<String, dynamic>))
        .toList();

    _cache = items;
    return items;
  }
}
