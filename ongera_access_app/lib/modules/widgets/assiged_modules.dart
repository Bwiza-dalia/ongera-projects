import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';
import '../../models/therapy_module_model.dart';

class AssignedModule extends StatelessWidget {
  final List<TherapyModule> modules;
  final String doctorName;

  const AssignedModule({
    super.key,
    required this.modules,
    required this.doctorName,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.end,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          'home.assigned_modules'.trParams({'doctor': doctorName}),
          style: AppText.body,
        ),
        const SizedBox(height: 16),
        // Row containing the dynamic modules
        Wrap(
          spacing: 24, // Clear horizontal spacing to avoid mis-taps
          runSpacing: 16, // Vertical spacing if wrapping on narrow screens
          alignment: WrapAlignment.start,
          children: modules
              .map(
                (module) => Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 50,
                      height: 50,
                      decoration: BoxDecoration(
                        color: module.backgroundColor,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.08),
                            blurRadius: 8,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      padding: const EdgeInsets.all(12),
                      child: Icon(
                        module.icon,
                        size: 24,
                        color: module.iconColor,
                      ),
                    ),
                    const SizedBox(height: 8),
                    // Large, highly scannable font style
                    Text(module.title, style: AppText.small),
                  ],
                ),
              )
              .toList(),
        ),
      ],
    );
  }
}
