import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../controllers/register_controller.dart';
import '../widgets/auth_widgets.dart';
import '../widgets/locale_switcher.dart';

// ─── Doctor model ─────────────────────────────────────────────────────────────

class DoctorOption {
  final String id;
  final String name;
  final String specialty;
  final String affiliation;
  final String? imagePath;
  final bool isAI;

  const DoctorOption({
    required this.id,
    required this.name,
    required this.specialty,
    required this.affiliation,
    this.imagePath,
    this.isAI = false,
  });
}

const _doctors = [
  DoctorOption(
    id: 'ai_doctor',
    name: 'OngeraAccess AI',
    specialty: 'AI-powered therapy assistant',
    affiliation: 'OngeraAccess Platform',
    isAI: true,
  ),
  DoctorOption(
    id: 'd1',
    name: 'Dr. Sarah Mitchell',
    specialty: 'Speech & Language Pathologist',
    affiliation: 'CMU Medical School',
    imagePath: 'assets/images/doctors/doctor_1.png',
  ),
  DoctorOption(
    id: 'd2',
    name: 'Dr. James Okonkwo',
    specialty: 'Neurologist',
    affiliation: 'Harvard Military Hospital',
    imagePath: 'assets/images/doctors/doctor_2.png',
  ),
  DoctorOption(
    id: 'd3',
    name: 'Dr. Emily Carter',
    specialty: 'Occupational Therapist',
    affiliation: 'Johns Hopkins Medical Center',
    imagePath: 'assets/images/doctors/doctor_3.png',
  ),
  DoctorOption(
    id: 'd4',
    name: 'Dr. Amara Diallo',
    specialty: 'Rehabilitation Specialist',
    affiliation: 'Stanford Health Care',
  ),
  DoctorOption(
    id: 'd5',
    name: 'Dr. Kevin Tran',
    specialty: 'Physical Therapist',
    affiliation: 'Mayo Clinic',
  ),
  DoctorOption(
    id: 'd6',
    name: 'Dr. Olivia Nakamura',
    specialty: 'Cognitive Behavioral Therapist',
    affiliation: 'UCLA Medical Center',
  ),
];

// ─── Main view ────────────────────────────────────────────────────────────────

class RegisterFlowView extends GetView<RegisterController> {
  const RegisterFlowView({super.key});

