import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../widgets/menu.dart';

class HelpPanel extends StatelessWidget {
  const HelpPanel({super.key});

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
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(
                child: ListView(
                  children: [
                    MenuSection(title: 'help.section_emergency'.tr),
                    _sosButton(context),
                    _contactItem(
                      icon: Icons.local_hospital_rounded,
                      iconColor: AppColors.errorRed,
                      title: 'help.contact_doctor'.tr,
                      onTap: () {},
                    ),
                    _contactItem(
                      icon: Icons.people_rounded,
                      iconColor: AppColors.therapyBlue,
                      title: 'help.alert_caregiver'.tr,
                      onTap: () {},
                    ),
                    MenuSection(title: 'help.section_using_app'.tr),
                    MenuItem(
                      title: 'help.how_to_exercises'.tr,
                      onTap: () {},
                    ),
                    MenuItem(
                      title: 'help.understanding_progress'.tr,
                      onTap: () {},
                    ),
                    MenuSection(title: 'help.section_support'.tr),
                    MenuItem(
                      title: 'settings.feedback'.tr,
                      onTap: () {},
                    ),
                    MenuItem(
                      title: 'help.report_problem'.tr,
                      onTap: () {},
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

  Widget _sosButton(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
      child: Material(
        color: AppColors.errorRed,
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          onTap: () => _showSosConfirm(context),
          borderRadius: BorderRadius.circular(14),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: AppColors.pureWhite.withValues(alpha: 0.2),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.phone_rounded,
                    color: AppColors.pureWhite,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'help.emergency_call_title'.tr,
                        style: AppText.body.copyWith(color: AppColors.pureWhite),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'help.emergency_call_subtitle'.tr,
                        style: AppText.label.copyWith(color: AppColors.pureWhite),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showSosConfirm(BuildContext context) {
    showDialog<void>(
      context: context,
      builder: (_) => AlertDialog(
        title: Text('help.emergency_confirm_title'.tr),
        content: Text('help.emergency_confirm_body'.tr),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('common.cancel'.tr),
          ),
          FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.errorRed,
            ),
            onPressed: () {
              Navigator.pop(context);
              // TODO: launch tel:112 via url_launcher
            },
            child: Text('help.emergency_call_action'.tr),
          ),
        ],
      ),
    );
  }

  Widget _contactItem({
    required IconData icon,
    required Color iconColor,
    required String title,
    required VoidCallback onTap,
  }) {
    return ListTile(
      leading: Container(
        width: 38,
        height: 38,
        decoration: BoxDecoration(
          color: iconColor.withValues(alpha: 0.12),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: iconColor, size: 20),
      ),
      title: Text(
        title,
        style: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: AppColors.navyObsidian,
        ),
      ),
      trailing: const Icon(Icons.chevron_right, color: AppColors.mutedText),
      onTap: onTap,
    );
  }
}
