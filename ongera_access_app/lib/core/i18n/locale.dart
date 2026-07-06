import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:get_storage/get_storage.dart';

/// Supported app UI languages.
class AppLocale {
  const AppLocale({
    required this.code,
    required this.labelKey,
    required this.flag,
  });

  final String code;
  final String labelKey;
  final String flag;

  static const english = AppLocale(
    code: 'en',
    labelKey: 'locale.en',
    flag: '🇺🇸',
  );

  static const kinyarwanda = AppLocale(
    code: 'rw',
    labelKey: 'locale.rw',
    flag: '🇷🇼',
  );

  static const supported = [english, kinyarwanda];

  static AppLocale fromCode(String? code) {
    return supported.firstWhere(
      (lang) => lang.code == code,
      orElse: () => english,
    );
  }
}

/// Saves and applies the user's language choice for GetX `.tr`.
class LocaleController extends GetxController {
  static const _storageKey = 'app_locale';

  final locale = AppLocale.english.obs;

  @override
  void onInit() {
    super.onInit();
    locale.value = AppLocale.fromCode(GetStorage().read(_storageKey));
    Get.updateLocale(Locale(locale.value.code));
  }

  Future<void> setLocale(AppLocale appLocale) async {
    locale.value = appLocale;
    await Get.updateLocale(Locale(appLocale.code));
    await GetStorage().write(_storageKey, appLocale.code);
  }
}
