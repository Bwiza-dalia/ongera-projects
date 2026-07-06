import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:get_storage/get_storage.dart';

import '../models/setting_model.dart';

class SettingsService extends GetxService {
  final setting = Setting().obs;

  Future<SettingsService> init() async {
    return this;
  }

  ThemeMode getThemeMode() {
    String? themeMode = GetStorage().read<String>('theme_mode');
    switch (themeMode) {
      case 'ThemeMode.light':
        SystemChrome.setSystemUIOverlayStyle(
          SystemUiOverlayStyle.light.copyWith(
            systemNavigationBarColor: Colors.white,
          ),
        );
        return ThemeMode.light;
      case 'ThemeMode.dark':
        SystemChrome.setSystemUIOverlayStyle(
          SystemUiOverlayStyle.dark.copyWith(
            systemNavigationBarColor: Colors.black87,
          ),
        );
        return ThemeMode.dark;
      case 'ThemeMode.system':
        return ThemeMode.system;
      default:
        if (setting.value.defaultTheme == "dark") {
          SystemChrome.setSystemUIOverlayStyle(
            SystemUiOverlayStyle.dark.copyWith(
              systemNavigationBarColor: Colors.black87,
            ),
          );
          return ThemeMode.dark;
        } else {
          SystemChrome.setSystemUIOverlayStyle(
            SystemUiOverlayStyle.light.copyWith(
              systemNavigationBarColor: Colors.white,
            ),
          );
          return ThemeMode.light;
        }
    }
  }
}