  static const _totalSteps = 4;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.cloudGray,
      body: SafeArea(
        child: Column(
          children: [
            _TopBar(controller: controller),
            Expanded(
              child: PageView(
                controller: controller.pageController,
                physics: const NeverScrollableScrollPhysics(),
                children: [
                  _Step1PersonalInfo(controller: controller),
                  _Step2Account(controller: controller),
                  _Step3SelectDoctor(controller: controller),
                  _Step4Caregiver(controller: controller),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Top bar with back + step indicator ──────────────────────────────────────

class _TopBar extends StatelessWidget {
  const _TopBar({required this.controller});
  final RegisterController controller;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
      child: Obx(() {
        final step = controller.currentStep.value;
        return Row(
          children: [
            GestureDetector(
              onTap: () {
                if (step == 0) {
                  Get.back();
                } else {
                  controller.previousPage();
                }
              },
              child: const Icon(
                Icons.chevron_left_rounded,
                size: 32,
                color: AppColors.navyObsidian,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Row(
                children: List.generate(RegisterFlowView._totalSteps, (i) {
                  final active = i == step;
                  final done = i < step;
                  return Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 3),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 300),
                        height: 4,
                        decoration: BoxDecoration(
                          color: (active || done)
                              ? AppColors.mintGreen
                              : AppColors.dividerColor,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),
                  );
                }),
              ),
            ),
            const SizedBox(width: 12),
            const LocaleSwitcher(),
          ],
        );
      }),
    );
  }
}

// ─── Step 1: Personal info ────────────────────────────────────────────────────

class _Step1PersonalInfo extends StatelessWidget {
  const _Step1PersonalInfo({required this.controller});
  final RegisterController controller;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(24, 32, 24, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const AppLogo(),
          const SizedBox(height: 8),
          Text(
            'Let\'s get to know you',
            textAlign: TextAlign.center,
            style: AppText.body.copyWith(color: AppColors.mutedText),
          ),
          const SizedBox(height: 36),

          Text('First name', style: AppText.label),
          const SizedBox(height: 8),
          AuthTextField(
            controller: controller.firstNameController,
            hint: 'Enter your first name',
            keyboardType: TextInputType.name,
          ),
          const SizedBox(height: 20),

          Text('Last name', style: AppText.label),
          const SizedBox(height: 8),
          AuthTextField(
            controller: controller.lastNameController,
            hint: 'Enter your last name',
            keyboardType: TextInputType.name,
          ),
          const SizedBox(height: 24),

          Text('Date of birth', style: AppText.label),
          const SizedBox(height: 8),
          Obx(() {
            final dob = controller.dobText.value;
            return GestureDetector(
              onTap: () => controller.pickDob(context),
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 16,
                ),
                decoration: BoxDecoration(
                  color: AppColors.pureWhite,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.dividerColor),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        dob.isEmpty ? 'DD / MM / YYYY' : dob,
                        style: AppText.body.copyWith(
                          color: dob.isEmpty
                              ? AppColors.placeholderText
                              : AppColors.navyObsidian,
                        ),
                      ),
                    ),
                    const Icon(
                      Icons.calendar_today_outlined,
                      size: 20,
                      color: AppColors.mutedText,
                    ),
                  ],
                ),
              ),
            );
          }),

          const SizedBox(height: 48),

          GetBuilder<RegisterController>(
            builder: (c) => FilledButton(
              onPressed: c.canProceedStep1 ? c.nextPage : null,
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.mintGreen,
                disabledBackgroundColor: AppColors.dividerColor,
                foregroundColor: AppColors.navyObsidian,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: Text(
                'Next',
                style: AppText.body.copyWith(fontWeight: FontWeight.w700),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Step 2: Account ──────────────────────────────────────────────────────────

class _Step2Account extends StatelessWidget {
  const _Step2Account({required this.controller});
  final RegisterController controller;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(24, 32, 24, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const AppLogo(),
          const SizedBox(height: 8),
          Text(
            'Create your account',
            textAlign: TextAlign.center,
            style: AppText.body.copyWith(color: AppColors.mutedText),
          ),
          const SizedBox(height: 36),

          Text('Email address', style: AppText.label),
          const SizedBox(height: 8),
          AuthTextField(
            controller: controller.emailController,
            hint: 'you@example.com',
            keyboardType: TextInputType.emailAddress,
          ),
          const SizedBox(height: 24),

          Text('Password', style: AppText.label),
          const SizedBox(height: 8),
          Obx(() => AuthTextField(
                controller: controller.passwordController,
                hint: 'Min. 6 characters',
                obscure: !controller.passwordVisible.value,
                suffix: GestureDetector(
                  onTap: controller.togglePasswordVisibility,
                  child: Icon(
                    controller.passwordVisible.value
                        ? Icons.visibility_off_outlined
                        : Icons.visibility_outlined,
                    size: 20,
                    color: AppColors.mutedText,
                  ),
                ),
              )),

          const SizedBox(height: 48),

          Obx(() => controller.isLoading.value
              ? const Center(
                  child: CircularProgressIndicator(
                    color: AppColors.mintGreen,
                  ),
                )
              : GetBuilder<RegisterController>(
                  builder: (c) => FilledButton(
                    onPressed: c.canProceedStep2 ? c.register : null,
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.mintGreen,
                      disabledBackgroundColor: AppColors.dividerColor,
                      foregroundColor: AppColors.navyObsidian,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: Text(
                      'Register',
                      style:
                          AppText.body.copyWith(fontWeight: FontWeight.w700),
                    ),
                  ),
                )),
        ],
      ),
    );
  }
}

// ─── Step 3: Select doctor ────────────────────────────────────────────────────

class _Step3SelectDoctor extends StatelessWidget {
  const _Step3SelectDoctor({required this.controller});
  final RegisterController controller;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(24, 32, 24, 0),
          child: Column(
            children: [
              Text(
                'Select your doctor',
                textAlign: TextAlign.center,
                style: AppText.heading2.copyWith(
                  color: AppColors.navyObsidian,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'Choose who will guide your therapy',
                textAlign: TextAlign.center,
                style: AppText.body.copyWith(color: AppColors.mutedText),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),

        Expanded(
          child: Obx(() {
            final selected = controller.selectedDoctorId.value;
            return ListView.separated(
              padding: const EdgeInsets.fromLTRB(24, 0, 24, 16),
              itemCount: _doctors.length,
              separatorBuilder: (_, x) => const SizedBox(height: 10),
              itemBuilder: (_, i) {
                final doc = _doctors[i];
                final isSelected = selected == doc.id;
                return _DoctorCard(
                  doctor: doc,
                  isSelected: isSelected,
                  onTap: () => controller.selectedDoctorId.value = doc.id,
                );
              },
            );
          }),
        ),

        Padding(
          padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
          child: FilledButton(
            onPressed: controller.nextPage,
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.mintGreen,
              foregroundColor: AppColors.navyObsidian,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: Text(
              'Next',
              style: AppText.body.copyWith(fontWeight: FontWeight.w700),
            ),
          ),
        ),
      ],
    );
  }
}

