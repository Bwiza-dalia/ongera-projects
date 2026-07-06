import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ongera_access_app/core/theme/app_theme.dart';
import 'package:ongera_access_app/modules/widgets/top_action.dart';

import '../../core/theme/app_colors.dart';
import '../root/views/help_panel.dart';
import '../root/views/setting_panel.dart';

class ModuleAppBar extends StatelessWidget implements PreferredSizeWidget {
  const ModuleAppBar({
    super.key,
    required this.title,
    this.hideProgress = false,
    this.hideSettings = false,
    this.hideHelp = false,
    this.actions,
  });

  final String title;
  final bool hideProgress, hideSettings, hideHelp;
  final List<Widget>? actions;

  @override
  Size get preferredSize => const Size.fromHeight(60);

  @override
  Widget build(BuildContext context) {
    return AppBar(
      title: Text(title, style: AppText.heading2),
      actions: [
        ...?actions,
        if (!hideProgress)
        TopAction(
          icon: Icons.show_chart,
          label: 'app_bar.my_progress'.tr,
          onTap: () {
            debugPrint('Settings clicked');
          },
        ),
        if (!hideSettings)
        VerticalDivider(width: 1, thickness: 1, indent: 12, endIndent: 12),
        if (!hideSettings)
        TopAction(
          icon: Icons.settings_outlined,
          label: 'app_bar.settings'.tr,
          onTap: () {
            showGeneralDialog(
              context: context,
              barrierDismissible: true,
              barrierLabel: 'app_bar.settings'.tr,
              barrierColor: AppColors.scrim,
              transitionDuration: const Duration(milliseconds: 300),
              pageBuilder: (_, __, ___) {
                return const SettingsPanel();
              },
              transitionBuilder: (_, animation, __, child) {
                return SlideTransition(
                  position: Tween(
                    begin: const Offset(1, 0),
                    end: Offset.zero,
                  ).animate(
                    CurvedAnimation(
                      parent: animation,
                      curve: Curves.easeOut,
                    ),
                  ),
                  child: child,
                );
              },
            );
          },
        ),
        if (!hideHelp)
        VerticalDivider(width: 1, thickness: 1, indent: 12, endIndent: 12),
        if (!hideHelp)
        TopAction(
          icon: Icons.help_outline,
          label: 'app_bar.help'.tr,
          onTap: () {
            showGeneralDialog(
              context: context,
              barrierDismissible: true,
              barrierLabel: 'app_bar.help'.tr,
              barrierColor: AppColors.scrim,
              transitionDuration: const Duration(milliseconds: 300),
              pageBuilder: (_, __, ___) => const HelpPanel(),
              transitionBuilder: (_, animation, __, child) {
                return SlideTransition(
                  position: Tween(
                    begin: const Offset(1, 0),
                    end: Offset.zero,
                  ).animate(
                    CurvedAnimation(
                      parent: animation,
                      curve: Curves.easeOut,
                    ),
                  ),
                  child: child,
                );
              },
            );
          },
        )
      ],
    );
  }
}
