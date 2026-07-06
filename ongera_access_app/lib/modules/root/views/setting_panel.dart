import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';

import '../../../core/theme/app_colors.dart';

import '../../../routes/app_routes.dart';
import '../widgets/menu.dart';
import 'language_panel.dart';

class SettingsPanel extends StatefulWidget {
  const SettingsPanel({super.key});

  @override
  State<SettingsPanel> createState() => _SettingsPanelState();
}

class _SettingsPanelState extends State<SettingsPanel> {
  bool _showLanguage = false;

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.of(context).size.width;

    return Align(
      alignment: Alignment.centerRight,
      child: Material(
        color: AppColors.pureWhite,
        elevation: 16,
        child: SizedBox(
          width: width * .38,
          height: double.infinity,
          child: _showLanguage
              ? LanguagePanel(
                  onBack: () => setState(() => _showLanguage = false),
                )
              : _MainSettings(
                  onLanguageTap: () => setState(() => _showLanguage = true),
                ),
        ),
      ),
    );
  }
}

class _MainSettings extends StatelessWidget {
  const _MainSettings({required this.onLanguageTap});

  final VoidCallback onLanguageTap;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Expanded(
          child: ListView(
            children: [
              MenuSection(title: 'settings.section_settings'.tr),

              MenuItem(title: 'settings.therapy'.tr, onTap: () {}),
              MenuItem(title: 'settings.audio'.tr, onTap: () {}),
              MenuItem(title: 'settings.language'.tr, onTap: onLanguageTap),

              MenuSection(title: 'settings.section_general'.tr),
              MenuItem(title: 'settings.terms'.tr, onTap: () {}),
              MenuItem(title: 'settings.privacy'.tr, onTap: () {}),

              MenuSection(title: 'settings.section_account'.tr),

              MenuItem(
                title: 'settings.logout'.tr,
                color: AppColors.errorRed,
                onTap: () async {
                  final confirmed = await showDialog<bool>(
                    context: context,
                    builder: (ctx) =>
                        AlertDialog(
                          content: const Text(
                              "Are you sure you want to logout?"),
                          actions: [
                            TextButton(
                              onPressed: () =>
                                  Navigator.of(ctx).pop(false),
                              child: const Text("No"),
                            ),
                            TextButton(
                              onPressed: () =>
                                  Navigator.of(ctx).pop(true),
                              child: const Text("Yes"),
                            ),
                          ],
                        ),
                  );
                  if (confirmed == true) {
                    SystemChrome.setPreferredOrientations([
                      DeviceOrientation.portraitUp,
                      DeviceOrientation.portraitDown,
                    ]);
                    Get.offAllNamed(Routes.LOGIN);
                  }
                },
              ),
            ],
          ),
        ),
      ],
    );
  }
}
