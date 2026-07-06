import 'dart:convert';

import 'package:flutter/services.dart';
import 'package:get/get.dart';

import 'locale.dart';

/// Loads UI strings from [assets/i18n] JSON files for GetX `.tr`.
class AppTranslations extends Translations {
  static final Map<String, Map<String, String>> _keys = {};

  static Future<void> load() async {
    for (final lang in AppLocale.supported) {
      _keys[lang.code] = await _readJson('assets/i18n/${lang.code}.json');
    }

    // GetX may use device tags like en_US before bare language codes.
    _keys['en_US'] = _keys['en']!;
    _keys['rw_RW'] = _keys['rw']!;
  }

  static Future<Map<String, String>> _readJson(String path) async {
    final raw = await rootBundle.loadString(path);
    final json = jsonDecode(raw) as Map<String, dynamic>;
    return json.map((key, value) => MapEntry(key, value as String));
  }

  @override
  Map<String, Map<String, String>> get keys => _keys;
}
