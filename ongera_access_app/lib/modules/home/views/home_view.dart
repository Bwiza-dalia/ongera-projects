import 'package:flutter/material.dart';
import 'package:flutter_tabler_icons/flutter_tabler_icons.dart';
import 'package:get/get.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../models/therapy_module_model.dart';
import '../../../routes/app_routes.dart';
import '../../widgets/assiged_modules.dart';
import '../../widgets/practice_streak.dart';
import '../widgets/progress_bar.dart';
import '../widgets/stat_item.dart';

class HomeView extends StatelessWidget {
  const HomeView({super.key});

  String _greeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'home.greeting_morning'.tr;
    if (hour < 17) return 'home.greeting_afternoon'.tr;
    if (hour < 21) return 'home.greeting_evening'.tr;
    return 'home.greeting_night'.tr;
  }

  List<TherapyModule> _therapyModules() => [
    TherapyModule(
      title: 'home.module_speech'.tr,
      icon: Icons.mic_none_rounded,
      iconColor: AppColors.speechCoral,
      backgroundColor: AppColors.speechCoralLight,
    ),
    TherapyModule(
      title: 'home.module_cognitive'.tr,
      icon: TablerIcons.brain,
      iconColor: AppColors.therapyBlue,
      backgroundColor: AppColors.therapyBlueLight,
    ),
    TherapyModule(
      title: 'home.module_motion'.tr,
      icon: Icons.directions_walk_rounded,
      iconColor: AppColors.motionViolet,
      backgroundColor: AppColors.motionVioletLight,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Stack(
        children: [
          Align(
            alignment: Alignment.bottomCenter,
            child: SizedBox(
              height: double.infinity,
              child: Image.asset(
                'assets/images/home_guide.png',
                fit: BoxFit.contain,
                alignment: Alignment.bottomCenter,
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              children: [
                Expanded(
                  flex: 4,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'home.greeting_name'.trParams({
                          'greeting': _greeting(),
                          'name': 'Fils',
                        }),
                        style: AppText.heading1,
                      ),
                      const SizedBox(height: 4),
                      Text('home.welcome_back'.tr, style: AppText.body),
                      const SizedBox(height: 20),
                      PracticeStreakCard(
                        streakCount: 3,
                        currentWeek: 4,
                        days: buildSampleWeek(),
                      ),
                      const Spacer(),
                      Text('home.motivation_quote'.tr, style: AppText.heading2),
                      const Spacer(),
                    ],
                  ),
                ),
                const Expanded(flex: 3, child: SizedBox.shrink()),
                Expanded(
                  flex: 4,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      AssignedModule(
                        doctorName: 'Dr. Amanda',
                        modules: _therapyModules(),
                      ),
                      const Spacer(),
                      Text(
                        'home.plan_ready'.trParams({'doctor': 'Dr. Amanda'}),
                        style: AppText.heading3,
                      ),
                      const Spacer(),
                      SizedBox(
                        width: double.infinity,
                        height: 60,
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.mintGreen,
                            foregroundColor: Colors.white,
                            elevation: 2,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          onPressed: () => Get.toNamed(Routes.COMPREHEND),
                          // onPressed: () => Get.toNamed(Routes.ATTHEMARKET),
                          child: Text('home.start'.tr, style: AppText.heading1),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
