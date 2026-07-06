import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../core/theme/app_colors.dart';
import '../../root/views/setting_panel.dart';
import '../../widgets/top_action.dart';

/// Top bar for the At the Market session — back, title, actions.
class AtTheMarketAppBar extends StatelessWidget implements PreferredSizeWidget {
  const AtTheMarketAppBar({super.key});

  @override
  Size get preferredSize => const Size.fromHeight(60);

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.pureWhite,
      child: SafeArea(
        bottom: false,
        child: Container(
          height: preferredSize.height,
          padding: const EdgeInsets.symmetric(horizontal: 8),
          decoration: const BoxDecoration(
            border: Border(
              bottom: BorderSide(color: AppColors.dividerColor, width: 1.2),
            ),
          ),
          child: Row(
            children: [
              InkWell(
                onTap: Get.back,
                borderRadius: BorderRadius.circular(10),
                child: const Icon(
                  Icons.arrow_back_rounded,
                  size: 22,
                  color: AppColors.navyObsidian,
                ),
              ),
              const SizedBox(width: 12),
              const Expanded(
                flex: 4,
                child: Text(
                  'At the Market',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: AppColors.navyObsidian,
                    letterSpacing: -0.2,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                flex: 6,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TopAction(
                      icon: Icons.show_chart,
                      label: 'My Progress',
                      onTap: () {
                        debugPrint('Settings clicked');
                      },
                    ),
                    const VerticalDivider(
                      width: 1,
                      thickness: 1,
                      indent: 12,
                      endIndent: 12,
                    ),
                    TopAction(
                      icon: Icons.settings_outlined,
                      label: 'Settings',
                      onTap: () {
                        showGeneralDialog(
                          context: context,
                          barrierDismissible: true,
                          barrierLabel: 'Settings',
                          barrierColor: AppColors.scrim,
                          transitionDuration: const Duration(milliseconds: 300),
                          pageBuilder: (_, _, _) {
                            return const SettingsPanel();
                          },
                          transitionBuilder: (_, animation, _, child) {
                            return SlideTransition(
                              position:
                                  Tween(begin: const Offset(1, 0), end: Offset.zero)
                                      .animate(
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
                    const VerticalDivider(
                      width: 1,
                      thickness: 1,
                      indent: 12,
                      endIndent: 12,
                    ),
                    TopAction(
                      icon: Icons.help_outline,
                      label: 'Help',
                      onTap: () {
                        debugPrint('Help clicked');
                      },
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
