import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:get_storage/get_storage.dart';
import 'package:ongera_access_app/core/i18n/app_translations.dart';
import 'package:ongera_access_app/core/i18n/locale.dart';
import 'package:ongera_access_app/routes/app_pages.dart';
import 'package:ongera_access_app/services/settings_service.dart';
import 'core/theme/app_theme.dart';

Future<void> initServices() async {
  Get.log('starting services ...');
  await GetStorage.init();
  await AppTranslations.load();
  await Get.putAsync(() => SettingsService().init());
  Get.put(LocaleController());
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Auth screens are portrait; the controller switches to landscape on login.
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  await initServices();

  final localeController = Get.find<LocaleController>();

  runApp(
    Obx(
      () => GetMaterialApp(
        title: 'Ongera Access',
        theme: AppTheme.light,
        darkTheme: AppTheme.dark,
        translations: AppTranslations(),
        locale: Locale(localeController.locale.value.code),
        fallbackLocale: const Locale('en'),
        getPages: AppPages.routes,
        debugShowCheckedModeBanner: false,
        defaultTransition: Transition.cupertino,
        initialRoute: AppPages.INITIAL,
        themeMode: Get.find<SettingsService>().getThemeMode(),
      ),
    ),
  );
}