class _DoctorCard extends StatelessWidget {
  const _DoctorCard({
    required this.doctor,
    required this.isSelected,
    required this.onTap,
  });

  final DoctorOption doctor;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.pureWhite,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isSelected ? AppColors.mintGreen : AppColors.dividerColor,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            _Avatar(doctor: doctor),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    doctor.name,
                    style: AppText.body.copyWith(
                      fontWeight: FontWeight.w700,
                      color: AppColors.navyObsidian,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    doctor.specialty,
                    style: AppText.small.copyWith(color: AppColors.mutedText),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(
                        Icons.business_outlined,
                        size: 12,
                        color: AppColors.placeholderText,
                      ),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          doctor.affiliation,
                          style: AppText.small.copyWith(
                            fontSize: 11,
                            color: AppColors.placeholderText,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: 22,
              height: 22,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isSelected ? AppColors.mintGreen : Colors.transparent,
                border: Border.all(
                  color: isSelected
                      ? AppColors.mintGreen
                      : AppColors.borderStrong,
                  width: 2,
                ),
              ),
              child: isSelected
                  ? const Icon(Icons.check, size: 14, color: AppColors.navyObsidian)
                  : null,
            ),
          ],
        ),
      ),
    );
  }
}

class _Avatar extends StatelessWidget {
  const _Avatar({required this.doctor});
  final DoctorOption doctor;

  @override
  Widget build(BuildContext context) {
    if (doctor.isAI) {
      return Container(
        width: 56,
        height: 56,
        decoration: BoxDecoration(
          color: AppColors.mintGreenLight,
          borderRadius: BorderRadius.circular(12),
        ),
        child: const Icon(
          Icons.smart_toy_outlined,
          color: AppColors.mintGreenDark,
          size: 28,
        ),
      );
    }

    if (doctor.imagePath != null) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: Image.asset(
          doctor.imagePath!,
          width: 56,
          height: 56,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => _Placeholder(),
        ),
      );
    }

    return _Placeholder();
  }
}

class _Placeholder extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: 56,
      height: 56,
      decoration: BoxDecoration(
        color: AppColors.therapyBlueLight,
        borderRadius: BorderRadius.circular(12),
      ),
      child: const Icon(
        Icons.person_outline_rounded,
        color: AppColors.therapyBlue,
        size: 28,
      ),
    );
  }
}

// ─── Step 4: Caregiver info ───────────────────────────────────────────────────

class _Step4Caregiver extends StatelessWidget {
  const _Step4Caregiver({required this.controller});
  final RegisterController controller;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(24, 32, 24, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Caregiver information',
            textAlign: TextAlign.center,
            style: AppText.heading2.copyWith(
              color: AppColors.navyObsidian,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Help us keep your caregiver informed',
            textAlign: TextAlign.center,
            style: AppText.body.copyWith(color: AppColors.mutedText),
          ),
          const SizedBox(height: 36),

          Text('Caregiver\'s full name', style: AppText.label),
          const SizedBox(height: 8),
          AuthTextField(
            controller: controller.caregiverNameController,
            hint: 'Enter full name',
            keyboardType: TextInputType.name,
          ),
          const SizedBox(height: 24),

          Text('Relationship to you', style: AppText.label),
          const SizedBox(height: 8),
          AuthTextField(
            controller: controller.caregiverRelationController,
            hint: 'e.g. Spouse, Parent, Sibling',
            keyboardType: TextInputType.text,
          ),
          const SizedBox(height: 24),

          Text('Phone number', style: AppText.label),
          const SizedBox(height: 8),
          AuthTextField(
            controller: controller.caregiverPhoneController,
            hint: '+1 000 000 0000',
            keyboardType: TextInputType.phone,
          ),

          const SizedBox(height: 48),

          FilledButton(
            onPressed: controller.complete,
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.mintGreen,
              foregroundColor: AppColors.navyObsidian,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: Text(
              'Complete',
              style: AppText.body.copyWith(fontWeight: FontWeight.w700),
            ),
          ),
        ],
      ),
    );
  }
}
