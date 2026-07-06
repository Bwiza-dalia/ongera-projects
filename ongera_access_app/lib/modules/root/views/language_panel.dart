import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../core/i18n/locale.dart';
import '../../../core/theme/app_colors.dart';

/// Language picker — English and Kinyarwanda with flag icons.
class LanguagePanel extends StatelessWidget {
  const LanguagePanel({super.key, required this.onBack});

  final VoidCallback onBack;

  @override
  Widget build(BuildContext context) {
    final localeController = Get.find<LocaleController>();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _LanguageHeader(onBack: onBack),
        Expanded(
          child: Obx(() {
            final selected = localeController.locale.value;

            return ListView(
              children: [
                for (final appLocale in AppLocale.supported)
                  _LanguageTile(
                    flag: appLocale.flag,
                    label: appLocale.labelKey.tr,
                    selected: selected.code == appLocale.code,
                    onTap: () => localeController.setLocale(appLocale),
                  ),
              ],
            );
          }),
        ),
      ],
    );
  }
}

class _LanguageHeader extends StatelessWidget {
  const _LanguageHeader({required this.onBack});

  final VoidCallback onBack;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(8, 12, 16, 12),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: AppColors.dividerColor)),
      ),
      child: Row(
        children: [
          IconButton(
            onPressed: onBack,
            icon: const Icon(Icons.arrow_back_rounded),
            color: AppColors.navyObsidian,
          ),
          Expanded(
            child: Text(
              'settings.language_title'.tr,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppColors.navyObsidian,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _LanguageTile extends StatelessWidget {
  const _LanguageTile({
    required this.flag,
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String flag;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Text(flag, style: const TextStyle(fontSize: 28)),
      title: Text(
        label,
        style: TextStyle(
          fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
          color: AppColors.navyObsidian,
        ),
      ),
      trailing: selected
          ? const Icon(Icons.check_circle, color: AppColors.mintGreen)
          : null,
      onTap: onTap,
    );
  }
}
