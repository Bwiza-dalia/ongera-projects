import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/i18n/locale.dart';

/// Compact EN / RW language toggle with flag emojis — for auth screens.
class LocaleSwitcher extends StatelessWidget {
  const LocaleSwitcher({super.key});

  @override
  Widget build(BuildContext context) {
    final localeController = Get.find<LocaleController>();

    return Obx(() {
      final selected = localeController.locale.value;

      return Container(
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(
          color: AppColors.pureWhite,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppColors.dividerColor),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            for (var i = 0; i < AppLocale.supported.length; i++) ...[
              if (i > 0) const SizedBox(width: 4),
              _LocaleOption(
                appLocale: AppLocale.supported[i],
                selected: selected.code == AppLocale.supported[i].code,
                onTap: () =>
                    localeController.setLocale(AppLocale.supported[i]),
              ),
            ],
          ],
        ),
      );
    });
  }
}

class _LocaleOption extends StatelessWidget {
  const _LocaleOption({
    required this.appLocale,
    required this.selected,
    required this.onTap,
  });

  final AppLocale appLocale;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? AppColors.mintGreenLight : Colors.transparent,
      borderRadius: BorderRadius.circular(8),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(appLocale.flag, style: const TextStyle(fontSize: 16)),
              const SizedBox(width: 6),
              Text(
                appLocale.code.toUpperCase(),
                style: AppText.small.copyWith(
                  fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                  color: selected
                      ? AppColors.navyObsidian
                      : AppColors.mutedText,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
